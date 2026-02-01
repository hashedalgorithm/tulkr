import { type TSession } from "@/lib/indexed-db"
import {
  sendMessageInRuntime,
  type TCONTENT_PAYLOAD_REQ_GET_ACTIVE,
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
import { findLastCueStartingBeforeOrAt, parseSubtitles } from "@/lib/subs"
import cssText from "data-text:~globals.css"
import type { PlasmoCSConfig } from "plasmo"
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction
} from "react"

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

const useSubtitles = (
  currentSession: TSession | undefined,
  setCurrentCue: Dispatch<SetStateAction<string>>
) => {
  const [video, setVideo] = useState<HTMLVideoElement>(null)

  const parsedSubtitles = useMemo(() => {
    if (!currentSession) return []
    return parseSubtitles(currentSession?.rawSubtitles?.raw)
  }, [currentSession?.rawSubtitles?.raw])

  const cueStartTimesSec = useMemo(() => {
    if (parsedSubtitles.length === 0) return undefined
    return parsedSubtitles.map((c) => c.startAt)
  }, [parsedSubtitles])

  // These refs avoid re-rendering every frame.
  const rafIdRef = useRef<number | null>(null)
  const lastRenderedCueIdRef = useRef<number | null>(null)
  const lastRenderedTextRef = useRef<string>("")

  const syncTextToCurrentTime = useCallback(() => {
    const timeSec = video.currentTime

    const candidateIndex = findLastCueStartingBeforeOrAt(
      cueStartTimesSec,
      timeSec
    )

    let nextText = ""
    let nextCueId: number | null = null

    if (candidateIndex >= 0) {
      const cue = parsedSubtitles[candidateIndex]
      if (timeSec >= cue.startAt && timeSec <= cue.endAt) {
        nextText = cue.text
        nextCueId = cue.id
      }
    }

    if (
      nextCueId === lastRenderedCueIdRef.current &&
      nextText === lastRenderedTextRef.current
    ) {
      return
    }

    lastRenderedCueIdRef.current = nextCueId
    lastRenderedTextRef.current = nextText
    setCurrentCue(nextText)
  }, [video?.currentTime, cueStartTimesSec, setCurrentCue])

  const animationLoop = useCallback(() => {
    syncTextToCurrentTime()

    if (!video.paused && !video.ended) {
      rafIdRef.current = requestAnimationFrame(animationLoop)
    } else {
      rafIdRef.current = null
    }
  }, [video?.paused, video?.ended, parsedSubtitles, syncTextToCurrentTime])

  useEffect(() => {
    if (!video || !parsedSubtitles || !cueStartTimesSec) return

    const startLoopIfNeeded = () => {
      if (rafIdRef.current != null) return
      rafIdRef.current = requestAnimationFrame(animationLoop)
    }

    const stopLoopAndSyncOnce = () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      syncTextToCurrentTime()
    }

    const onPlay = () => startLoopIfNeeded()
    const onPause = () => stopLoopAndSyncOnce()
    const onSeeked = () => stopLoopAndSyncOnce()
    const onRateChange = () => syncTextToCurrentTime()
    const onPlaying = () => startLoopIfNeeded()

    video.addEventListener("play", onPlay)
    video.addEventListener("pause", onPause)
    video.addEventListener("seeked", onSeeked)
    video.addEventListener("ratechange", onRateChange)
    video.addEventListener("playing", onPlaying)

    // Initial sync + start loop if already playing
    syncTextToCurrentTime()
    if (!video.paused && !video.ended) {
      startLoopIfNeeded()
    }

    return () => {
      if (rafIdRef.current != null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      video.removeEventListener("playing", onPlaying)
      video.removeEventListener("play", onPlay)
      video.removeEventListener("pause", onPause)
      video.removeEventListener("seeked", onSeeked)
      video.removeEventListener("ratechange", onRateChange)
    }
  }, [video, parsedSubtitles, cueStartTimesSec])

  useEffect(() => {
    const obs = new MutationObserver(() => {
      const video = document.querySelector("video")
      if (!video) return
      setVideo(video)
      obs.disconnect()
    })

    obs.observe(document.documentElement, {
      childList: true,
      subtree: true
    })

    setTimeout(() => {
      obs.disconnect()
    }, 10000)

    return () => obs.disconnect()
  }, [])

  return {}
}

const placeholderCue = "Subtitles preview: Your subs will be playing here"
const defaultSessionCue = (fileName: string) =>
  `Found subtitles from - ${fileName}`

const ContentUI = () => {
  const storage = new ExtensionLocalStorage("content")
  const [tabId, setTabId] = useState<number | undefined>()
  const [currentCue, setCurrentCue] = useState(placeholderCue)
  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const [currentSession, setCurrentSession] = useState<TSession>(undefined)

  const {} = useSubtitles(currentSession, setCurrentCue)

  const listerOnMessages = useCallback(
    async (message: TMessageBody<TWorkerMessageActions>) => {
      if (message.to !== "content" || message.from !== "worker") return

      switch (message.type) {
        case "req:session:init": {
          const session = message.payload as TWORKER_PAYLOAD_REQ_INIT
          setCurrentSession(session)

          setCurrentCue(defaultSessionCue(session.rawSubtitles.fileName))
          return
        }
        case "req:session:end": {
          const payload = message.payload as TWORKER_PAYLOAD_REQ_END
          if (payload.sessionId !== currentSession?.sessionId) return

          setCurrentSession(undefined)
          setCurrentCue(placeholderCue)
          return
        }
        case "res:session:get-active": {
          const session = message.payload as TWORKER_PAYLOAD_RES_GET_ACTIVE

          setCurrentSession(session)
          if (!session) return

          setCurrentCue(defaultSessionCue(session.rawSubtitles.fileName))
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
    []
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

    sendMessageInRuntime<
      TContentMessageActions,
      TCONTENT_PAYLOAD_REQ_GET_ACTIVE
    >({
      type: "req:session:get-active",
      from: "content",
      to: "worker",
      payload: {
        tabId
      }
    })
  }, [currentSession, isWorkerReady, tabId])

  useEffect(() => {
    chrome.runtime.onMessage.addListener(listerOnMessages)

    return () => chrome.runtime.onMessage.removeListener(listerOnMessages)
  }, [listerOnMessages])

  if (!isWorkerReady || !currentSession?.tabId || !tabId) return <></>
  if (currentSession?.tabId !== tabId) return <></>

  return (
    <div className="pointer-events-none fixed bottom-10 z-[9999999999] flex h-fit w-dvw select-none items-center justify-center px-8 py-4 font-notosans">
      <p className="pointer-events-none select-none text-center text-xl font-medium text-sub-foreground mix-blend-multiply">
        {currentCue}
      </p>
    </div>
  )
}

export default ContentUI
