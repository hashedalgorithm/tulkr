import FileUploader, { type FileUploaderHandle } from "@/components/file-upload"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import UploadedFileInfo from "@/containers/uploaded-file-info"
import {
  sendMessageInRuntime,
  type TPOPUP_PAYLOAD_REQ_INIT,
  type TPopupMessageActions
} from "@/lib/message"
import type { TTargetTab } from "@/types"
import { truncate } from "lodash"
import { CloudUpload, Plus } from "lucide-react"
import { useEffect, useRef, useState, type ChangeEventHandler } from "react"

type TFile = {
  fileName: string
  fileSize: number
  fileRawText: string
}
const AddSession = () => {
  const fileUploaderRef = useRef<FileUploaderHandle>(null)

  const [file, setFile] = useState<TFile | undefined>()
  const [targetTab, setTargetTab] = useState<TTargetTab>()
  const [tabs, setTabs] = useState<chrome.tabs.Tab[]>([])

  const handleOnClickAddSession = async () => {
    if (!file) return

    await sendMessageInRuntime<TPopupMessageActions, TPOPUP_PAYLOAD_REQ_INIT>({
      type: "req:session:init",
      from: "popup",
      to: "worker",
      payload: {
        fileName: file.fileName,
        fileRawText: file.fileRawText,
        fileSize: file.fileSize,
        tabId: targetTab?.tabId,
        tabUrl: targetTab?.tabUrl,
        tabFaviconUrl: targetTab?.tabFaviconUrl,
        tabTitle: targetTab?.tabTitle
      }
    })

    setFile(undefined)
  }

  const handleOnChangeFileInput: ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.currentTarget.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = async () => {
      setFile({
        fileName: file.name,
        fileSize: file.size,
        fileRawText: await file.text()
      })
    }
    reader.readAsText(file)
  }

  const handleOnChangeSelectedTab = (tabId: string | undefined) => {
    if (!tabs || !tabId) return

    const targetTab = tabs.find((tab) => tab.id === parseInt(tabId))

    if (!targetTab) return

    setTargetTab({
      tabId: targetTab.id,
      tabUrl: targetTab.url,
      tabFaviconUrl: targetTab.favIconUrl,
      tabTitle: targetTab.title
    })
  }

  const handleOnClickUploadFile = () => {
    fileUploaderRef.current?.triggerClick()
  }

  useEffect(() => {
    chrome.tabs.query({ currentWindow: true }).then((result) => {
      const mapped = result.filter((tab) => tab.id && tab.title)

      setTabs(mapped)
    })
  }, [])

  return (
    <div className="w-80">
      <div className="mb-4 flex w-full flex-col justify-between gap-2">
        <div className="">
          <p className="font-medium">Choose Tab</p>
          <p className="text-ring">Tab in which the subtitle plays</p>
        </div>

        <Select
          onValueChange={handleOnChangeSelectedTab}
          defaultValue={targetTab?.tabId?.toString()}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a tab" />
          </SelectTrigger>
          <SelectContent>
            {tabs?.map((tab) => (
              <SelectItem
                key={`add-session.tabs.${tab.id}`}
                value={tab.id?.toString()}>
                <div className="flex items-center gap-3">
                  <img src={tab.favIconUrl} className="h-6 w-6 rounded-full" />
                  <p>
                    {truncate(tab.title, {
                      length: 28
                    })}
                  </p>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {file && <UploadedFileInfo {...file} />}
      {file ? (
        <Button
          size="lg"
          type="button"
          disabled={!targetTab?.tabId}
          className="w-full cursor-pointer justify-start gap-3 px-5 py-6"
          onClick={handleOnClickAddSession}>
          <Plus className="h-5 w-5" />
          <span>Create Session</span>
        </Button>
      ) : (
        <FileUploader
          accept=".srt"
          onChange={handleOnChangeFileInput}
          ref={fileUploaderRef}>
          <Button
            size="lg"
            type="button"
            disabled={!targetTab?.tabId}
            className="w-full cursor-pointer justify-start gap-3 px-5 py-6"
            onClick={handleOnClickUploadFile}>
            <CloudUpload className="h-5 w-5" />
            <span>{file ? `Upload New Subtitles` : `Upload Subtitles`}</span>
          </Button>
        </FileUploader>
      )}

      <p className="my-6 text-center text-sm text-ring">
        Upload .srt or .vtt subtitle files to enhance your viewing experience
        across different websites.
      </p>
    </div>
  )
}

export default AddSession
