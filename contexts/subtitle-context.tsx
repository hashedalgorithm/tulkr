import { STORAGE_KEY_CONFIG } from "@/lib/storage"
import type { HsvaColor } from "@uiw/react-color"
import {
  createContext,
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
      type: "set-target-tab"
      tab: chrome.tabs.Tab
    }

type SubtitleContextProps = PropsWithChildren
type SubtitleContextState = {
  state: SubtitleContextReducerState
  dispatch: Dispatch<SubtitleContextReducerStateActions>
}

export type SubtitleContextReducerState = {
  showSubtitles: boolean
  tab?: chrome.tabs.Tab
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
}

const intialReducerState = (): SubtitleContextReducerState => ({
  position: {
    x: 0,
    y: 0
  },
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
    case "set-target-tab":
      return {
        ...prevstate,
        tab: actions.tab
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
  const [isLoading, setIsLoading] = useState(false)

  const [state, dispatch] = useReducer(reducer, intialReducerState())

  useEffect(() => {
    chrome.storage.local.get(
      STORAGE_KEY_CONFIG,
      (result: SubtitleContextReducerState) => {
        setIsLoading(true)

        if (result[STORAGE_KEY_CONFIG]) {
          dispatch({
            type: "sync",
            config: result[STORAGE_KEY_CONFIG] as SubtitleContextReducerState
          })
        }

        setIsLoading(false)
      }
    )
  }, [dispatch])

  useEffect(() => {
    if (isLoading) return

    chrome.storage.local.set({ [STORAGE_KEY_CONFIG]: state })
  }, [state, isLoading])

  return (
    <RawContext.Provider value={{ state, dispatch }}>
      {children}
    </RawContext.Provider>
  )
}

export default SubtitleContext
