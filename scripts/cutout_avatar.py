#!/usr/bin/env python3
"""头像抠图：rembg 多模型 + 背景类型自适应 + OpenCV alpha 精修。"""

from __future__ import annotations

import io
import json
from collections import deque
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageOps
from rembg import new_session, remove

MODELS = ("isnet-general-use", "u2net", "silueta")
TARGET = 256


def load_rgb(path: Path) -> Image.Image:
    return ImageOps.exif_transpose(Image.open(path).convert("RGB"))


def border_pixels(rgb: np.ndarray) -> np.ndarray:
    return np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]], axis=0)


def corner_bg_color(rgb: np.ndarray) -> np.ndarray:
    return np.median(border_pixels(rgb).astype(np.float32), axis=0)


def detect_bg_type(rgb: np.ndarray) -> str:
    border = border_pixels(rgb).astype(np.float32)
    mean = border.mean(axis=0)
    med = np.median(border, axis=0)
    if float(mean[0] - mean[1]) > 22 and float(mean[0]) > 130:
        return "red"
    if float(med.mean()) > 238 and float(mean.mean()) > 232:
        return "white"
    return "complex"


def score_alpha(alpha: np.ndarray) -> float:
    ratio = float((alpha > 128).mean())
    if ratio < 0.05 or ratio > 0.96:
        return -1.0
    binary = (alpha > 48).astype(np.uint8)
    n, _, stats, _ = cv2.connectedComponentsWithStats(binary)
    if n <= 1:
        return -1.0
    areas = stats[1:, cv2.CC_STAT_AREA]
    main = int(areas.max())
    if main < 500 or main / max(int(binary.sum()), 1) < 0.68:
        return -1.0
    return (main / alpha.size) * (1.0 - abs(ratio - 0.35))


def rembg_alpha(raw: bytes, model: str) -> np.ndarray:
    session = new_session(model)
    im = Image.open(io.BytesIO(remove(raw, session=session))).convert("RGBA")
    return np.array(im.split()[-1])


def fallback_alpha(rgb: np.ndarray, bg_type: str) -> np.ndarray:
    bg = corner_bg_color(rgb)
    dist = np.linalg.norm(rgb.astype(np.float32) - bg, axis=-1)
    if bg_type == "red":
        r, g, b = rgb[..., 0].astype(np.float32), rgb[..., 1], rgb[..., 2]
        red = (r - np.maximum(g, b) > 20) & (r > 90)
        alpha = np.where(red, 0, 255).astype(np.float32)
        alpha = np.minimum(alpha, np.clip(dist / 45 * 255, 0, 255))
    else:
        alpha = np.clip((dist - 10) / 42 * 255, 0, 255)
    return largest_component(alpha.astype(np.uint8))


def pick_rembg_alpha(raw: bytes) -> tuple[np.ndarray, str]:
    best: np.ndarray | None = None
    best_score = -1.0
    best_model = MODELS[0]
    for model in MODELS:
        try:
            alpha = rembg_alpha(raw, model)
            s = score_alpha(alpha)
            if s > best_score:
                best_score = s
                best = alpha
                best_model = model
        except Exception:
            pass
    if best is None:
        raise RuntimeError("rembg 失败")
    return best, best_model


def pick_alpha(raw: bytes, rgb: np.ndarray, bg_type: str) -> tuple[np.ndarray, str]:
    try:
        return pick_rembg_alpha(raw)
    except RuntimeError:
        return fallback_alpha(rgb, bg_type), "fallback-chroma"


