import "globals.css"

import { Separator } from "@/components/ui/separator"
import Sessions from "@/containers/sessions"
import SubtitleControls from "@/containers/subtitle-controls"
import { ThemeProvider } from "next-themes"

import SubtitleContext from "~contexts/subtitle-context"

const IndexPopup = () => {
  return (
    <SubtitleContext>
      <div className="flex w-full justify-between gap-8">
        <Sessions />
        <Separator orientation="vertical" />
        <SubtitleControls />
      </div>
    </SubtitleContext>
  )
}

export default IndexPopup
