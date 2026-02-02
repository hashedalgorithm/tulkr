import type { SubtitleContextReducerState } from "@/contexts/subtitle-context"
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
  STORAGE_KEY_CONFIG,
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
  type CSSProperties,
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
  showSubtitles: boolean,
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

  const rafIdRef = useRef<number | null>(null)
  const lastRenderedCueIdRef = useRef<number | null>(null)
  const lastRenderedTextRef = useRef<string>("")

  const syncTextToCurrentTime = useCallback(() => {
    if (!video || !cueStartTimesSec) return

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
  }, [video, parsedSubtitles, cueStartTimesSec, setCurrentCue])

  const animationLoop = useCallback(() => {
    if (!showSubtitles) {
      stopLoopAndSyncOnce()
      return
    }

    syncTextToCurrentTime()

    if (!video.paused && !video.ended) {
      rafIdRef.current = requestAnimationFrame(animationLoop)
    } else {
      rafIdRef.current = null
    }
  }, [video, parsedSubtitles, syncTextToCurrentTime])

  const stopLoopAndSyncOnce = useCallback(() => {
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current)
      rafIdRef.current = null
    }
    syncTextToCurrentTime()
  }, [syncTextToCurrentTime])

  const startLoopIfNeeded = useCallback(() => {
    if (rafIdRef.current != null) return
    rafIdRef.current = requestAnimationFrame(animationLoop)
  }, [animationLoop])

  useEffect(() => {
    if (!video || !parsedSubtitles || !cueStartTimesSec) return

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
    let videoElement = document.querySelector("video")

    if (videoElement) {
      setVideo(videoElement)
      return
    }

    const obs = new MutationObserver(() => {
      videoElement = document.querySelector("video")
      if (!videoElement) return
      setVideo(videoElement)
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

const baseContainerCssProperties: CSSProperties = {
  pointerEvents: "none",
  userSelect: "none",
  bottom: "2.5rem",
  zIndex: 999999999999,
  display: "flex",
  height: "fit-content",
  width: "100dvw",
  justifyContent: "center",
  alignItems: "center",
  paddingLeft: "2rem",
  paddingRight: "2rem",
  paddingTop: "1rem",
  paddingBottom: "1rem",
  fontFamily: "Noto Sans, sans-serif"
}
const defaultModeContainerCssProperties: CSSProperties = {
  position: "fixed"
}

const fullScreenModeContainerCssProperties: CSSProperties = {
  position: "absolute",
  left: "0",
  right: "0",
  bottom: "2.5rem"
}
const defaultTextCssProperties: CSSProperties = {
  pointerEvents: "none",
  userSelect: "none",
  fontSize: "20px",
  textAlign: "center",
  fontWeight: 500,
  color: "#ffffff",
  mixBlendMode: "multiply"
}

const ContentUI = () => {
  const containerRef = useRef<HTMLDivElement>(null)

  const storage = new ExtensionLocalStorage("content")

  const [tabId, setTabId] = useState<number | undefined>()
  const [currentCue, setCurrentCue] = useState(placeholderCue)
  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const [currentSession, setCurrentSession] = useState<TSession>(undefined)
  const [isFullScreenMode, setIsFullScreenMode] = useState(false)
  const [subtitleConfig, setSubtitleConfig] =
    useState<SubtitleContextReducerState>()

  const containerCssProperties = useMemo<CSSProperties>(() => {
    if (isFullScreenMode)
      return {
        ...baseContainerCssProperties,
        ...fullScreenModeContainerCssProperties
      }
    else
      return {
        ...baseContainerCssProperties,
        ...defaultModeContainerCssProperties
      }
  }, [isFullScreenMode])

  const textCssProperties = useMemo<CSSProperties>(() => {
    if (!subtitleConfig) return defaultTextCssProperties
    return {
      ...defaultTextCssProperties,
      color: subtitleConfig.color,
      fontSize: `${subtitleConfig.fontSize}px`,
      backgroundColor: subtitleConfig.backgroundColor,
      display: subtitleConfig.showSubtitles ? "block" : "none"
    }
  }, [subtitleConfig])

  const {} = useSubtitles(
    subtitleConfig?.showSubtitles ?? true,
    currentSession,
    setCurrentCue
  )

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

  const listnerFullScreenChange = useCallback(() => {
    if (!containerRef.current) return
    const fullscreenElement = document.fullscreenElement

    if (fullscreenElement) {
      setIsFullScreenMode(true)
      fullscreenElement.appendChild(containerRef.current)
    } else {
      setIsFullScreenMode(false)
      document.body.appendChild(containerRef.current)
    }
  }, [])

  const listnerExtensionLocalStorage = useCallback(
    (changes: { [key: string]: chrome.storage.StorageChange }) => {
      const subtitleConfig = changes[STORAGE_KEY_CONFIG]

      setSubtitleConfig(subtitleConfig.newValue)
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

  useEffect(() => {
    document.addEventListener("fullscreenchange", listnerFullScreenChange)

    return () =>
      document.removeEventListener("fullscreenchange", listnerFullScreenChange)
  }, [])

  useEffect(() => {
    chrome.storage.local.onChanged.addListener(listnerExtensionLocalStorage)

    storage
      .get<SubtitleContextReducerState>(STORAGE_KEY_CONFIG)
      .then((value) => {
        setSubtitleConfig(value)
      })

    return () =>
      chrome.storage.local.onChanged.removeListener(
        listnerExtensionLocalStorage
      )
  }, [listnerExtensionLocalStorage, storage, subtitleConfig])

  if (!isWorkerReady || !currentSession?.tabId || !tabId) return <></>
  if (currentSession?.tabId !== tabId) return <></>
  if (subtitleConfig && !subtitleConfig.showSubtitles) return <></>

  return (
    <div ref={containerRef} style={containerCssProperties}>
      <p style={textCssProperties}>{currentCue}</p>
    </div>
  )
}

export default ContentUI
