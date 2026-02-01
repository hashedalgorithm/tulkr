import type { TParsedSubtitle } from "@/types"

export const parseSubtitles = (text: string): Array<TParsedSubtitle> => {
  return text
    .replace(/\r/g, "")
    .split("\n\n")
    .map((block, idx) => {
      const lines = block.split("\n")
      if (lines.length < 2) return null

      const timeLine = lines.find((l) => l.includes("-->"))

      if (!timeLine) return null
      const [start, end] = timeLine.split(" --> ")

      return {
        id: idx,
        startAt: toSeconds(start),
        endAt: toSeconds(end),
        text: lines.slice(lines.indexOf(timeLine) + 1).join(" ")
      } satisfies TParsedSubtitle
    })
    .filter((sub): sub is TParsedSubtitle => sub !== null)
}

const toSeconds = (time: string) => {
  const [h, m, s] = time.replace(",", ".").split(":")
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

export const findLastCueStartingBeforeOrAt = (
  cueStartTimesSec: number[],
  timeSec: number
): number => {
  let low = 0
  let high = cueStartTimesSec.length - 1
  let bestIndex = -1

  while (low <= high) {
    const mid = (low + high) >> 1
    if (cueStartTimesSec[mid] <= timeSec) {
      bestIndex = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return bestIndex
}
