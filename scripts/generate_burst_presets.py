#!/usr/bin/env python3
"""从 avatarCatalog.json 生成 70 张头像的拍一拍特效 preset。"""

from __future__ import annotations

import json
import re
from copy import deepcopy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "src/constants/avatarCatalog.json"
OUT = ROOT / "src/constants/avatarBurstPresets.json"

CATEGORY_TEMPLATES: dict[str, dict] = {
    "01-慵懒佛系": {
        "motion": "fall",
        "overlayColor": "rgba(160, 160, 160, 0.28)",
        "accentColors": ["#bdbdbd", "#9e9e9e", "#757575", "#eceff1"],
        "emojiPool": ["💤", "😮‍💨", "🫠", "zzz"],
        "maxParticles": 88,
        "spawnRate": 9,
        "avatarWeight": 0.42,
        "bgPulse": 0.08,
    },
    "02-呆萌治愈": {
        "motion": "rise",
        "overlayColor": "rgba(224, 247, 255, 0.36)",
        "accentColors": ["#7ec8e3", "#ffb6c1", "#ffffff", "#a8dff5"],
        "emojiPool": ["💗", "🫧", "✨", "🌸"],
        "maxParticles": 105,
        "spawnRate": 13,
        "avatarWeight": 0.44,
        "bgPulse": 0.14,
    },
    "03-搞怪抽象": {
        "motion": "burst",
        "overlayColor": "rgba(255, 120, 40, 0.22)",
        "accentColors": ["#ff6a00", "#ff9500", "#2d4a8a", "#ffffff"],
        "emojiPool": ["😱", "💥", "❓", "🌀"],
        "textPool": ["!", "!!", "?!", "啊"],
        "maxParticles": 118,
        "spawnRate": 20,
        "avatarWeight": 0.4,
        "bgPulse": 0.48,
    },
    "04-高冷酷飒": {
        "motion": "fall",
        "overlayColor": "rgba(30, 30, 40, 0.32)",
        "accentColors": ["#1a1a2e", "#4a4a6a", "#c0c0c0", "#ffffff"],
        "emojiPool": ["🖤", "🌙", "✦", "·"],
        "maxParticles": 95,
        "spawnRate": 11,
        "avatarWeight": 0.38,
        "bgPulse": 0.12,
    },
    "05-知性文艺": {
        "motion": "swirl",
        "overlayColor": "rgba(180, 200, 255, 0.24)",
        "accentColors": ["#5c6bc0", "#7986cb", "#fff8e1", "#ffffff"],
        "emojiPool": ["📖", "🔍", "✨", "💡"],
        "maxParticles": 100,
        "spawnRate": 12,
        "avatarWeight": 0.4,
        "bgPulse": 0.18,
    },
    "06-活泼沙雕": {
        "motion": "bounce",
        "overlayColor": "rgba(255, 60, 60, 0.16)",
        "accentColors": ["#ff3333", "#ffd700", "#ff6666", "#ffffff"],
        "emojiPool": ["🎉", "🔥", "♪", "✨"],
        "maxParticles": 128,
        "spawnRate": 17,
        "avatarWeight": 0.46,
        "bgPulse": 0.32,
    },
    "07-暴躁硬核": {
        "motion": "burst",
        "overlayColor": "rgba(255, 40, 20, 0.35)",
        "accentColors": ["#d32f2f", "#ff5722", "#ffeb3b", "#ffffff"],
        "emojiPool": ["💢", "🔥", "💥", "⚡"],
        "textPool": ["!", "!!", "哼", "啊"],
        "maxParticles": 125,
        "spawnRate": 22,
        "avatarWeight": 0.42,
        "bgPulse": 0.55,
    },
    "08-忧郁敏感": {
        "motion": "fall",
        "overlayColor": "rgba(100, 140, 200, 0.3)",
        "accentColors": ["#5c7cfa", "#748ffc", "#adb5bd", "#ffffff"],
        "emojiPool": ["💧", "🥺", "🌧", "…"],
        "maxParticles": 92,
        "spawnRate": 10,
        "avatarWeight": 0.4,
        "bgPulse": 0.1,
    },
    "09-机械科技": {
        "motion": "swirl",
        "overlayColor": "rgba(0, 220, 255, 0.18)",
        "accentColors": ["#00bcd4", "#26c6da", "#4dd0e1", "#ffffff"],
        "emojiPool": ["⚙", "▣", "◈", "⌁"],
        "maxParticles": 112,
        "spawnRate": 14,
        "avatarWeight": 0.45,
        "bgPulse": 0.22,
    },
    "10-邪萌腹黑": {
        "motion": "bounce",
        "overlayColor": "rgba(120, 40, 160, 0.26)",
        "accentColors": ["#7b1fa2", "#9c27b0", "#ff4081", "#ffffff"],
        "emojiPool": ["😈", "👀", "✨", "♠"],
        "maxParticles": 110,
        "spawnRate": 15,
        "avatarWeight": 0.43,
        "bgPulse": 0.28,
    },
}

