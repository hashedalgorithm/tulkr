import {
  sendMessageInRuntime,
  type TMessageBody,
  type TPOPUP_PAYLOAD_REQ_GET_ACTIVE_SESSIONS,
  type TPopupMessageActions,
  type TWORKER_PAYLOAD_RES_GET_ACTIVE_SESSIONS,
  type TWORKER_PAYLOAD_RES_INIT,
  type TWORKER_PAYLOAD_RES_UPDATE,
  type TWorkerMessageActions
} from "@/lib/message"
import { STORAGE_KEY_CONFIG, STORAGE_KEY_IS_WORKER_ACTIVE } from "@/lib/storage"
import type { TSession, TSessionStatus } from "@/types"
import type { HsvaColor } from "@uiw/react-color"
import { omit } from "lodash"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useState,
  type Dispatch,
  type PropsWithChildren
} from "react"

type SubtitleContextReducerStateActions =
  | {
      type: "sync"
      config: SubtitleContextReducerState
    }
  | {
      type: "set-worker-status"
      status: boolean
    }
  | {
      type: "update-bg-color"
      color: HsvaColor
    }
  | {
      type: "update-visiblity"
      showSubtitle: boolean
    }
  | {
      type: "increase-fontsize"
    }
  | {
      type: "decrease-fontsize"
    }
  | {
      type: "update-text-color"
      color: HsvaColor
    }
  | {
      type: "update-text-stroke-color"
      color: HsvaColor
    }
  | {
      type: "increase-stroke-weight"
    }
  | {
      type: "decrease-stroke-weight"
    }
  | {
      type: "add-session"
      session: TSession
    }
  | {
      type: "update-session"
      session: TSession
    }
  | {
      type: "add-sessions"
      sessions: Record<string, TSession>
    }
  | {
      type: "remove-session"
      sessionId: string
    }
  | {
      type: "update-session-status"
      status: TSessionStatus
    }

type SubtitleContextProps = PropsWithChildren
type SubtitleContextState = {
  state: SubtitleContextReducerState
  dispatch: Dispatch<SubtitleContextReducerStateActions>
}

export type SubtitleContextReducerState = {
  showSubtitles: boolean
  sessions: Record<string, TSession>
  position: {
    x: number
    y: number
  }
  text: {
    color: HsvaColor
    size: number
    backgroundColor?: HsvaColor
    strokeWeight?: number
    strokeColor?: HsvaColor
  }
  isWorkerReady: boolean
}

const intialReducerState = (): SubtitleContextReducerState => ({
  position: {
    x: 0,
    y: 0
  },
  sessions: {},
  isWorkerReady: false,
  text: {
    color: {
      a: 1,
      h: 60,
      s: 100,
      v: 100
    },
    backgroundColor: {
      a: 0.4,
      h: 0,
      s: 0,
      v: 0
    },
    strokeColor: {
      a: 0,
      h: 0,
      s: 0,
      v: 0
    },
    strokeWeight: 0.5,
    size: 20
  },
  showSubtitles: true
})

const RawContext = createContext<SubtitleContextState>({
  state: intialReducerState(),
  dispatch: () => {}
})

