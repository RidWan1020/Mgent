import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import Notification from "@Components/ToastNotification";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((type, title, message, duration = 3000) => {
    setNotification({ type, title, message, duration });
  }, []);

  const notifySuccess = useCallback(
    (message) => notify("success", "সফল", message),
    [notify]
  );

  const notifyError = useCallback(
    (message) => notify("error", "ত্রুটি", message),
    [notify]
  );

  const clearNotification = () => setNotification(null);

  // Auto-clear notification after duration
  useEffect(() => {
    if (notification && notification.duration) {
      const timer = setTimeout(clearNotification, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  return (
    <NotificationContext.Provider
      value={{ notify, notifySuccess, notifyError, clearNotification }}
    >
      {children}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <Notification
            type={notification.type}
            title={notification.title}
            message={notification.message}
            duration={notification.duration}
            showIcon
            onClose={clearNotification}
          />
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);