EMOTION_OVERRIDES: dict[str, dict] = {
    "害羞": {"motion": "rise", "emojiPool": ["💗", "🫧", "🐟", "✨"], "bgPulse": 0.12},
    "温柔": {"motion": "rise", "emojiPool": ["🌸", "💗", "✨"], "bgPulse": 0.1},
    "呆萌": {"motion": "rise", "emojiPool": ["🥺", "✨", "💫"], "bgPulse": 0.12},
    "嗨唱": {"motion": "bounce", "emojiPool": ["♪", "♫", "🎵", "🎧"], "spawnRate": 19},
    "嗨皮": {"motion": "bounce", "emojiPool": ["🎉", "🎊", "✨"], "spawnRate": 18},
    "狂喜": {"motion": "bounce", "emojiPool": ["🤣", "🎉", "!!!"], "spawnRate": 20, "bgPulse": 0.4},
    "开心": {"motion": "bounce", "emojiPool": ["😄", "✨", "🎉"], "spawnRate": 16},
    "快乐": {"motion": "bounce", "emojiPool": ["😊", "✨", "🌈"], "spawnRate": 16},
    "得意": {"motion": "bounce", "emojiPool": ["😎", "✨", "👑"], "spawnRate": 15},
    "冒险": {"motion": "bounce", "emojiPool": ["🚀", "⭐", "✨"], "spawnRate": 17},
    "惊恐": {"motion": "burst", "textPool": ["!", "!!", "?!", "啊"], "emojiPool": ["😱", "💥"], "bgPulse": 0.52},
    "崩溃": {"motion": "burst", "textPool": ["!", "!!", "啊", "…"], "emojiPool": ["😱", "💥"], "bgPulse": 0.5},
    "懵圈": {"motion": "swirl", "emojiPool": ["❓", "🌀", "…"], "textPool": ["?", "??", "啊?"]},
    "惊讶": {"motion": "burst", "textPool": ["!", "?!", "哇"], "emojiPool": ["😲", "✨"]},
    "抓狂": {"motion": "burst", "textPool": ["!", "!!", "啊"], "emojiPool": ["💢", "😤"], "bgPulse": 0.45},
    "暴怒": {"motion": "burst", "textPool": ["!", "!!", "哼"], "emojiPool": ["💢", "🔥", "💥"], "bgPulse": 0.58},
    "委屈": {"motion": "fall", "emojiPool": ["🥺", "💧", "…"], "bgPulse": 0.08},
    "受伤": {"motion": "fall", "emojiPool": ["🥺", "💧", "🩹"], "bgPulse": 0.08},
    "郁闷": {"motion": "fall", "emojiPool": ["😔", "💧", "…"], "bgPulse": 0.08},
    "摆烂": {"motion": "fall", "emojiPool": ["🫠", "💤", "zzz"], "spawnRate": 8},
    "躺平": {"motion": "fall", "emojiPool": ["🫠", "💤", "zzz"], "spawnRate": 7},
    "疲惫": {"motion": "fall", "emojiPool": ["😮‍💨", "💤", "zzz"], "spawnRate": 8},
    "无聊": {"motion": "fall", "emojiPool": ["😑", "…", "zzz"], "spawnRate": 7},
    "禅定": {"motion": "rise", "emojiPool": ["🧘", "☁", "✨"], "spawnRate": 8, "bgPulse": 0.06},
    "推理": {"motion": "swirl", "emojiPool": ["🔍", "🕵", "💡"], "spawnRate": 11},
    "好奇": {"motion": "swirl", "emojiPool": ["❓", "👀", "✨"], "spawnRate": 12},
    "好学": {"motion": "swirl", "emojiPool": ["📚", "✏", "💡"], "spawnRate": 11},
    "文艺": {"motion": "swirl", "emojiPool": ["📖", "🎨", "✨"], "spawnRate": 10},
    "认真": {"motion": "swirl", "emojiPool": ["✏", "📋", "✓"], "spawnRate": 10},
    "邪笑": {"motion": "bounce", "emojiPool": ["😈", "👀", "✨"], "bgPulse": 0.3},
    "邪萌": {"motion": "bounce", "emojiPool": ["😈", "💜", "✨"], "bgPulse": 0.28},
    "神秘": {"motion": "swirl", "emojiPool": ["🌙", "✦", "👁"], "bgPulse": 0.15},
    "酷飒": {"motion": "fall", "emojiPool": ["🖤", "😎", "✦"], "bgPulse": 0.14},
    "冷峻": {"motion": "fall", "emojiPool": ["🖤", "·", "✦"], "bgPulse": 0.1},
    "优雅": {"motion": "rise", "emojiPool": ["✨", "🌹", "♡"], "bgPulse": 0.12},
    "安静": {"motion": "rise", "emojiPool": ["🤖", "▣", "·"], "spawnRate": 10},
    "冷静": {"motion": "swirl", "emojiPool": ["▣", "◈", "·"], "spawnRate": 10},
    "过载": {"motion": "burst", "emojiPool": ["⚡", "▣", "!!"], "textPool": ["!", "!!"], "bgPulse": 0.35},
    "空白": {"motion": "rise", "emojiPool": ["□", "▢", "·"], "spawnRate": 9},
    "紧张": {"motion": "burst", "textPool": ["!", "…"], "emojiPool": ["😰", "💦"], "bgPulse": 0.35},
}


def stem(filename: str) -> str:
    return re.sub(r"\.(jpe?g|png|webp)$", "", filename, flags=re.I)


def emotion_tags(filename: str) -> str:
    parts = stem(filename).split("-")
    return " · ".join(parts)


def build_preset(item: dict) -> dict:
    category = item["分类"]
    filename = item["新文件名"]
    name = stem(filename)
    prefix = name.split("-")[0]

    preset = deepcopy(CATEGORY_TEMPLATES[category])
    if prefix in EMOTION_OVERRIDES:
        preset.update(EMOTION_OVERRIDES[prefix])

    preset.update(
        {
            "id": name,
            "filename": filename,
            "name": name,
            "category": category,
            "emotion": emotion_tags(filename),
            "avatarSrc": f"avatar-effects/{name}.png",
        }
    )
    return preset


def main() -> None:
    catalog = json.loads(CATALOG.read_text(encoding="utf-8"))
    presets = [build_preset(item) for item in catalog["文件"]]
    OUT.write_text(
        json.dumps({"version": 1, "presets": presets}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"Wrote {len(presets)} presets → {OUT}")


if __name__ == "__main__":
    main()
