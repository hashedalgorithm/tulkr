import type { Subtitle } from "@/contexts/subtitle-context"

export const parseSubtitles = (text: string): Array<Subtitle> => {
  return text
    .replace(/\r/g, "")
    .split("\n\n")
    .map((block) => {
      const lines = block.split("\n")
      if (lines.length < 2) return null

      const timeLine = lines.find((l) => l.includes("-->"))

      if (!timeLine) return null
      const [start, end] = timeLine.split(" --> ")

      return {
        id: 1,
        startAt: toSeconds(start),
        endAt: toSeconds(end),
        text: lines.slice(lines.indexOf(timeLine) + 1).join(" ")
      } satisfies Subtitle
    })
    .filter((sub): sub is Subtitle => sub !== null)
}

const toSeconds = (time: string) => {
  const [h, m, s] = time.replace(",", ".").split(":")
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}
