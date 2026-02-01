import IndexedDB, { type TSession } from "@/lib/indexed-db"
import {
  sendMessageInRuntime,
  sendMessageToTab,
  type TCONTENT_PAYLOAD_REQ_GET_ACTIVE,
  type TContentMessageActions,
  type TMessageBody,
  type TPOPUP_PAYLOAD_REQ_END,
  type TPOPUP_PAYLOAD_REQ_INIT,
  type TPopupMessageActions,
  type TWORKER_PAYLOAD_REQ_END,
  type TWORKER_PAYLOAD_RES_GET_ACTIVE,
  type TWORKER_PAYLOAD_RES_GET_TABID,
  type TWorkerMessageActions
} from "@/lib/message"
import ExtensionLocalStorage, {
  STORAGE_KEY_IS_WORKER_ACTIVE
} from "@/lib/storage"
import { uniqueId } from "lodash"

const indexdb = new IndexedDB()
const storage = new ExtensionLocalStorage("worker")

const onMessageListner = async (
  message: TMessageBody<TPopupMessageActions | TContentMessageActions, unknown>,
  sender: chrome.runtime.MessageSender
) => {
  if (message.to !== "worker" || message.from === "worker") return

  switch (message.type) {
    case "req:session:init": {
      const payload = message.payload as TPOPUP_PAYLOAD_REQ_INIT

      if (!payload.rawSubtitles || !payload.tabId) return

      const session = {
        sessionId: uniqueId("SESS_"),
        lastUpdatedAt: new Date().toISOString(),
        status: "active",
        ...payload
      } satisfies TSession

      await indexdb.insert(session)

      await sendMessageToTab<TWORKER_PAYLOAD_RES_GET_ACTIVE>(payload.tabId, {
        type: "res:session:get-active",
        from: "worker",
        to: "content",
        payload: session
      })
      await sendMessageInRuntime<
        TWorkerMessageActions,
        TWORKER_PAYLOAD_RES_GET_ACTIVE
      >({
        type: "res:session:get-active",
        from: "worker",
        to: "popup",
        payload: session
      })
      return
    }
    case "req:session:end": {
      const payload = message.payload as TPOPUP_PAYLOAD_REQ_END

      if (!payload.sessionId || !payload.tabId) return

      await sendMessageToTab<TWORKER_PAYLOAD_REQ_END>(payload.tabId, {
        type: "req:session:end",
        from: "worker",
        to: "content",
        payload
      })
      return
    }
    case "req:session:get-active": {
      const payload = message.payload as TCONTENT_PAYLOAD_REQ_GET_ACTIVE

      if (!payload.tabId) return

      const resp = await indexdb.getWithIndex("tabId", payload.tabId)
      const session = resp.at(0)

      if (message.from === "popup") {
        return await sendMessageInRuntime<
          TWorkerMessageActions,
          TWORKER_PAYLOAD_RES_GET_ACTIVE
        >({
          type: "res:session:get-active",
          from: "worker",
          to: "popup",
          payload: session
        })
      }
      if (message.from === "content") {
        return await sendMessageToTab<TWORKER_PAYLOAD_RES_GET_ACTIVE>(
          payload.tabId,
          {
            type: "res:session:get-active",
            from: "worker",
            to: "content",
            payload: session
          }
        )
      }

      return
    }

    case "req:tab-id:get": {
      if (!sender.tab?.id) return

      return await sendMessageToTab<TWORKER_PAYLOAD_RES_GET_TABID>(
        sender.tab?.id,
        {
          type: "res:session:get-active",
          from: "worker",
          to: "content",
          payload: {
            tabId: sender.tab?.id
          }
        }
      )
    }
    default: {
      console.error("Invalid message request!")
      return
    }
  }
}

function main() {
  console.log("Service Worker Active!")

  indexdb.status
    .then((status) => {
      if (status !== "ready") return

      console.log("Listening for messages!")
      chrome.runtime.onMessage.addListener(onMessageListner)
      storage.set(STORAGE_KEY_IS_WORKER_ACTIVE, true)
    })
    .catch((error) => {
      console.error(error)
      chrome.runtime.onMessage.removeListener(onMessageListner)
    })
}

main()

export {}
