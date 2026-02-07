import { Button } from "@/components/ui/button"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card"
import { Input } from "@/components/ui/input"
import { InputGroup } from "@/components/ui/input-group"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import { useSubtitleContext } from "@/contexts/subtitle-context"
import {
  sendMessageInRuntime,
  type TPOPUP_PAYLOAD_REQ_UPDATE,
  type TPopupMessageActions
} from "@/lib/message"
import { toStyleSheetSupportedColorFormat } from "@/lib/utils"
import type { TSession } from "@/types"
import { Colorful, type ColorResult } from "@uiw/react-color"
import {
  Crop,
  Eye,
  Minus,
  Palette,
  Plus,
  Settings,
  Type,
  Zap
} from "lucide-react"
import { useMemo, type ChangeEventHandler } from "react"

const SubtitleControls = () => {
  const { state, dispatch } = useSubtitleContext()

  const selectedTab = useMemo<TSession | undefined>(() => {
    if (!state?.selectedTab) return

    return Object.values(state.sessions).find(
      (session) => session.tabId === state.selectedTab
    )
  }, [state.selectedTab, state.sessions])

  const handleOnChangeVisibility = (value: boolean) => {
    dispatch({
      type: "update-visiblity",
      showSubtitle: value
    })
  }

  const handleOnChangeFontSize = (value: number[]) => {
    const size = value.at(0)
    if (!size) return

    if (size > 50 || size < 14) return

    dispatch({
      type: "update-fontsize",
      size
    })
  }

  const handleOnChangeBackgroundColor = (color: ColorResult) => {
    dispatch({
      type: "update-bg-color",
      color: color.hsva
    })
  }

  const handleOnChangeTextColor = (color: ColorResult) => {
    dispatch({
      type: "update-text-color",
      color: color.hsva
    })
  }

  const handleOnChangeTextStrokeColor = (color: ColorResult) => {
    dispatch({
      type: "update-text-stroke-color",
      color: color.hsva
    })
  }

  const handleOnChangeStrokeWeight = (value: number[]) => {
    const weight = value.at(0)

    if (!weight) return
    if (weight > 2 || weight < 0) return

    dispatch({
      type: "update-stroke-weight",
      weight
    })
  }

  const updateSessionDelay = async (delay: number) => {
    await sendMessageInRuntime<TPopupMessageActions, TPOPUP_PAYLOAD_REQ_UPDATE>(
      {
        type: "req:session:update",
        from: "popup",
        to: "worker",
        payload: {
          sessionId: selectedTab.sessionId,
          delay
        }
      }
    )
  }

  const handleOnChangeDelay = async (value: number[]) => {
    const delay = value.at(0)

    if (!delay) return

    return await updateSessionDelay(delay)
  }
  const handleOnChangeCustomDelay: ChangeEventHandler<
    HTMLInputElement
  > = async (e) => {
    const value = e.currentTarget.value

    if (isNaN(parseFloat(value))) return

    return await updateSessionDelay(parseFloat(value))
  }
  if (!state.isWorkerReady)
    return (
      <div className="flex h-max w-72 items-center justify-center">
        <Spinner />
      </div>
    )

  return (
    <section className="mr-4 mt-4 flex h-full w-96 flex-col gap-4 overflow-y-scroll">
      {selectedTab && (
        <div className="w-full rounded-md border px-6 py-6">
          <div className="mb-5 flex flex-col gap-4">
            <div className="flex flex-col">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-xl bg-secondary p-2">
                  <Zap className="h-4 w-4 text-secondary-foreground" />
                </div>

                <p className="text-md font-medium">Synchronization</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex w-full items-center justify-between">
                    <p>Delay</p>
                    <p>{`${selectedTab.delay} s`}</p>
                  </div>
                  <Slider
                    defaultValue={[selectedTab.delay]}
                    onValueCommit={handleOnChangeDelay}
                    max={selectedTab.delay > 5 ? selectedTab.delay : 5}
                    min={selectedTab.delay > 5 ? -selectedTab.delay : -5}
                    step={0.5}
                  />
                </div>

                <Input
                  className="w-20"
                  type="number"
                  step={0.5}
                  value={selectedTab.delay}
                  onChange={handleOnChangeCustomDelay}
                />
              </div>
            </div>
          </div>
          <p className="text-ring">{`This applies to the selected tab - ${selectedTab.tabTitle}`}</p>
        </div>
      )}
      <div className="w-full rounded-md border px-6 py-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Configuration</h3>
          </div>

          <Separator />

          <div className="flex items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-secondary p-2">
                <Eye className="h-5 w-5 text-secondary-foreground" />
              </div>

              <div className="flex flex-col gap-0">
                <p>Show Subtitles</p>
                <p className="text-ring">Toggle subtitle visibility</p>
              </div>
            </div>
            <Switch
              onCheckedChange={handleOnChangeVisibility}
              checked={state.showSubtitles}
            />
          </div>

          <Separator />

          <div className="flex flex-col">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-xl bg-secondary p-2">
                <Type className="h-4 w-4 text-secondary-foreground" />
              </div>

              <p className="text-md font-medium">Typography</p>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex w-full items-center justify-between">
                <p>Font size</p>
                <p>{`${state.text.size}px`}</p>
              </div>
              <Slider
                defaultValue={[state.text.size]}
                onValueCommit={handleOnChangeFontSize}
                max={50}
                min={14}
                step={1}
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-secondary p-2">
                <Palette className="h-4 w-4 text-secondary-foreground" />
              </div>

              <p className="text-md font-medium">Styling</p>
            </div>

            <div className="flex items-center justify-between gap-8">
              <p>Background</p>

              <HoverCard>
                <HoverCardTrigger>
                  <div
                    className="h-6 w-20 rounded-md"
                    style={{
                      backgroundColor: toStyleSheetSupportedColorFormat(
                        state.text.backgroundColor
                      ),
                      border: "0.5px solid gray"
                    }}></div>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" align="start">
                  <Colorful
                    color={state.text.backgroundColor}
                    onChange={handleOnChangeBackgroundColor}
                  />
                </HoverCardContent>
              </HoverCard>
            </div>

            <div className="flex items-center justify-between gap-8">
              <p>Text color</p>
              <HoverCard>
                <HoverCardTrigger>
                  <div
                    className="h-6 w-20 rounded-md"
                    style={{
                      backgroundColor: toStyleSheetSupportedColorFormat(
                        state.text.color
                      ),
                      border: "0.5px solid gray"
                    }}></div>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" align="start">
                  <Colorful
                    color={state.text.color}
                    onChange={handleOnChangeTextColor}
                  />
                </HoverCardContent>
              </HoverCard>
            </div>

            <div className="flex items-center justify-between gap-8">
              <p>Text Stroke color</p>
              <HoverCard>
                <HoverCardTrigger>
                  <div
                    className="h-6 w-20 rounded-md"
                    style={{
                      backgroundColor: toStyleSheetSupportedColorFormat(
                        state.text.strokeColor
                      ),
                      border: "0.5px solid gray"
                    }}></div>
                </HoverCardTrigger>
                <HoverCardContent side="bottom" align="start">
                  <Colorful
                    color={state.text.strokeColor}
                    onChange={handleOnChangeTextStrokeColor}
                  />
                </HoverCardContent>
              </HoverCard>
            </div>

            <div className="mt-2 flex flex-col">
              <div className="flex flex-col gap-2">
                <div className="flex w-full items-center justify-between">
                  <p>Stroke Weight</p>
                  <p>{`${state.text.strokeWeight}px`}</p>
                </div>
                <Slider
                  defaultValue={[state.text.strokeWeight]}
                  onValueCommit={handleOnChangeStrokeWeight}
                  max={2}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>
          </div>
          <Separator />

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-secondary p-2">
                <Crop className="h-4 w-4 text-secondary-foreground" />
              </div>

              <p className="text-md font-medium">Position</p>
            </div>

            <div className="flex justify-between gap-4">
              <div className="flex flex-col gap-2">
                <p>{`Horizontal (x-axis)`}</p>
                <InputGroup>
                  <Button variant="outline">
                    <Plus />
                  </Button>
                  <Input
                    className="text-center"
                    defaultValue={state.position.x}
                  />
                  <Button variant="outline">
                    <Minus />
                  </Button>
                </InputGroup>
              </div>
              <div className="flex flex-col gap-2">
                <p>{`Vertical (y-axis)`}</p>
                <InputGroup>
                  <Button variant="outline">
                    <Plus />
                  </Button>
                  <Input
                    className="text-center"
                    defaultValue={state.position.y}
                  />
                  <Button variant="outline">
                    <Minus />
                  </Button>
                </InputGroup>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SubtitleControls
