import { STORAGE_KEY_CONFIG } from "@/lib/storage"
import type { TColor } from "@/types"
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
      color: TColor
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
      color: TColor
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
  position: {
    x: number
    y: number
  }
  color: TColor
  backgroundColor?: TColor
  fontSize: number
  textStroke?: TColor
  tab?: chrome.tabs.Tab
  showSubtitles: boolean
}

const intialReducerState = (): SubtitleContextReducerState => ({
  position: {
    x: 0,
    y: 0
  },
  color: "#ffff00",
  fontSize: 20,
  showSubtitles: false
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
      return {
        ...prevstate,
        fontSize: prevstate.fontSize - 1
      }
    case "increase-fontsize":
      return {
        ...prevstate,
        fontSize: prevstate.fontSize + 1
      }
    case "update-bg-color":
      return {
        ...prevstate,
        backgroundColor: actions.color
      }
    case "update-text-color":
      return {
        ...prevstate,
        color: actions.color
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
