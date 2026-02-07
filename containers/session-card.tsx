import FileUploader, { type FileUploaderHandle } from "@/components/file-upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  sendMessageInRuntime,
  type TPOPUP_PAYLOAD_REQ_UPDATE,
  type TPopupMessageActions
} from "@/lib/message"
import type { TSession } from "@/types"
import { startCase, truncate } from "lodash"
import { Edit, Trash } from "lucide-react"
import { useRef, type ChangeEventHandler, type MouseEventHandler } from "react"

type SessionCardProps = Pick<
  TSession,
  | "fileName"
  | "sessionId"
  | "tabFaviconUrl"
  | "tabTitle"
  | "tabId"
  | "sessionStatus"
>

const SessionCard = ({
  tabFaviconUrl,
  tabTitle,
  fileName,
  tabId,
  sessionId,
  sessionStatus
}: SessionCardProps) => {
  const fileUploaderRef = useRef<FileUploaderHandle>(null)

  const handleOnChangeFileInput: ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = async () => {
      await sendMessageInRuntime<
        TPopupMessageActions,
        TPOPUP_PAYLOAD_REQ_UPDATE
      >({
        type: "req:session:update",
        from: "popup",
        to: "worker",
        payload: {
          fileName: file.name,
          fileSize: file.size,
          fileRawText: await file.text(),
          sessionId
        }
      })
    }
    reader.readAsText(file)
  }

  const handleOnClickEdit: MouseEventHandler<HTMLButtonElement> = (e) => {
    e.stopPropagation()
    fileUploaderRef.current?.triggerClick()
  }

  return (
    <div className="flex w-full flex-col rounded-md border border-secondary px-4 py-3">
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-3">
          <img src={tabFaviconUrl} className="h-12 w-12 rounded-full" />
          <div className="flex flex-col gap-0">
            <p className="text-md font-medium">
              {truncate(tabTitle, {
                length: 23
              })}
            </p>
            <p>
              {fileName.length > 20
                ? `${fileName.slice(0, 10)}...${fileName.slice(-5)}`
                : fileName}
            </p>
            <Badge className="mt-4 w-fit" variant="secondary">
              {startCase(sessionStatus)}
            </Badge>
          </div>
        </div>

        <div className="flex">
          <ButtonGroup>
            <FileUploader
              accept=".srt"
              ref={fileUploaderRef}
              onChange={handleOnChangeFileInput}>
              <Button
                size="icon"
                variant="ghost"
                data-tab-id={tabId}
                data-session-id={sessionId}
                onClick={handleOnClickEdit}
                data-op="edit">
                <Edit />
              </Button>
            </FileUploader>
            <Button
              size="icon"
              variant="ghost"
              data-tab-id={tabId}
              data-session-id={sessionId}
              data-op="delete">
              <Trash />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}

export default SessionCard
