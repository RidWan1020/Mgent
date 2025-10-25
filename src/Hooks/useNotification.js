import { useState, useCallback } from "react";

export function useNotification() {
  const [notification, setNotification] = useState(null);

  const notify = useCallback((type, title, message, duration = 5000) => {
    setNotification({ type, title, message, duration });
  }, []);

  const notifySuccess = useCallback((message, title = "Success!") => {
    notify("success", title, message);
  }, [notify]);

  const notifyError = useCallback((message, title = "Error!") => {
    notify("error", title, message);
  }, [notify]);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    notify,
    notifySuccess,
    notifyError,
    clearNotification,
  };
}
