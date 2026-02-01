import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useSubtitleContext } from "@/contexts/subtitle-context"
import { type TSession } from "@/lib/indexed-db"
import {
  sendMessageInRuntime,
  type TMessageBody,
  type TPOPUP_PAYLOAD_REQ_END,
  type TPOPUP_PAYLOAD_REQ_GET_ACTIVE,
  type TPOPUP_PAYLOAD_REQ_INIT,
  type TPopupMessageActions,
  type TWORKER_PAYLOAD_RES_GET_ACTIVE,
  type TWorkerMessageActions
} from "@/lib/message"
import ExtensionLocalStorage, {
  STORAGE_KEY_IS_WORKER_ACTIVE
} from "@/lib/storage"
import type { TColor } from "@/types"
import { Captions, CloudUpload } from "lucide-react"
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type MouseEventHandler
} from "react"

import { cn } from "~lib/utils"

const SubtitleControls = () => {
  const storage = new ExtensionLocalStorage("popup")
  const inputRef = useRef<HTMLInputElement>(null)
  const { state, dispatch } = useSubtitleContext()

  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([])

  const [isWorkerReady, setIsWorkerReady] = useState(false)
  const [currentSession, setCurrentSession] = useState<TSession | undefined>()

  const handleOnClick = () => {
    if (!inputRef.current) return

    inputRef.current.click()
  }

  const handleOnChangeFileInput: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0]
    if (!file) {
      console.error("No file found!")
      return
    }

    const reader = new FileReader()

    reader.onload = async () => {
      const raw = reader.result?.toString()

      if (!raw) {
        console.error("File buffer is undefined!")
        return
      }

      if (!state.tab) {
        console.error("Cant find the tab!")
        return
      }

      await sendMessageInRuntime<TPopupMessageActions, TPOPUP_PAYLOAD_REQ_INIT>(
        {
          type: "req:session:init",
          from: "popup",
          to: "worker",
          payload: {
            rawSubtitles: {
              fileName: file.name,
              raw: await file.text(),
              size: file.size
            },
            tabId: state.tab.id,
            url: state.tab.url
          }
        }
      )
    }
    reader.readAsText(file)
  }

  const handleOnChangeVisibility = (value: boolean) => {
    dispatch({
      type: "update-visiblity",
      showSubtitle: value
    })
  }

  const handleOnChangeFontSize: MouseEventHandler<HTMLButtonElement> = (e) => {
    const operation = e.currentTarget.getAttribute("data-op")

    if (!operation || (operation !== "increase" && operation !== "decrease"))
      return

    dispatch({
      type: operation === "increase" ? "increase-fontsize" : "decrease-fontsize"
    })
  }

  const handleOnChangeBackgroundColor: ChangeEventHandler<HTMLInputElement> = (
    e
  ) => {
    dispatch({
      type: "update-bg-color",
      color: e.currentTarget.value.toString() as TColor
    })
  }

  const handleOnChangeTextColor: ChangeEventHandler<HTMLInputElement> = (e) => {
    dispatch({
      type: "update-text-color",
      color: e.currentTarget.value.toString() as TColor
    })
  }

  const handleOnChangeSelectedTab = (tabId: string | undefined) => {
    if (!tabs || !tabId) return

    const targetTab = tabs.find((tab) => tab.id === parseInt(tabId))

    if (!targetTab) return

    dispatch({
      type: "set-target-tab",
      tab: targetTab
    })
  }

  const handleOnClickRemoveSubtitles: MouseEventHandler<
    HTMLButtonElement
  > = async () => {
    if (!currentSession) {
      console.error("Cant find current session!")
      return
    }

    setCurrentSession(undefined)
    await sendMessageInRuntime<TPopupMessageActions, TPOPUP_PAYLOAD_REQ_END>({
      type: "req:session:end",
      from: "popup",
      to: "worker",
      payload: {
        sessionId: currentSession.sessionId,
        tabId: currentSession.tabId
      }
    })
  }

  const listnerOnMessage = useCallback(
    (message: TMessageBody<TWorkerMessageActions>) => {
      if (message.to !== "popup" || message.from !== "worker") return

      switch (message.type) {
        case "res:session:get-active": {
          const session = message.payload as TWORKER_PAYLOAD_RES_GET_ACTIVE
          setCurrentSession(session)
        }

        default:
          return
      }
    },
    []
  )

  useEffect(() => {
    chrome.tabs.query({ currentWindow: true }).then((result) => {
      const mapped = result.filter((tab) => tab.id && tab.title)

      setTabs(mapped)
    })
  }, [])

  useEffect(() => {
    chrome.runtime.onMessage.addListener(listnerOnMessage)

    return () => chrome.runtime.onMessage.removeListener(listnerOnMessage)
  }, [])

  useEffect(() => {
    if (isWorkerReady) return

    storage.get<boolean>(STORAGE_KEY_IS_WORKER_ACTIVE).then((value) => {
      setIsWorkerReady(value)
    })
  }, [isWorkerReady])

  useEffect(() => {
    if (!state?.tab || !!currentSession || !isWorkerReady) return

    sendMessageInRuntime<TPopupMessageActions, TPOPUP_PAYLOAD_REQ_GET_ACTIVE>({
      type: "req:session:get-active",
      from: "popup",
      to: "worker",
      payload: {
        tabId: state?.tab?.id
      }
    })
  }, [currentSession, isWorkerReady, state?.tab?.id])

  if (!isWorkerReady) return <Spinner />

  return (
    <section className="mt-4">
      <div className="mb-4 flex flex-col justify-between gap-2">
        <p>Choose Tab</p>

        <Select
          onValueChange={handleOnChangeSelectedTab}
          value={state?.tab?.id?.toString()}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            {tabs?.map((tab) => (
              <SelectItem
                key={`subtitle-controls.tabs.${tab.id}`}
                value={tab.id?.toString() ?? ""}>
                {tab.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <label className="block w-full">
        <input
          ref={inputRef}
          type="file"
          accept=".srt"
          className="hidden"
          onChange={handleOnChangeFileInput}
        />
        <Button
          size="lg"
          type="button"
          disabled={!state.tab}
          className="w-full cursor-pointer justify-start gap-3 px-5 py-6"
          onClick={handleOnClick}>
          <CloudUpload className="h-5 w-5" />
          <span>
            {currentSession ? "Upload New Subtitles" : "Upload Subtitles"}
          </span>
        </Button>
      </label>

      <p className="my-6 text-center text-sm text-ring">
        Upload .srt or .vtt subtitle files to enhance your viewing experience
        across different websites.
      </p>

      <Separator className="my-4" />

      {currentSession && (
        <Card>
          <CardContent>
            <div className="flex flex-col">
              <div className="mt-4 flex justify-between gap-4">
                <div className="flex flex-col gap-2">
                  <Captions />
                  <p>{`${currentSession.rawSubtitles.fileName.slice(0, 20)}...${currentSession.rawSubtitles.fileName.slice(-10)}`}</p>
                </div>
                <Badge
                  className={cn("h-fit whitespace-nowrap rounded-3xl", {
                    "border-emerald-500": currentSession
                  })}
                  variant="outline">
                  Now Playing
                </Badge>
              </div>
              <Separator className="my-4" />

              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-8">
                  <p>Show Subtitles</p>
                  <Switch
                    onCheckedChange={handleOnChangeVisibility}
                    checked={state.showSubtitles}
                  />
                </div>

                <div className="flex items-center justify-between gap-8">
                  <p>Font size</p>
                  <ButtonGroup className="h-fit cursor-pointer">
                    <Button
                      variant="outline"
                      onClick={handleOnChangeFontSize}
                      data-op="increase">
                      +
                    </Button>
                    <Button variant="outline">{state.fontSize}</Button>
                    <Button
                      variant="outline"
                      onClick={handleOnChangeFontSize}
                      data-op="decrease">
                      -
                    </Button>
                  </ButtonGroup>
                </div>

                <div className="flex items-center justify-between gap-8">
                  <p>Background</p>
                  <input
                    className="ring-none rounded-3xl border-none outline-0"
                    type="color"
                    value={state.backgroundColor}
                    onChange={handleOnChangeBackgroundColor}
                  />
                </div>

                <div className="flex items-center justify-between gap-8">
                  <p>Text color</p>
                  <input
                    className="ring-none rounded-3xl border-none outline-0"
                    type="color"
                    value={state.color}
                    onChange={handleOnChangeTextColor}
                  />
                </div>

                <Separator className="my-3" />

                <div className="flex justify-center">
                  <Button
                    variant="destructive"
                    onClick={handleOnClickRemoveSubtitles}>
                    Remove Subtitles
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

export default SubtitleControls
