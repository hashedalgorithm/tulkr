export const STORAGE_KEY_CONFIG = "subtitle_config"
export const STORAGE_KEY_IS_WORKER_ACTIVE = "is_worker_active"

class ExtensionLocalStorage {
  constructor() {
    chrome.storage.local.setAccessLevel({
      accessLevel: "TRUSTED_CONTEXTS"
    })
  }

  async get<T>(key: string): Promise<T> {
    try {
      const result = await chrome.storage.local.get()
      return result[key] as T
    } catch (raw: unknown) {
      const error = raw as Error
      console.error(error.message)
      return null
    }
  }

  async set<T extends Object>(key: string, value: T): Promise<void> {
    try {
      await chrome.storage.local.set({ [key]: value })
    } catch (raw: unknown) {
      const error = raw as Error
      console.error(error.message)
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await chrome.storage.local.remove(key)
    } catch (raw: unknown) {
      const error = raw as Error
      console.error(error.message)
    }
  }

  async clearAll(): Promise<void> {
    try {
      await chrome.storage.local.clear()
    } catch (raw: unknown) {
      const error = raw as Error
      console.error(error.message)
    }
  }
}

export default ExtensionLocalStorage
