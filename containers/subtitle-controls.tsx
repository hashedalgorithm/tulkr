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
import { Switch } from "@/components/ui/switch"
import { useSubtitleContext } from "@/contexts/subtitle-context"
import { parseSubtitles } from "@/lib/subs"
import type { TColor, TParsedSubtitle } from "@/types"
import { Captions, CloudUpload } from "lucide-react"
import {
  useEffect,
  useRef,
  useState,
  type ChangeEventHandler,
  type MouseEventHandler
} from "react"

import { cn } from "~lib/utils"

type TSubtitles = {
  fileName?: string
  parsed: TParsedSubtitle[]
}

const SubtitleControls = () => {
  const inputRef = useRef<HTMLInputElement>(null)

  const { state, dispatch } = useSubtitleContext()
  const [subtitles, setSubtitles] = useState<TSubtitles>({
    parsed: []
  })

  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([])

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

    reader.onload = () => {
      const raw = reader.result?.toString()

      if (!raw) {
        console.error("File buffer is undefined!")
        return
      }

      setSubtitles({
        parsed: parseSubtitles(raw),
        fileName: file.name
      })
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

  useEffect(() => {
    chrome.tabs.query({ currentWindow: true }).then((result) => {
      const mapped = result.filter((tab) => tab.id && tab.title)

      setTabs(mapped)
    })
  }, [])

  return (
    <section className="mt-4">
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
          className="w-full justify-start px-5 gap-3 py-6 cursor-pointer"
          onClick={handleOnClick}>
          <CloudUpload className="w-5 h-5" />
          <span>
            {subtitles.parsed.length > 0
              ? "Upload New Subtitles"
              : "Upload Subtitles"}
          </span>
        </Button>
      </label>

      <p className="text-ring my-6 text-center text-sm">
        Upload .srt or .vtt subtitle files to enhance your viewing experience
        across different websites.
      </p>

      <Separator className="my-4" />

      {subtitles.parsed.length > 0 && (
        <Card>
          <CardContent>
            <div className="flex flex-col">
              <div className="flex justify-between gap-4 mt-4">
                <div className="flex flex-col gap-2">
                  <Captions />
                  <p>{`${subtitles.fileName?.slice(0, 20)}...${subtitles.fileName?.slice(-10)}`}</p>
                </div>
                <Badge
                  className={cn("h-fit whitespace-nowrap rounded-3xl", {
                    "border-emerald-500": subtitles.parsed.length > 0
                  })}
                  variant="outline">
                  Now Playing
                </Badge>
              </div>
              <Separator className="my-4" />

              <div className="flex flex-col gap-4">
                <div className="flex justify-between gap-8 items-center">
                  <p>Show Subtitles</p>
                  <Switch
                    onCheckedChange={handleOnChangeVisibility}
                    checked={state.showSubtitles}
                  />
                </div>

                <div className="flex justify-between gap-8 items-center">
                  <p>Font size</p>
                  <ButtonGroup className="cursor-pointer h-fit">
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

                <div className="flex justify-between gap-8 items-center">
                  <p>Background</p>
                  <input
                    className="border-none rounded-3xl ring-none outline-0"
                    type="color"
                    value={state.backgroundColor}
                    onChange={handleOnChangeBackgroundColor}
                  />
                </div>

                <div className="flex justify-between gap-8 items-center">
                  <p>Text color</p>
                  <input
                    className="border-none rounded-3xl ring-none outline-0"
                    type="color"
                    value={state.color}
                    onChange={handleOnChangeTextColor}
                  />
                </div>

                <Separator className="my-3" />

                <div className="flex flex-col justify-between gap-2">
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

                <div className="flex justify-center">
                  <Button variant="destructive">Remove Subtitles</Button>
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
