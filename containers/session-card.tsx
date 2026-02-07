import FileUploader, { type FileUploaderHandle } from "@/components/file-upload"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { useSubtitleContext } from "@/contexts/subtitle-context"
import {
  sendMessageInRuntime,
  type TPOPUP_PAYLOAD_REQ_END,
  type TPOPUP_PAYLOAD_REQ_UPDATE,
  type TPopupMessageActions
} from "@/lib/message"
import { cn } from "@/lib/utils"
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
  | "delay"
>

const SessionCard = ({
  tabFaviconUrl,
  tabTitle,
  fileName,
  tabId,
  sessionId,
  sessionStatus,
  delay
}: SessionCardProps) => {
  const fileUploaderRef = useRef<FileUploaderHandle>(null)
  const { state, dispatch } = useSubtitleContext()

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

  const handleOnClickDelete: MouseEventHandler<HTMLButtonElement> = async (
    e
  ) => {
    e.stopPropagation()
    if (!tabId || !sessionId) return

    await sendMessageInRuntime<TPopupMessageActions, TPOPUP_PAYLOAD_REQ_END>({
      type: "req:session:end",
      from: "popup",
      to: "worker",
      payload: {
        sessionId,
        tabId
      }
    })
    dispatch({
      type: "remove-session",
      sessionId
    })
  }

  const handleOnClickCard: MouseEventHandler<HTMLDivElement> = () => {
    dispatch({
      type: "set-selected-tab",
      tabId: state.selectedTab === tabId ? undefined : tabId
    })
  }

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer flex-col rounded-md border border-secondary",
        {
          "border-primary": state.selectedTab === tabId
        }
      )}
      onClick={handleOnClickCard}>
      <Badge
        className={cn("absolute right-3 top-2 w-fit px-1 py-1", {
          "bg-emerald-500 text-primary-foreground hover:bg-emerald-500/80":
            sessionStatus === "playing",
          "bg-secondary text-secondary-foreground hover:bg-secondary":
            sessionStatus === "active",
          "bg-amber-500 text-secondary-foreground hover:bg-amber-500/80":
            sessionStatus === "paused"
        })}>
        <p>{startCase(sessionStatus)}</p>
      </Badge>

      <div className="flex items-center justify-between gap-8 px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-full">
            <img
              src={tabFaviconUrl}
              className="h-full w-full rounded-full object-contain"
            />
            <Badge
              className={cn("absolute -bottom-2 right-0 w-fit text-xs", {
                "bg-destructive/45 text-destructive-foreground": delay > 0,
                "bg-emerald-700/45 text-primary-foreground": delay < 0,
                hidden: delay === 0
              })}
              variant="default">
              {`${delay}s`}
            </Badge>
          </div>
          <div className="flex flex-col gap-0">
            <p className="text-md font-medium">
              {truncate(tabTitle, {
                length: 20
              })}
            </p>
            <p>
              {fileName.length > 20
                ? `${fileName.slice(0, 10)}...${fileName.slice(-5)}`
                : fileName}
            </p>
          </div>
        </div>

        <div className="flex justify-end self-end">
          <ButtonGroup>
            <FileUploader
              accept=".srt"
              ref={fileUploaderRef}
              onChange={handleOnChangeFileInput}>
              <Button
                size="sm"
                variant="ghost"
                data-tab-id={tabId}
                data-session-id={sessionId}
                onClick={handleOnClickEdit}
                data-op="edit">
                <Edit />
              </Button>
            </FileUploader>
            <Button size="sm" variant="ghost" onClick={handleOnClickDelete}>
              <Trash />
            </Button>
          </ButtonGroup>
        </div>
      </div>
    </div>
  )
}

export default SessionCard
