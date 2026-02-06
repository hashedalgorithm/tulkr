import { formatBytesSI } from "@/lib/utils"
import { truncate } from "lodash"
import { CheckCircle2, FileTypeCorner } from "lucide-react"

type UploadedFileInfo = {
  fileName: string
  fileSize: number
}
const UploadedFileInfo = ({ fileName, fileSize }: UploadedFileInfo) => {
  return (
    <div className="my-4 flex w-full items-center gap-4 rounded-md border border-secondary px-4 py-3">
      <FileTypeCorner className="h-5 w-5 text-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-md font-medium">
          {truncate(fileName, {
            length: 30
          })}
        </p>
        <p>{formatBytesSI(fileSize)}</p>
      </div>
      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
    </div>
  )
}

export default UploadedFileInfo
