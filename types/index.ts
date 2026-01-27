export type TParsedSubtitle = {
  id: number
  startAt: number
  endAt: number
  text: string
}

export type TColor = `#${string}`

export type TRequestStatus = "success" | "fail"
export type TMessagePayloadRequest =
  | {
      type: "sub-init"
      subs: TParsedSubtitle[]
      fileName?: string
    }
  | {
      type: "sub-clear"
    }
export type TMessagePayloadResponse = {
  type: `ack-${TMessagePayloadRequest["type"]}` | "ack-error"
  status: TRequestStatus
  message?: string
}
