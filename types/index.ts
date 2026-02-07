export type TParsedSubtitle = {
  id: number
  startAt: number
  endAt: number
  text: string
}

export type TSessionStatus = "active" | "playing" | "paused"
export type TSession = {
  sessionId: string
  fileRawText: string
  fileName: string
  fileSize: number
  sessionLastUpdatedAt: string
  sessionCreatedAt: string
  sessionStatus: TSessionStatus
  tabId: number
  tabTitle: string
  tabFaviconUrl: string
  tabUrl: string
  delay: number
}

export type TTargetTab = Pick<
  TSession,
  "tabId" | "tabUrl" | "tabFaviconUrl" | "tabTitle"
>
