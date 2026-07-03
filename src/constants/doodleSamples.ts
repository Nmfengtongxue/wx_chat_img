import type { DoodleMessage, DoodleSettings } from '../types/doodle'
import { DEFAULT_FONT_PRESET, fontPresetToSettings } from '../utils/fonts'

const uid = () => crypto.randomUUID()

export function createSleepMessages(): DoodleMessage[] {
  return [
    { id: uid(), userId: 'left', content: '我又没睡着！' },
    { id: uid(), userId: 'right', content: '碰上容易的觉就睡了吧。' },
    { id: uid(), userId: 'right', content: '那些想不明白的问题，' },
    { id: uid(), userId: 'right', content: '可以等大姨妈、智齿发炎、感冒、过敏，' },
    { id: uid(), userId: 'right', content: '来问候你的时候，' },
    { id: uid(), userId: 'right', content: '跟它们一块儿彻夜长谈。' },
    { id: uid(), userId: 'left', content: '它们懂个屁！' },
  ]
}

export function createSlippersMessages(): DoodleMessage[] {
  return [
    { id: uid(), userId: 'left', content: '看我的新拖鞋！' },
    { id: uid(), userId: 'right', content: '你不是已经有两双了吗？怎么还买？' },
    { id: uid(), userId: 'left', content: '没办法！已经砸你四次了。' },
    { id: uid(), userId: 'right', content: '你真以为我会怕37码的EVA人字拖？' },
    { id: uid(), userId: 'left', content: '我知道你不怕！所以我买了38码的。' },
  ]
}

export const SLEEP_SAMPLE_SETTINGS: Partial<DoodleSettings> = {
  timeHour: '04',
  timeMinute: '47',
  timeSeparator: ':',
  showTopTime: true,
  font: fontPresetToSettings(DEFAULT_FONT_PRESET),
  bubbleColor: '#76D14D',
  avatarFrameStyle: 'classic',
  bubbleFrameStyle: 'classic',
}

export const SLIPPERS_SAMPLE_SETTINGS: Partial<DoodleSettings> = {
  timeHour: '12',
  timeMinute: '49',
  timeSeparator: ' : ',
  showTopTime: true,
  font: fontPresetToSettings(DEFAULT_FONT_PRESET),
  bubbleColor: '#76D14D',
  avatarFrameStyle: 'classic',
  bubbleFrameStyle: 'classic',
}

export type DoodleSampleId = 'sleep' | 'slippers'

export function applySample(id: DoodleSampleId) {
  if (id === 'sleep') {
    return {
      settings: { ...SLEEP_SAMPLE_SETTINGS },
      messages: createSleepMessages(),
    }
  }
  return {
    settings: { ...SLIPPERS_SAMPLE_SETTINGS },
    messages: createSlippersMessages(),
  }
}

export function createDefaultDoodleState(): {
  settings: DoodleSettings
  messages: DoodleMessage[]
} {
  const sample = applySample('sleep')
  return {
    settings: {
      timeHour: sample.settings.timeHour ?? '04',
      timeMinute: sample.settings.timeMinute ?? '47',
      timeSeparator: sample.settings.timeSeparator ?? ':',
      showTopTime: sample.settings.showTopTime ?? true,
      font: sample.settings.font ?? fontPresetToSettings(DEFAULT_FONT_PRESET),
      bubbleColor: sample.settings.bubbleColor ?? '#76D14D',
      canvasWidth: 390,
      avatarSize: 52,
      bubbleFontSize: 17,
      avatarFrameStyle: sample.settings.avatarFrameStyle ?? 'classic',
      bubbleFrameStyle: sample.settings.bubbleFrameStyle ?? 'classic',
    },
    messages: sample.messages,
  }
}
