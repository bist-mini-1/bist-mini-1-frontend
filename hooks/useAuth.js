"use client";

import { useEffect, useState } from "react";

export default function useAuth() {
  const [authInfo, setAuthInfo] = useState({
    isLogin: false,
    nickname: "",
  });

  useEffect(() => {
    const handleAuthChanged = () => {
      const accessToken = localStorage.getItem("accessToken");
      const nickname = localStorage.getItem("nickname");

      setAuthInfo({
        isLogin: !!accessToken,
        nickname: nickname || "",
      });
    };

    handleAuthChanged();

    window.addEventListener("authChanged", handleAuthChanged);

    return () => {
      window.removeEventListener("authChanged", handleAuthChanged);
    };
  }, []);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("nickname");

    setAuthInfo({
      isLogin: false,
      nickname: "",
    });

    window.dispatchEvent(new Event("authChanged"));
  };

  return {
    authInfo,
    logout,
  };
}