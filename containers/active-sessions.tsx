import SessionCard from "@/containers/session-card"
import { useSubtitleContext } from "@/contexts/subtitle-context"

const ActiveSessions = () => {
  const { state } = useSubtitleContext()

  return (
    <div className="flex max-h-96 flex-col gap-4 overflow-y-scroll px-4">
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
