import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Card, CardContent } from "@/components/ui/card"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from "@/components/ui/hover-card"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useSubtitleContext } from "@/contexts/subtitle-context"
import { Colorful, type ColorResult } from "@uiw/react-color"
import { type MouseEventHandler } from "react"

import { toStyleSheetSupportedColorFormat } from "~lib/utils"

const SubtitleControls = () => {
  const { state, dispatch } = useSubtitleContext()

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

  const handleOnChangeStrokeWeight: MouseEventHandler<HTMLButtonElement> = (
    e
  ) => {
    const operation = e.currentTarget.getAttribute("data-op")

    if (!operation || (operation !== "increase" && operation !== "decrease"))
      return

    dispatch({
      type:
        operation === "increase"
          ? "increase-stroke-weight"
          : "decrease-stroke-weight"
    })
  }

  // if (!state.isWorkerReady) return <Spinner />

  return (
    <section className="mt-4">
      <Separator className="my-4" />

      <Card>
        <CardContent>
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
                <Button variant="outline">{state.text.size}</Button>
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

              <HoverCard>
                <HoverCardTrigger>
                  <div
                    className="h-6 w-10 rounded-md"
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
                    className="h-6 w-10 rounded-md"
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
                    className="h-6 w-10 rounded-md"
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

            <div className="flex items-center justify-between gap-8">
              <p>Stroke Weight</p>
              <ButtonGroup className="h-fit cursor-pointer">
                <Button
                  variant="outline"
                  onClick={handleOnChangeStrokeWeight}
                  data-op="increase">
                  +
                </Button>
                <Button variant="outline">{state.text.strokeWeight}</Button>
                <Button
                  variant="outline"
                  onClick={handleOnChangeStrokeWeight}
                  data-op="decrease">
                  -
                </Button>
              </ButtonGroup>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}

export default SubtitleControls
