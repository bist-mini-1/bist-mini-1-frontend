import { EventSourcePolyfill } from "event-source-polyfill";

let sharedEventSource = null;
let currentToken = null;
const listeners = new Set();

function getBaseURL() {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;

  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `http://${hostname}:8080`;
    }
  }

  return "http://127.0.0.1:8080";
}

function notifyAll(callbackName, payload) {
  listeners.forEach((listener) => {
    const callback = listener?.[callbackName];
    if (typeof callback === "function") {
      callback(payload);
    }
  });
}

function closeSharedConnection() {
  if (sharedEventSource) {
    sharedEventSource.close();
    sharedEventSource = null;
    currentToken = null;
  }
}

function ensureConnection(accessToken) {
  if (!accessToken) return;

  if (sharedEventSource && currentToken === accessToken) {
    return;
  }

  closeSharedConnection();

  const apiUrl = `${getBaseURL()}/api/notifications/subscribe`;

  sharedEventSource = new EventSourcePolyfill(apiUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
    heartbeatTimeout: 30 * 60 * 1000,
  });
  currentToken = accessToken;

  sharedEventSource.addEventListener("notification", (event) => {
    try {
      const parsed = JSON.parse(event.data);
      notifyAll("onNotification", parsed);
    } catch (error) {
      notifyAll("onParseError", error);
    }
  });

  sharedEventSource.addEventListener("chat_unread_update", (event) => {
    notifyAll("onChatUnreadUpdate", event);
  });

  sharedEventSource.onopen = () => notifyAll("onOpen");

  sharedEventSource.onerror = (error) => {
    notifyAll("onError", error);
  };
}

export function subscribeNotificationSse(listener = {}) {
  listeners.add(listener);

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  ensureConnection(accessToken);

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0) {
      closeSharedConnection();
    }
  };
}

export function resetNotificationSseConnection() {
  closeSharedConnection();
}
