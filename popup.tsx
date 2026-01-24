import { Separator } from "@/components/ui/separator"
import SubtitleControls from "@/containers/subtitle-controls"

import "globals.css"

import { ClosedCaption } from "lucide-react"

import SubtitleContext from "~contexts/subtitle-context"

const IndexPopup = () => {
  return (
    <SubtitleContext>
      <div className="flex flex-col gap-4 w-96 py-8 px-10">
        <div className="flex flex-col gap-1 items-center w-full">
          <div className="flex gap-2 items-center">
            <ClosedCaption className="w-8 h-auto" />
            <h3 className="font-medium text-3xl">T&uacute;lkr</h3>
          </div>
          <p className="text-sm text-center text-ring">
            Customize your experience with personalized subtitles.
          </p>
        </div>

        <Separator className="w-4/5" />

        <SubtitleControls />
      </div>
    </SubtitleContext>
  )
}

export default IndexPopup
