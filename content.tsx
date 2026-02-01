import { type TSession } from "@/lib/indexed-db"
import {
  sendMessageInRuntime,
  type TContentMessageActions,
  type TMessageBody,
  type TWORKER_PAYLOAD_REQ_END,
  type TWORKER_PAYLOAD_REQ_INIT,
  type TWORKER_PAYLOAD_RES_GET_ACTIVE,
  type TWORKER_PAYLOAD_RES_GET_TABID,
  type TWorkerMessageActions
} from "@/lib/message"
import ExtensionLocalStorage, {
  STORAGE_KEY_IS_WORKER_ACTIVE
} from "@/lib/storage"
import { parseSubtitles } from "@/lib/subs"
import type { TParsedSubtitle } from "@/types"
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

const ContentUI = () => {
  const storage = new ExtensionLocalStorage("content")
  const [tabId, setTabId] = useState<number | undefined>()
  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const [currentSession, setCurrentSession] = useState<TSession>(undefined)
  const [parsedSubtitles, setParsedSubtitle] = useState<TParsedSubtitle[]>([])

  const [isPlaying, setIsPlaying] = useState(false)
  const [timeouts, setTimeouts] = useState<NodeJS.Timeout[]>([])

  const innerText = useMemo(() => {
    if (!currentSession)
      return "Subtitles preview: Your subs will be playing here"

    return `Found subtitles from - ${currentSession.rawSubtitles.fileName}`
  }, [currentSession])

  const listenerOnPlay = useCallback(function (this: Document, event: Event) {
    setIsPlaying(true)
    console.log("Something is poaying")
  }, [])

  const processRawFile = useCallback(
    (textBlob: string) => {
      setParsedSubtitle(parseSubtitles(textBlob))
    },
    [parseSubtitles]
  )

  const listerOnMessages = useCallback(
    async (message: TMessageBody<TWorkerMessageActions>) => {
      if (message.to !== "content" || message.from !== "worker") return

      switch (message.type) {
        case "req:session:init": {
          const session = message.payload as TWORKER_PAYLOAD_REQ_INIT
          setCurrentSession(session)
          processRawFile(session.rawSubtitles.raw)
          return
        }
        case "req:session:end": {
          const payload = message.payload as TWORKER_PAYLOAD_REQ_END
          if (payload.sessionId !== currentSession?.sessionId) return

          setCurrentSession(undefined)
          setParsedSubtitle([])
          return
        }
        case "res:session:get-active": {
          const session = message.payload as TWORKER_PAYLOAD_RES_GET_ACTIVE

          setCurrentSession(session)
          processRawFile(session.rawSubtitles.raw)
          return
        }
        case "res:tab-id:get": {
          const payload = message.payload as TWORKER_PAYLOAD_RES_GET_TABID

          setTabId(payload.tabId)
          return
        }
        default: {
          console.error("Invalid message payload received!")
          return
        }
      }
    },
    [processRawFile]
  )

  useEffect(() => {
    if (isWorkerReady) return

    storage.get<boolean>(STORAGE_KEY_IS_WORKER_ACTIVE).then((value) => {
      setIsWorkerReady(value)
    })
  }, [isWorkerReady])

  useEffect(() => {
    if (tabId || !isWorkerReady) return

    sendMessageInRuntime<TContentMessageActions>({
      type: "req:tab-id:get",
      from: "content",
      to: "worker",
      payload: {}
    })
  }, [tabId, isWorkerReady])

  useEffect(() => {
    if (!tabId || !!currentSession || !isWorkerReady) return

    sendMessageInRuntime<TContentMessageActions>({
      type: "req:session:get-active",
      from: "content",
      to: "worker",
      payload: {}
    })
  }, [currentSession, isWorkerReady, tabId])

  useEffect(() => {
    chrome.runtime.onMessage.addListener(listerOnMessages)

    return () => chrome.runtime.onMessage.removeListener(listerOnMessages)
  }, [listerOnMessages])

  useEffect(() => {
    document.addEventListener("play", listenerOnPlay)

    return () => document.removeEventListener("play", listenerOnPlay)
  }, [listenerOnPlay])

  if (!isWorkerReady || !currentSession?.tabId || !tabId) return <></>
  if (currentSession?.tabId !== tabId) return <></>

  console.log("hello")
  console.log(isWorkerReady, tabId, currentSession)
  return (
    <div className="pointer-events-none fixed bottom-10 z-[9999999999] flex h-fit w-dvw select-none items-center justify-center px-8 py-4 font-notosans">
      <p className="pointer-events-none select-none text-center text-xl font-medium text-sub-foreground mix-blend-multiply">
        {innerText}
      </p>
    </div>
  )
}

export default ContentUI
