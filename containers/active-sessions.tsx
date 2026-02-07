import SessionCard from "@/containers/session-card"
import { useSubtitleContext } from "@/contexts/subtitle-context"
import {
  sendMessageInRuntime,
  type TPOPUP_PAYLOAD_REQ_END,
  type TPopupMessageActions
} from "@/lib/message"
import { type MouseEventHandler } from "react"

const ActiveSessions = () => {
  const { state, dispatch } = useSubtitleContext()

  const handleOnClickSessionCard: MouseEventHandler<HTMLDivElement> = async (
    e
  ) => {
    const target = e.target as HTMLButtonElement

    if (!(target instanceof HTMLButtonElement)) return

    const tabId = target.getAttribute("data-tab-id")?.toString()
    const sessionId = target.getAttribute("data-session-id")?.toString()
    const operation = target.getAttribute("data-op")?.toString()

    if (!tabId || !sessionId || !operation || operation !== "delete") return

    await sendMessageInRuntime<TPopupMessageActions, TPOPUP_PAYLOAD_REQ_END>({
      type: "req:session:end",
      from: "popup",
      to: "worker",
      payload: {
        sessionId,
        tabId: parseInt(tabId)
      }
    })
    dispatch({
      type: "remove-session",
      sessionId
    })
    return
  }

  return (
    <div
      onClick={handleOnClickSessionCard}
      className="flex max-h-96 flex-col gap-4 overflow-y-scroll px-4">
      {Object.values(state.sessions).map((session) => (
        <SessionCard
          key={`active-sessions.session-card.${session.sessionId}`}
          sessionId={session.sessionId}
          tabId={session.tabId}
          tabTitle={session.tabTitle}
          tabFaviconUrl={session.tabFaviconUrl}
          fileName={session.fileName}
          sessionStatus={session.sessionStatus}
        />
      ))}
    </div>
  )
}

export default ActiveSessions
