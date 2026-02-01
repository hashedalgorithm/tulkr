import { reject } from "lodash"

type TSessionStatus = "idle" | "active" | "playing" | "paused"
export type TSession = {
  sessionId: string
  rawSubtitles: File
  lastUpdatedAt: string
  status: TSessionStatus
  tabId: number
  url: string
}

type TDBStatus = "ready" | "error" | "initiating"
class IndexedDB {
  private db: IDBDatabase
  public status: Promise<TDBStatus> = new Promise((res) => res("initiating"))
  private INDEXED_DB_NAME = "tulkr"
  private INDEXED_DB_STORE_NAME = "sessions"
  private INDEXED_DB_STORE_SESSIONS_KEY_ID = "sessionId"

  constructor() {
    this.status = new Promise((resolve, reject) => {
      const req = indexedDB.open(this.INDEXED_DB_NAME, 1)
      req.onupgradeneeded = () => {
        const db = req.result

        if (db.objectStoreNames.contains(this.INDEXED_DB_STORE_NAME)) return

        const store = db.createObjectStore(this.INDEXED_DB_STORE_NAME, {
          keyPath: this.INDEXED_DB_STORE_SESSIONS_KEY_ID,
          autoIncrement: true
        } satisfies IDBObjectStoreParameters)

        if (!store.indexNames.contains("tabId" satisfies keyof TSession)) {
          store.createIndex(
            "tabId" satisfies keyof TSession,
            "tabId" satisfies keyof TSession,
            { unique: true }
          )
        }
        if (!store.indexNames.contains("status" satisfies keyof TSession)) {
          store.createIndex(
            "status" satisfies keyof TSession,
            "status" satisfies keyof TSession,
            { unique: false }
          )
        }
      }

      req.onsuccess = () => {
        this.db = req.result

        this.db.onversionchange = () => this.db.close()

        resolve("ready")
      }
      req.onerror = () => {
        console.error("IndexedDB error:", req.error)
        reject("error")
      }
      req.onblocked = () => {
        console.warn(
          "IndexedDB open blocked: another connection is open and blocking the upgrade."
        )
      }
    })
  }

  private async ensureReady() {
    const status = await this.status
    if (status !== "ready" || !this.db)
      throw new Error("IndexedDB not initialized")
  }

  async get(sessionId: string): Promise<TSession> {
    await this.ensureReady()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        this.INDEXED_DB_STORE_NAME,
        "readonly"
      )
      const req = transaction
        .objectStore(this.INDEXED_DB_STORE_NAME)
        .get(sessionId)

      req.onsuccess = () => resolve(req.result as TSession)
      req.onerror = () => {
        reject(this.toError(req.error))
      }
      req.transaction.onabort = () => reject(this.toError(transaction.error))
      req.transaction.onerror = () => reject(this.toError(transaction.error))
    })
  }

  async getWithIndex(
    index: keyof TSession,
    value: string
  ): Promise<TSession[]> {
    await this.ensureReady()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        this.INDEXED_DB_STORE_NAME,
        "readonly"
      )

      const idx = transaction
        .objectStore(this.INDEXED_DB_STORE_NAME)
        .index(index)

      const req = idx.get(value)

      req.onsuccess = () => resolve([req.result] as TSession[])
      req.onerror = () => {
        reject(this.toError(req.error))
      }
      req.transaction.onabort = () => reject(this.toError(transaction.error))
      req.transaction.onerror = () => reject(this.toError(transaction.error))
    })
  }

  async insert(value: TSession): Promise<void> {
    await this.ensureReady()
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        this.INDEXED_DB_STORE_NAME,
        "readwrite"
      )
      const req = transaction.objectStore(this.INDEXED_DB_STORE_NAME).put(value)
      req.onsuccess = () => resolve()
      req.onerror = () => {
        reject(this.toError(req.error))
      }
      req.transaction.onabort = () => reject(this.toError(transaction.error))
      req.transaction.onerror = () => reject(this.toError(transaction.error))
    })
  }

  async delete(sessionId: string): Promise<void> {
    await this.ensureReady()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(
        this.INDEXED_DB_STORE_NAME,
        "readwrite"
      )
      const req = transaction
        .objectStore(this.INDEXED_DB_STORE_NAME)
        .delete(sessionId)
      req.onsuccess = () => resolve()
      req.onerror = () => {
        reject(this.toError(req.error))
      }
      req.transaction.onabort = () => reject(this.toError(transaction.error))
      req.transaction.onerror = () => reject(this.toError(transaction.error))
    })
  }

  async update(
    sessionId: string,
    key: keyof TSession,
    value: TSession[keyof TSession]
  ): Promise<void> {
    await this.ensureReady()
    const existingValue = await this.get(sessionId)

    if (!existingValue) {
      console.error("Invalid sessionId!")
      return
    }

    await this.insert({ ...existingValue, [key]: value })
  }

  toError(e: DOMException | null) {
    if (!e) return new Error("Unknown", { cause: "Unknown IndexedDB error" })

    switch (e.name) {
      case "ConstraintError":
        return new Error(e.message, { cause: "ConstraintError" })

      case "QuotaExceededError":
        return new Error(e.message, { cause: "QuotaExceededError" })

      case "NotFoundError":
        return new Error(e.message, { cause: "NotFoundError" })

      case "AbortError":
        return new Error(e.message, { cause: "AbortError" })

      case "TransactionInactiveError":
        return new Error(e.message, { cause: "TransactionInactiveError" })

      case "InvalidStateError":
        return new Error(e.message, { cause: "InvalidStateError" })

      case "ReadOnlyError":
        return new Error(e.message, { cause: "ReadOnlyError" })

      case "VersionError":
        return new Error(e.message, { cause: "VersionError" })

      default:
        return new Error(e.message, { cause: e.name ?? "Unknown" })
    }
  }
}

export default IndexedDB