const reducer = (
  prevstate: SubtitleContextReducerState,
  actions: SubtitleContextReducerStateActions
): SubtitleContextReducerState => {
  switch (actions.type) {
    case "sync":
      return actions.config
    case "set-worker-status":
      return {
        ...prevstate,
        isWorkerReady: actions.status
      }
    case "update-visiblity":
      return {
        ...prevstate,
        showSubtitles: actions.showSubtitle
      }
    case "decrease-fontsize":
      if (prevstate.text.size === 14) return prevstate
      return {
        ...prevstate,
        text: {
          ...prevstate.text,
          size: prevstate.text.size - 1
        }
      }
    case "increase-fontsize":
      if (prevstate.text.size === 50) return prevstate
      return {
        ...prevstate,
        text: {
          ...prevstate.text,
          size: prevstate.text.size + 1
        }
      }
    case "update-bg-color":
      return {
        ...prevstate,
        text: {
          ...prevstate.text,
          backgroundColor: actions.color
        }
      }
    case "update-text-stroke-color":
      return {
        ...prevstate,
        text: {
          ...prevstate.text,
          strokeColor: actions.color
        }
      }
    case "increase-stroke-weight":
      if (prevstate.text.strokeWeight === 5) return prevstate
      return {
        ...prevstate,
        text: {
          ...prevstate.text,
          strokeWeight: parseFloat(
            (prevstate.text.strokeWeight + 0.1).toPrecision(2)
          )
        }
      }
    case "decrease-stroke-weight":
      if (prevstate.text.strokeWeight === 0) return prevstate
      return {
        ...prevstate,
        text: {
          ...prevstate.text,
          strokeWeight: parseFloat(
            (prevstate.text.strokeWeight - 0.1).toPrecision(2)
          )
        }
      }
    case "update-text-color":
      return {
        ...prevstate,
        text: {
          ...prevstate.text,
          color: actions.color
        }
      }
    case "add-sessions":
      return {
        ...prevstate,
        sessions: {
          ...prevstate.sessions,
          ...actions.sessions
        }
      }
    case "add-session":
      return {
        ...prevstate,
        sessions: {
          ...prevstate.sessions,
          [actions.session.sessionId]: actions.session
        }
      }
    case "update-session":
      return {
        ...prevstate,
        sessions: {
          ...prevstate.sessions,
          [actions.session.sessionId]: actions.session
        }
      }
    case "remove-session": {
      const sessions = prevstate.sessions
      delete sessions?.[actions.sessionId]
      return {
        ...prevstate,
        sessions
      }
    }
    default:
      return prevstate
  }
}

export const useSubtitleContext = () => useContext(RawContext)

export const useSubtitleContextState = () => ({
  state: useContext(RawContext).state
})

const SubtitleContext = ({ children }: SubtitleContextProps) => {
  const [isLocalStorageLoading, setIsLocalStorageLoading] = useState(false)

  const [state, dispatch] = useReducer(reducer, intialReducerState())

  const listnerOnMessage = useCallback(
    (message: TMessageBody<TWorkerMessageActions>) => {
      if (message.from !== "worker") return

      switch (message.type) {
        case "res:session:get-active-sessions": {
          const sessions =
            message.payload as TWORKER_PAYLOAD_RES_GET_ACTIVE_SESSIONS
          dispatch({
            type: "add-sessions",
            sessions
          })

          return
        }
        case "res:session:init": {
          const session = message.payload as TWORKER_PAYLOAD_RES_INIT
          dispatch({
            type: "add-session",
            session
          })
          return
        }
        case "res:session:update": {
          const session = message.payload as TWORKER_PAYLOAD_RES_UPDATE

          dispatch({
            type: "update-session",
            session
          })
          return
        }
        default:
          return
      }
    },
    []
  )

  useEffect(() => {
    if (!state.isWorkerReady) return

    chrome.runtime.onMessage.addListener(listnerOnMessage)

    sendMessageInRuntime<
      TPopupMessageActions,
      TPOPUP_PAYLOAD_REQ_GET_ACTIVE_SESSIONS
    >({
      type: "req:session:get-active-sessions",
      from: "popup",
      to: "worker",
      payload: {}
    })

    return () => chrome.runtime.onMessage.removeListener(listnerOnMessage)
  }, [state.isWorkerReady, listnerOnMessage])

  useEffect(() => {
    chrome.storage.local.get(
      STORAGE_KEY_CONFIG,
      (result: SubtitleContextReducerState) => {
        setIsLocalStorageLoading(true)

        if (result[STORAGE_KEY_CONFIG]) {
          dispatch({
            type: "sync",
            config: result[STORAGE_KEY_CONFIG] as SubtitleContextReducerState
          })
        }

        setIsLocalStorageLoading(false)
      }
    )
  }, [])

  useEffect(() => {
    if (isLocalStorageLoading) return

    chrome.storage.local.set({
      [STORAGE_KEY_CONFIG]: omit(state, "isWorkerReady")
    })
  }, [state, isLocalStorageLoading])

  useEffect(() => {
    if (state.isWorkerReady) return

    chrome.storage.local.get(STORAGE_KEY_IS_WORKER_ACTIVE).then((value) => {
      dispatch({
        type: "set-worker-status",
        status: !!value
      })
    })
  }, [state.isWorkerReady])

  return (
    <RawContext.Provider value={{ state, dispatch }}>
      <main className="w-fit">{children}</main>
    </RawContext.Provider>
  )
}

export default SubtitleContext
