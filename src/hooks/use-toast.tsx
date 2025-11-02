import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"

// Define our own types instead of importing to avoid dependencies
type ToastActionElement = React.ReactElement<any>

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

interface ToastState {
  toasts: ToasterToast[]
}

// Create a container for the toasts if it doesn't exist
const ensureToastContainer = () => {
  const containerId = "compact-toast-container";
  let container = document.getElementById(containerId);
  
  if (!container) {
    container = document.createElement("div");
    container.id = containerId;
    container.style.position = "fixed";
    container.style.bottom = "16px";
    container.style.right = "16px";
    container.style.zIndex = "9999";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "8px";
    container.style.width = "max-content";
    container.style.maxWidth = "calc(100vw - 32px)";
    document.body.appendChild(container);
  }
  
  return container;
};

export const useToast = () => {
  const [state, setState] = React.useState<ToastState>({ toasts: [] });
  
  // Initialize container on mount
  React.useEffect(() => {
    ensureToastContainer();
  }, []);
  
  const toast = React.useCallback(
    ({ title, description, variant = "default", ...props }: Toast) => {
      const id = Math.random().toString();
      const newToast = { id, title, description, variant, ...props };
      
      setState((prev) => ({
        toasts: [...prev.toasts, newToast],
      }));
      
      // Render the toast
      renderToast(newToast);
      
      // Auto dismiss after 3 seconds
      setTimeout(() => {
        dismiss(id);
      }, 3000);
      
      return {
        id,
        dismiss: () => dismiss(id),
        update: () => {}, // Not implemented for simplicity
      };
    },
    []
  );
  
  const dismiss = React.useCallback((toastId?: string) => {
    if (toastId) {
      setState((prev) => ({
        toasts: prev.toasts.filter((t) => t.id !== toastId),
      }));
      
      // Remove the toast element
      const toastElement = document.getElementById(`toast-${toastId}`);
      if (toastElement) {
        toastElement.classList.add('toast-exiting');
        
        // Wait for exit animation to complete
        setTimeout(() => {
          toastElement.remove();
        }, 200);
      }
    } else {
      // Dismiss all toasts
      setState({ toasts: [] });
      const container = document.getElementById("compact-toast-container");
      if (container) {
        container.innerHTML = "";
      }
    }
  }, []);
  
  // Function to render a toast to the DOM
  const renderToast = (toast: ToasterToast) => {
    const container = ensureToastContainer();
    const toastElement = document.createElement("div");
    toastElement.id = `toast-${toast.id}`;
    toastElement.className = "compact-toast";
    
    // Apply styles based on variant
    const variantClass = toast.variant === "destructive" 
      ? "toast-destructive" 
      : toast.variant === "success"
        ? "toast-success"
        : "toast-default";
    
    // Style the toast element
    Object.assign(toastElement.style, {
      backgroundColor: 
        variantClass === "toast-destructive" ? "rgba(220, 38, 38, 0.9)" : 
        variantClass === "toast-success" ? "rgba(34, 197, 94, 0.9)" : 
        "rgba(30, 30, 30, 0.9)",
      color: "#fff",
      borderRadius: "8px",
      padding: "12px 16px",
      fontSize: "14px",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      display: "flex",
      flexDirection: "column",
      maxWidth: "100%",
      backdropFilter: "blur(8px)",
      animation: "toast-enter 0.3s ease forwards",
      transform: "translateY(20px)",
      opacity: "0",
    });
    
    // Add CSS animation
    const style = document.createElement("style");
    style.textContent = `
      @keyframes toast-enter {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      .toast-exiting {
        animation: toast-exit 0.2s ease forwards !important;
      }
      @keyframes toast-exit {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(10px); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
    
    // Add title if provided
    if (toast.title) {
      const titleEl = document.createElement("div");
      titleEl.style.fontWeight = "600";
      titleEl.style.marginBottom = "4px";
      titleEl.textContent = toast.title as string;
      toastElement.appendChild(titleEl);
    }
    
    // Add description if provided
    if (toast.description) {
      const descEl = document.createElement("div");
      descEl.style.opacity = "0.9";
      descEl.textContent = toast.description as string;
      toastElement.appendChild(descEl);
    }
    
    // Add click to dismiss
    toastElement.addEventListener("click", () => {
      dismiss(toast.id);
    });
    
    // Add to container
    container.appendChild(toastElement);
  };
  
  return {
    toast,
    dismiss,
    toasts: state.toasts,
  };
} 