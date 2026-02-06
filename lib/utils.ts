import { hsvaToHsla, type HsvaColor } from "@uiw/react-color"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const toStyleSheetSupportedColorFormat = (hsva: HsvaColor) => {
  const hsla = hsvaToHsla(hsva)
  return `hsla(${hsla.h}, ${hsla.s}%, ${hsla.l}%, ${hsla.a})`
}

export const formatBytesSI = (bytes: number, decimals = 0): string => {
  if (!Number.isFinite(bytes)) throw new TypeError("bytes must be a number")
  if (bytes === 0) return "0 B"

  const sign = bytes < 0 ? "-" : ""
  const b = Math.abs(bytes)

  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"]
  const k = 1000

  const i = Math.min(units.length - 1, Math.floor(Math.log(b) / Math.log(k)))

  const value = b / Math.pow(k, i)
  const digits = i === 0 ? 0 : decimals

  return `${sign}${value.toFixed(digits)} ${units[i]}`
}
