import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import type { TSession, TTargetTab } from "@/types"
import { startCase, truncate } from "lodash"
import { Edit, Trash } from "lucide-react"

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
  return (
    <div className="flex w-80 items-center justify-between gap-8 rounded-md border border-secondary px-4 py-3">
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
          <Button
            size="icon"
            variant="ghost"
            data-tabId={tabId}
            data-sessionId={sessionId}
            data-op="edit">
            <Edit />
          </Button>
          <Button
            size="icon"
            variant="ghost"
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
