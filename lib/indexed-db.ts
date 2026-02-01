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
          keyPath: this.INDEXED_DB_STORE_SESSIONS_KEY_ID
        })

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
            { unique: true }
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
    if (!this.db) if (!this.db) throw new Error("IndexedDB not initialized")
  }

  async createIndex(key: keyof TSession, unique: boolean = true) {
    this.ensureReady()
    const transaction = this.db.transaction(
      this.INDEXED_DB_STORE_NAME,
      "readonly"
    )
    const store = transaction.objectStore(this.INDEXED_DB_STORE_NAME)

    store.createIndex(
      key satisfies keyof TSession,
      key satisfies keyof TSession,
      { unique }
    )
  }

  async get(sessionId: string): Promise<TSession> {
    this.ensureReady()
    const transaction = this.db.transaction(
      this.INDEXED_DB_STORE_NAME,
      "readonly"
    )
    const req = transaction
      .objectStore(this.INDEXED_DB_STORE_NAME)
      .get(sessionId)
    return req.result as TSession
  }

  async getWithIndex(index: keyof TSession): Promise<TSession[]> {
    this.ensureReady()
    const transaction = this.db.transaction(
      this.INDEXED_DB_STORE_NAME,
      "readonly"
    )
    const req = transaction
      .objectStore(this.INDEXED_DB_STORE_NAME)
      .index(index)
      .getAll()
    return req.result.flatMap((value) => value as TSession[])
  }

  async insert(value: TSession): Promise<void> {
    this.ensureReady()
    const transaction = this.db.transaction(
      this.INDEXED_DB_STORE_NAME,
      "readwrite"
    )
    transaction.objectStore(this.INDEXED_DB_STORE_NAME).put(value)
  }

  async delete(sessionId: string): Promise<void> {
    this.ensureReady()
    const transaction = this.db.transaction(
      this.INDEXED_DB_STORE_NAME,
      "readwrite"
    )
    transaction.objectStore(this.INDEXED_DB_STORE_NAME).delete(sessionId)
  }

  async update(
    sessionId: string,
    key: keyof TSession,
    value: TSession[keyof TSession]
  ): Promise<void> {
    this.ensureReady()
    const existingValue = await this.get(sessionId)

    if (!existingValue) {
      console.error("Invalid sessionId!")
      return
    }

    this.insert({ ...existingValue, [key]: value })
  }
}

export default IndexedDB
