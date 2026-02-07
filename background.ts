import IndexedDB from "@/lib/indexed-db"
import {
  sendMessageInRuntime,
  sendMessageToTab,
  type TCONTENT_PAYLOAD_REQ_GET_ACTIVE_SESSION,
  type TContentMessageActions,
  type TMessageBody,
  type TPOPUP_PAYLOAD_REQ_END,
  type TPOPUP_PAYLOAD_REQ_INIT,
  type TPOPUP_PAYLOAD_REQ_UPDATE,
  type TPopupMessageActions,
  type TWORKER_PAYLOAD_REQ_END,
  type TWORKER_PAYLOAD_REQ_INIT,
  type TWORKER_PAYLOAD_RES_GET_ACTIVE_SESSION,
  type TWORKER_PAYLOAD_RES_GET_ACTIVE_SESSIONS,
  type TWORKER_PAYLOAD_RES_GET_TABID,
  type TWORKER_PAYLOAD_RES_INIT,
  type TWORKER_PAYLOAD_RES_UPDATE,
  type TWorkerMessageActions
} from "@/lib/message"
import ExtensionLocalStorage, {
  STORAGE_KEY_IS_WORKER_ACTIVE
} from "@/lib/storage"
import type { TSession } from "@/types"
import { uniqueId } from "lodash"

const indexdb = new IndexedDB()
const storage = new ExtensionLocalStorage("worker")

const onMessageListner = async (
  message: TMessageBody<TPopupMessageActions | TContentMessageActions, unknown>,
  sender: chrome.runtime.MessageSender,
  sendResponse: (response: TMessageBody<TWorkerMessageActions, unknown>) => void
) => {
  try {
    if (message.to !== "worker" || message.from === "worker") return

    switch (message.type) {
      case "req:session:init": {
        const payload = message.payload as TPOPUP_PAYLOAD_REQ_INIT

        if (
          !payload.fileName ||
          !payload.fileRawText ||
          !payload.fileSize ||
          !payload.tabFaviconUrl ||
          !payload.tabTitle ||
          !payload.tabId ||
          !payload.tabUrl
        )
          return

        const session = {
          sessionId: uniqueId("SESS_"),
          sessionLastUpdatedAt: new Date().toISOString(),
          sessionCreatedAt: new Date().toISOString(),
          sessionStatus: "active",
          delay: 0,
          ...payload
        } satisfies TSession

        await indexdb.insert(session)

        await sendMessageToTab<TWORKER_PAYLOAD_REQ_INIT>(payload.tabId, {
          type: "req:session:init",
          from: "worker",
          to: "content",
          payload: session
        })

        await sendMessageInRuntime<
          TWorkerMessageActions,
          TWORKER_PAYLOAD_RES_INIT
        >({
          type: "res:session:init",
          from: "worker",
          to: "popup",
          payload: session
        })
        return
      }

      case "req:session:end": {
        const payload = message.payload as TPOPUP_PAYLOAD_REQ_END

        if (!payload.sessionId || !payload.tabId) return

        await indexdb.delete(payload.sessionId)

        await sendMessageToTab<TWORKER_PAYLOAD_REQ_END>(payload.tabId, {
          type: "req:session:end",
          from: "worker",
          to: "content",
          payload
        })

        return
      }

      case "req:session:get-active-session": {
        if (message.from !== "content") return
        const payload =
          message.payload as TCONTENT_PAYLOAD_REQ_GET_ACTIVE_SESSION

        if (!payload.tabId) return

        const resp = await indexdb.getWithIndex("tabId", payload.tabId)
        const session = resp.at(0)

        return await sendMessageToTab<TWORKER_PAYLOAD_RES_GET_ACTIVE_SESSION>(
          payload.tabId,
          {
            type: "res:session:get-active-session",
            from: "worker",
            to: "content",
            payload: session
          }
        )
      }
      case "req:session:get-active-sessions": {
        if (message.from !== "popup") return

        const resp = await indexdb.getAll()

        await sendMessageInRuntime<
          TWorkerMessageActions,
          TWORKER_PAYLOAD_RES_GET_ACTIVE_SESSIONS
        >({
          type: "res:session:get-active-sessions",
          from: "worker",
          to: "popup",
          payload: resp.reduce(
            (accumulator, currentSession) => {
              accumulator[currentSession.sessionId] = currentSession
              return accumulator
            },
            {} as Record<string, TSession>
          )
        })
        return
      }

      case "req:tab-id:get": {
        if (!sender.tab?.id) return

        return await sendMessageToTab<TWORKER_PAYLOAD_RES_GET_TABID>(
          sender.tab?.id,
          {
            type: "res:tab-id:get",
            from: "worker",
            to: "content",
            payload: {
              tabId: sender.tab?.id
            }
          }
        )
      }
      case "req:session:update": {
        if (message.from !== "popup") return

        const payload = message.payload as TPOPUP_PAYLOAD_REQ_UPDATE

        if (!payload.sessionId) return

        const updated = await indexdb.updateMultiple(payload.sessionId, {
          ...payload,
          sessionLastUpdatedAt: new Date().toISOString()
        })

        await sendMessageInRuntime<
          TWorkerMessageActions,
          TWORKER_PAYLOAD_RES_UPDATE
        >({
          type: "res:session:update",
          from: "worker",
          to: "popup",
          payload: updated
        })
        return
      }
      default: {
        console.error("Invalid message request!")
        return
      }
    }
  } catch (error) {
    console.error(error)
    return
  }
}

function main() {
  indexdb.status
    .then((status) => {
      if (status !== "ready") throw new Error("Db is not ready")

      chrome.runtime.onMessage.addListener(onMessageListner)
      storage.set(STORAGE_KEY_IS_WORKER_ACTIVE, true)
    })
    .catch((error) => {
      console.error(error)
      chrome.runtime.onMessage.removeListener(onMessageListner)
      storage.set(STORAGE_KEY_IS_WORKER_ACTIVE, false)
    })
}

main()

export {}
