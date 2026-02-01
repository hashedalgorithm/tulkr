import type { TSession } from "@/lib/indexed-db"

export type TPopupMessageActions =
  | "req:session:get-active"
  | "req:session:init"
  | "req:session:end"
export type TWorkerMessageActions =
  | "res:session:get-active"
  | "res:tab-id:get"
  | "req:session:init"
  | "req:session:end"
export type TContentMessageActions = "req:session:get-active" | "req:tab-id:get"

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

export type TPOPUP_PAYLOAD_REQ_GET_ACTIVE = Pick<TSession, "tabId">
export type TPOPUP_PAYLOAD_REQ_INIT = Pick<
  TSession,
  "rawSubtitles" | "tabId" | "url"
>
export type TPOPUP_PAYLOAD_REQ_END = Pick<TSession, "tabId" | "sessionId">

export type TWORKER_PAYLOAD_REQ_END = Pick<TSession, "sessionId">
export type TWORKER_PAYLOAD_REQ_INIT = TSession
export type TWORKER_PAYLOAD_RES_GET_ACTIVE = TSession | undefined
export type TWORKER_PAYLOAD_RES_GET_TABID = Pick<TSession, "tabId">

export type TCONTENT_PAYLOAD_REQ_GET_ACTIVE = Pick<TSession, "tabId">

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
    console.error(error.message, error.stack)
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
    console.error(error.message)
  }
}