def border_connected_mask(condition: np.ndarray) -> np.ndarray:
    """从四边出发，标记与边界连通且满足 condition 的像素。"""
    h, w = condition.shape
    seen = np.zeros((h, w), dtype=bool)
    q: deque[tuple[int, int]] = deque()
    for x in range(w):
        for y in (0, h - 1):
            if condition[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if condition[y, x] and not seen[y, x]:
                seen[y, x] = True
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and condition[ny, nx] and not seen[ny, nx]:
                seen[ny, nx] = True
                q.append((nx, ny))
    return seen


def red_spill_mask(rgb: np.ndarray) -> np.ndarray:
    rgbf = rgb.astype(np.float32)
    r, g, b = rgbf[..., 0], rgbf[..., 1], rgbf[..., 2]
    return (r - np.maximum(g, b) > 24) & (r > 95)


def largest_component(alpha: np.ndarray) -> np.ndarray:
    binary = (alpha > 36).astype(np.uint8)
    n, labels, stats, _ = cv2.connectedComponentsWithStats(binary)
    if n <= 1:
        return alpha
    keep = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    mask = labels == keep
    out = np.where(mask, alpha, 0).astype(np.uint8)
    for i in range(1, n):
        if i != keep and stats[i, cv2.CC_STAT_AREA] < 64:
            out[labels == i] = 0
    return out


def refine_alpha(alpha: np.ndarray, rgb: np.ndarray, bg_type: str) -> np.ndarray:
    a = alpha.astype(np.float32)

    if bg_type == "white":
        near_white = rgb.min(axis=-1) > 235
        border_white = border_connected_mask(near_white)
        a[border_white] = np.minimum(a[border_white], 8)
    elif bg_type == "red":
        spill = border_connected_mask(red_spill_mask(rgb))
        a[spill] = np.minimum(a[spill], 6)

    a = largest_component(a.astype(np.uint8))
    a = cv2.bilateralFilter(a, 5, 40, 40)
    _, a = cv2.threshold(a, 10, 255, cv2.THRESH_TOZERO)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    a = cv2.morphologyEx(a, cv2.MORPH_CLOSE, k, 1)
    a = cv2.GaussianBlur(a, (3, 3), 0.5)
    return a


def decontaminate(rgba: np.ndarray, rgb: np.ndarray) -> np.ndarray:
    bg = corner_bg_color(rgb)
    a = rgba[..., 3].astype(np.float32)
    edge = (a > 16) & (a < 235)
    if not edge.any():
        return rgba
    an = np.maximum(a[edge, None] / 255, 0.12)
    fg = (rgba[edge, :3].astype(np.float32) - (1 - an) * bg) / an
    out = rgba.copy()
    out[edge, :3] = np.clip(fg, 0, 255)
    return out


def trim_and_square(rgba: Image.Image, target: int = TARGET) -> Image.Image:
    bbox = rgba.getbbox()
    if bbox:
        rgba = rgba.crop(bbox)
    w, h = rgba.size
    side = max(w, h)
    pad = max(4, int(side * 0.05))
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    canvas.paste(rgba, ((side + pad * 2 - w) // 2, (side + pad * 2 - h) // 2), rgba)
    return canvas.resize((target, target), Image.Resampling.LANCZOS)


def cutout_file(src: Path, dst: Path) -> dict:
    rgb_im = load_rgb(src)
    rgb = np.array(rgb_im)
    raw = src.read_bytes()
    bg_type = detect_bg_type(rgb)

    ml, model = pick_alpha(raw, rgb, bg_type)
    if ml.shape[:2] != rgb.shape[:2]:
        ml = np.array(Image.fromarray(ml).resize(rgb_im.size, Image.Resampling.LANCZOS))

    alpha = refine_alpha(ml, rgb, bg_type)
    rgba = np.dstack([rgb, alpha])
    rgba = decontaminate(rgba, rgb)
    out = trim_and_square(Image.fromarray(rgba, "RGBA"))
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, optimize=True)

    a = np.array(out.split()[-1])
    return {
        "source": src.name,
        "output": dst.name,
        "bg_type": bg_type,
        "model": model,
        "opaque_percent": round(float((a > 128).mean()) * 100, 1),
    }


def collect_sources() -> list[tuple[Path, Path]]:
    root = Path(__file__).resolve().parents[1]
    presets_dir = root / "public" / "avatars" / "presets"
    out_dir = root / "public" / "avatar-effects"
    pairs: list[tuple[Path, Path]] = []
    for jpg in sorted(presets_dir.rglob("*.jpg")):
        pairs.append((jpg, out_dir / f"{jpg.stem}.png"))
    seen = {src.stem for src, _ in pairs}
    for jpg in sorted(out_dir.glob("*.jpg")):
        if jpg.stem not in seen:
            pairs.append((jpg, out_dir / f"{jpg.stem}.png"))
    return pairs


def main() -> None:
    import sys

    force = "--force" in sys.argv
    pairs = collect_sources()
    out_dir = Path(__file__).resolve().parents[1] / "public" / "avatar-effects"
    results: list[dict] = []
    total = len(pairs)

    for i, (src, dst) in enumerate(pairs, 1):
        if dst.exists() and not force:
            print(json.dumps({"skip": dst.name, "index": f"{i}/{total}"}, ensure_ascii=False))
            continue
        print(json.dumps({"start": src.name, "index": f"{i}/{total}"}, ensure_ascii=False), flush=True)
        try:
            info = cutout_file(src, dst)
            info["index"] = f"{i}/{total}"
            results.append(info)
            print(json.dumps(info, ensure_ascii=False), flush=True)
        except Exception as e:
            err = {"error": src.name, "message": str(e), "index": f"{i}/{total}"}
            results.append(err)
            print(json.dumps(err, ensure_ascii=False), flush=True)

    (out_dir / "cutout-manifest.json").write_text(
        json.dumps({"files": results, "total": total}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(json.dumps({"done": True, "processed": len(results), "total": total}, ensure_ascii=False))


if __name__ == "__main__":
    main()
