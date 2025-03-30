import * as React from "react"

// Define our own types instead of importing to avoid dependencies
type ToastActionElement = React.ReactElement

type ToastProps = {
  variant?: "default" | "destructive" | "success" | "warning" | "info"
  description?: React.ReactNode
  title?: React.ReactNode
  action?: ToastActionElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ToasterToast = ToastProps & {
  id: string
}

type Toast = Omit<ToasterToast, "id">

export const useToast = () => {
  // Modified to prevent toast notifications from showing
  const toast = ({ ...props }: Toast) => {
    // Return a dummy ID but don't actually show the toast
    return { 
      id: Math.random().toString(),
      dismiss: () => {},
      update: () => {}
    };
  }

  // Dummy dismiss function that does nothing
  const dismiss = (toastId?: string) => {}

  return {
    toast,
    dismiss,
    toasts: []
  }
} 