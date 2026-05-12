"use client";

import { useSyncExternalStore } from "react";
import { isTokenExpired } from "../utils/tokenUtils";

const AUTH_CHANGED_EVENT = "authChanged";

const getAuthInfo = () => {
  if (typeof window === "undefined") {
    return {
      isLogin: false,
      nickname: "",
    };
  }

  const accessToken = localStorage.getItem("accessToken");
  const nickname = localStorage.getItem("nickname");

  if (!accessToken || isTokenExpired(accessToken)) {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("nickname");

    return {
      isLogin: false,
      nickname: "",
    };
  }

  return {
    isLogin: true,
    nickname: nickname || "",
  };
};

const getSnapshot = () => {
  return JSON.stringify(getAuthInfo());
};

const getServerSnapshot = () => {
  return JSON.stringify({
    isLogin: false,
    nickname: "",
  });
};

const subscribe = (callback) => {
  window.addEventListener(AUTH_CHANGED_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_CHANGED_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
};

export default function useAuth() {
  const snapshot = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const authInfo = JSON.parse(snapshot);

  const loginAuth = (data) => {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("nickname", data.nickname || "");
    if (data.memberId) localStorage.setItem("memberId", String(data.memberId));

    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  };

  const logoutAuth = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("nickname");
    localStorage.removeItem("memberId");

    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  };

  return {
    authInfo,
    loginAuth,
    logoutAuth,
  };
}