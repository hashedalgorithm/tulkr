import { cn } from "@/lib/utils"
import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ComponentProps,
  type PropsWithChildren
} from "react"

export type FileUploaderHandle = {
  triggerClick: () => void
}

const FileUploader = forwardRef<
  FileUploaderHandle,
  PropsWithChildren<ComponentProps<"input">>
>(({ children, ...props }, ref) => {
  const inputRef = useRef<HTMLInputElement | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      triggerClick: () => inputRef.current?.click()
    }),
    []
  )

  return (
    <label className="block w-full">
      <input
        {...props}
        ref={inputRef}
        type="file"
        className={cn("hidden", props.className)}
      />
      {children}
    </label>
  )
})

export default FileUploader
