import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import type { TSession, TTargetTab } from "@/types"
import { Edit, Trash } from "lucide-react"

type SessionCardProps = Pick<
  TSession,
  "fileName" | "sessionId" | "tabFaviconUrl" | "tabTitle" | "tabId"
>

const SessionCard = ({
  tabFaviconUrl,
  tabTitle,
  fileName,
  tabId,
  sessionId
}: SessionCardProps) => {
  return (
    <div className="flex w-full justify-between rounded-md border border-secondary px-8 py-5">
      <div className="flex">
        <img src={tabFaviconUrl} className="h-12 w-12 rounded-full" />
        <div className="flex flex-col gap-0">
          <p className="text-lg font-medium">{tabTitle}</p>
          <p>{fileName}</p>
        </div>
      </div>

      <div className="flex">
        <ButtonGroup>
          <Button data-tabId={tabId} data-sessionId={sessionId} data-op="edit">
            <Edit />
          </Button>
          <Button
            data-tabId={tabId}
            data-sessionId={sessionId}
            data-op="delete">
            <Trash />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  )
}

export default SessionCard
