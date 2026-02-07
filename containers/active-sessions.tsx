import { Button } from "@/components/ui/button"
import SessionCard from "@/containers/session-card"
import type { TTabs } from "@/containers/sessions"
import { useSubtitleContext } from "@/contexts/subtitle-context"
import { FilePlay, PlusCircle } from "lucide-react"
import type { Dispatch, MouseEventHandler, SetStateAction } from "react"

type ActiveSessionsProps = {
  setTab: Dispatch<SetStateAction<TTabs>>
}
const ActiveSessions = ({ setTab }: ActiveSessionsProps) => {
  const { state } = useSubtitleContext()

  const handleOnClickAddSession: MouseEventHandler<HTMLButtonElement> = () => {
    setTab("add-session")
  }

  if (Object.keys(state.sessions).length === 0)
    return (
      <div className="flex flex-col items-center justify-center gap-1 px-4 py-4">
        <FilePlay />
        <h3 className="text-md font-medium">No active sessions</h3>
        <p className="text-center text-ring">
          You haven't created any projects yet. Get started by creating your
          first project.
        </p>

        <Button onClick={handleOnClickAddSession} className="mt-6">
          <PlusCircle />
          Add session
        </Button>
      </div>
    )

  return (
    <div className="flex max-h-96 flex-col gap-4 overflow-y-scroll">
      {Object.values(state.sessions).map((session) => (
        <SessionCard
          key={`active-sessions.session-card.${session.sessionId}`}
          sessionId={session.sessionId}
          tabId={session.tabId}
          tabTitle={session.tabTitle}
          tabFaviconUrl={session.tabFaviconUrl}
          fileName={session.fileName}
          sessionStatus={session.sessionStatus}
          delay={session.delay}
        />
      ))}
    </div>
  )
}

export default ActiveSessions
