import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { Toast, ToastContainer } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";

export type ToastType = {
  id: string;
  title: string;
  message: string;
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "info"
    | "light"
    | "dark";
  delay?: number;
};

interface ToastContextType {
  pushToast: (toast: Omit<ToastType, "id">) => string;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const pushToast = useCallback((toast: Omit<ToastType, "id">) => {
    const id = uuidv4();
    setToasts((prev) => [
      ...prev,
      { delay: 5000, variant: "light", ...toast, id },
    ]);

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ pushToast, removeToast }}>
      {children}

      <ToastContainer
        position="bottom-end"
        className="p-3"
        containerPosition="fixed"
        style={{ zIndex: 1050 }}
      >
        {toasts.map(({ id, title, message, variant, delay }) => (
          <Toast
            key={id}
            bg={variant}
            onClose={() => removeToast(id)}
            delay={delay}
            autohide
          >
            <Toast.Header>
              <strong className="me-auto">{title}</strong>
            </Toast.Header>
            <Toast.Body>{message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </ToastContext.Provider>
  );
};
