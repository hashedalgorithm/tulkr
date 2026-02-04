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
