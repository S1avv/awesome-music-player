import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Notification } from "../components/Notification/Notification";

type NotificationType = "success" | "error" | "info" | "warning";

interface NotificationMessage {
  id: string;
  message: string;
  type: NotificationType;
}

interface NotificationContextType {
  showNotification: (message: string, type?: NotificationType) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

  const showNotification = useCallback((message: string, type: NotificationType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {/* Render notifications via portal to ensure they are always on top */}
      {createPortal(
        <div className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none flex flex-col items-center gap-3 pt-6 px-4">
          {notifications.map((notif) => (
            <Notification 
              key={notif.id} 
              message={notif.message} 
              type={notif.type} 
              onClose={() => removeNotification(notif.id)} 
            />
          ))}
        </div>,
        document.body
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
}
