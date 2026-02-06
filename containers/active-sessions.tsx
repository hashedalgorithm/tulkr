import SessionCard from "@/containers/session-card"
import { useSubtitleContext } from "@/contexts/subtitle-context"
import { type MouseEventHandler } from "react"

const ActiveSessions = () => {
  const { state } = useSubtitleContext()

  const handleOnClickSessionCard: MouseEventHandler<HTMLDivElement> = (e) => {
    const target = e.target as HTMLDivElement

    if (!(target instanceof HTMLDivElement)) return

    const tabId = target.getAttribute("data-tabId")?.toString()
    const sessionId = target.getAttribute("data-sessionId")?.toString()
    const operation = target.getAttribute("data-op")?.toString()

    if (
      !tabId ||
      !sessionId ||
      !operation ||
      (operation !== "edit" && operation !== "delete")
    )
      return

    console.log(tabId, sessionId, operation)
  }

  return (
    <div onClick={handleOnClickSessionCard} className="flex flex-col gap-4">
      {Object.values(state.sessions).map((session) => (
        <SessionCard
          key={`active-sessions.session-card.${session.sessionId}`}
          sessionId={session.sessionId}
          tabId={session.tabId}
          tabTitle={session.tabTitle}
          tabFaviconUrl={session.tabFaviconUrl}
          fileName={session.fileName}
        />
      ))}
    </div>
  )
}

export default ActiveSessions
