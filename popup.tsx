import "globals.css"

import Sessions from "@/containers/sessions"
import SubtitleControls from "@/containers/subtitle-controls"

import SubtitleContext from "~contexts/subtitle-context"

const IndexPopup = () => {
  return (
    <SubtitleContext>
      <div className="flex justify-between">
        <Sessions />
        <SubtitleControls />
      </div>
    </SubtitleContext>
  )
}

export default IndexPopup
