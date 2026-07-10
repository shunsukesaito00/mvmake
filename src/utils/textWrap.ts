/** 字幕向けの1行あたり最大文字数（全角基準） */
export const SUBTITLE_MAX_CHARS_PER_LINE = 18

const SUBTITLE_BREAK_AFTER = /[、。，．！？!?…\s]/

export function wrapSubtitleLine(line: string, maxChars = SUBTITLE_MAX_CHARS_PER_LINE): string[] {
  const trimmed = line.trim()
  if (!trimmed) return ['']
  if (trimmed.length <= maxChars) return [trimmed]

  const lines: string[] = []
  let rest = trimmed
  while (rest.length > maxChars) {
    const segment = rest.slice(0, maxChars)
    let breakAt = maxChars
    const minBreak = Math.max(4, Math.floor(maxChars * 0.45))
    for (let i = segment.length - 1; i >= minBreak; i--) {
      if (SUBTITLE_BREAK_AFTER.test(segment[i] ?? '')) {
        breakAt = i + 1
        break
      }
    }
    lines.push(rest.slice(0, breakAt).trimEnd())
    rest = rest.slice(breakAt).trimStart()
  }
  if (rest) lines.push(rest)
  return lines
}

/** 明示改行を保ちつつ長い行を折り返す */
export function wrapSubtitleText(content: string, maxChars = SUBTITLE_MAX_CHARS_PER_LINE): string {
  return content
    .split('\n')
    .flatMap((paragraph) => wrapSubtitleLine(paragraph, maxChars))
    .join('\n')
}

export function formatTimelineTextLabel(content: string, maxLength = 42): string {
  const flat = content.replace(/\s*\n\s*/g, ' / ').replace(/\s+/g, ' ').trim()
  if (flat.length <= maxLength) return flat
  return `${flat.slice(0, maxLength - 1)}…`
}

export function wrapLineByCanvasWidth(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number,
): string[] {
  if (!line) return ['']
  if (ctx.measureText(line).width <= maxWidth) return [line]

  const lines: string[] = []
  let buffer = ''
  for (const char of line) {
    const next = buffer + char
    if (ctx.measureText(next).width > maxWidth && buffer) {
      lines.push(buffer)
      buffer = char
    } else {
      buffer = next
    }
  }
  if (buffer) lines.push(buffer)
  return lines
}

/** Canvas 幅に収まるよう各行を折り返す */
export function wrapTextLinesToCanvasWidth(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  maxWidth: number,
): string[] {
  return lines.flatMap((line) => wrapLineByCanvasWidth(ctx, line, maxWidth))
}
