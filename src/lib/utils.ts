import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function handleError(error: unknown) {
  console.error("Error:", error)

  if (error instanceof Error) {
    console.error(error.message)
    throw new Error(`Error: ${error.message}`)
  } else if (typeof error === "string") {
    console.error(error)
    throw new Error(error)
  } else {
    const errorMessage = JSON.stringify(error)
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}
