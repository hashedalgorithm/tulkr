import type {
  TMessagePayloadRequest,
  TMessagePayloadResponse,
  TParsedSubtitle
} from "@/types"
import cssText from "data-text:~globals.css"
import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useMemo, useState } from "react"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

const styleElement = document.createElement("style")

/**
 * Generates a style element with adjusted CSS to work correctly within a Shadow DOM.
 *
 * Tailwind CSS relies on `rem` units, which are based on the root font size (typically defined on the <html>
 * or <body> element). However, in a Shadow DOM (as used by Plasmo), there is no native root element, so the
 * rem values would reference the actual page's root font size—often leading to sizing inconsistencies.
 *
 * To address this, we:
 * 1. Replace the `:root` selector with `:host(plasmo-csui)` to properly scope the styles within the Shadow DOM.
 * 2. Convert all `rem` units to pixel values using a fixed base font size, ensuring consistent styling
 *    regardless of the host page's font size.
 */
export const getStyle = (): HTMLStyleElement => {
  const baseFontSize = 16

  let updatedCssText = cssText.replaceAll(":root", ":host(plasmo-csui)")
  const remRegex = /([\d.]+)rem/g
  updatedCssText = updatedCssText.replace(remRegex, (match, remValue) => {
    const pixelsValue = parseFloat(remValue) * baseFontSize

    return `${pixelsValue}px`
  })

  styleElement.textContent = updatedCssText

  return styleElement
}

type TSubtitle = {
  parsedSubtitles: TParsedSubtitle[]
  fileName: string
}

const ContentUI = () => {
  const [subtitle, setSubtitle] = useState<TSubtitle | undefined>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [timeouts, setTimeouts] = useState<NodeJS.Timeout[]>([])

  const innerText = useMemo(() => {
    if (!isPlaying) return "Subtitles preview: Your subs will be playing here"

    if (subtitle.fileName) return `Found subtitles from - ${subtitle.fileName}`

    return "Playing subs"
  }, [isPlaying, subtitle?.fileName])

  const listenerOnPlay = useCallback(function (this: Document, event: Event) {
    setIsPlaying(true)
    console.log("Something is poaying")
  }, [])

  const listerOnMessages = useCallback(
    async (req: TMessagePayloadRequest, res: TMessagePayloadResponse) => {
      switch (req.type) {
        case "sub-init": {
          setSubtitle({
            parsedSubtitles: req.subs,
            fileName: req.fileName
          })

          chrome.runtime.sendMessage<TMessagePayloadResponse>({
            type: "ack-sub-init",
            status: "success"
          })
          return
        }
        case "sub-clear": {
          setSubtitle(undefined)

          chrome.runtime.sendMessage<TMessagePayloadResponse>({
            type: "ack-sub-clear",
            status: "success"
          })

          return
        }
        default: {
          chrome.runtime.sendMessage<TMessagePayloadResponse>({
            type: `ack-error`,
            status: "fail"
          })
          return
        }
      }
    },
    []
  )

  useEffect(() => {
    if (!document) return

    document.addEventListener("play", listenerOnPlay)

    return () => document.removeEventListener("play", listenerOnPlay)
  }, [listenerOnPlay])

  return (
    <div className="font-notosans fixed w-dvw h-fit bottom-10 px-8 py-4 flex justify-center items-center z-[9999999999] select-none pointer-events-none">
      <p className="text-xl font-medium text-center text-sub-foreground pointer-events-none select-none mix-blend-multiply">
        {innerText}
      </p>
    </div>
  )
}

export default ContentUI
