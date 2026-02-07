import type { TSession } from "@/types"

export type TPopupMessageActions =
  | "req:session:get-active-sessions"
  | "req:session:init"
  | "req:session:update"
  | "req:session:end"
export type TWorkerMessageActions =
  | "res:session:get-active-sessions"
  | "res:session:get-active-session"
  | "res:session:update"
  | "res:tab-id:get"
  | "req:session:init"
  | "res:session:init"
  | "req:session:end"
export type TContentMessageActions =
  | "req:session:get-active-session"
  | "req:tab-id:get"

type TMessageInstanceType = "worker" | "popup" | "content"

type TMessageInstanceActions =
  | TPopupMessageActions
  | TWorkerMessageActions
  | TContentMessageActions

export type TMessageBody<
  MessageInstanceAction extends TMessageInstanceActions,
  Payload extends Object = unknown
> = {
  type: MessageInstanceAction
  from: TMessageInstanceType
  to: TMessageInstanceType
  payload: Payload
}

// from popup to worker
export type TPOPUP_PAYLOAD_REQ_GET_ACTIVE_SESSIONS = {}
export type TPOPUP_PAYLOAD_REQ_INIT = Pick<
  TSession,
  | "tabId"
  | "tabUrl"
  | "tabFaviconUrl"
  | "tabTitle"
  | "fileRawText"
  | "fileName"
  | "fileSize"
>
export type TPOPUP_PAYLOAD_REQ_UPDATE = Partial<
  Pick<
    TSession,
    | "fileRawText"
    | "fileName"
    | "fileSize"
    | "sessionId"
    | "delay"
    | "sessionStatus"
  >
>
export type TPOPUP_PAYLOAD_REQ_END = Pick<TSession, "tabId" | "sessionId">

// from worker to poup
export type TWORKER_PAYLOAD_RES_INIT = TSession
export type TWORKER_PAYLOAD_RES_UPDATE = TSession
export type TWORKER_PAYLOAD_RES_GET_ACTIVE_SESSIONS = Record<string, TSession>

// from worker to content
export type TWORKER_PAYLOAD_RES_GET_ACTIVE_SESSION = TSession
export type TWORKER_PAYLOAD_REQ_INIT = TSession
export type TWORKER_PAYLOAD_REQ_END = Pick<TSession, "sessionId">
export type TWORKER_PAYLOAD_RES_GET_TABID = Pick<TSession, "tabId">

// from content to worker
export type TCONTENT_PAYLOAD_REQ_GET_ACTIVE_SESSION = Pick<TSession, "tabId">

export const sendMessageInRuntime = async <
  MessageInstanceAction extends TMessageInstanceActions,
  Payload = Object
>(
  message: TMessageBody<MessageInstanceAction, Payload>
) => {
  try {
    await chrome.runtime.sendMessage(message)
  } catch (raw: unknown) {
    const error = raw as Error
    console.error(error)
  }
}

export const sendMessageToTab = async <Payload = unknown>(
  tabId: number,
  message: TMessageBody<TWorkerMessageActions, Payload>
) => {
  try {
    await chrome.tabs.sendMessage(tabId, message)
  } catch (raw: unknown) {
    const error = raw as Error
    console.error(error)
  }
}
