"use client";

import { useState, useEffect } from "react";

import { EventSourcePolyfill } from "event-source-polyfill";
import useAuth from "../../hooks/useAuth";
import { getNotifications, markAsRead } from "../../api/notificationApi";
import Link from "next/link";

export default function NotificationBell() {
  const { authInfo } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // 초기 알림 목록 조회
  useEffect(() => {
    // 로그아웃 상태면 상태 초기화 (하지만 컴포넌트가 null을 반환하므로 실제로는 거의 실행 안됨)
    if (!authInfo.isLogin) {
      return;
    }

    const fetchInitialData = async () => {
      try {
        const response = await getNotifications();
        const data = response.data.data || [];
        setNotifications(data);
        setUnreadCount(data.filter((n) => n.isRead === "N").length);
      } catch (error) {
        console.error("알림을 불러오는데 실패했습니다.", error);
      }
    };

    fetchInitialData();
  }, [authInfo.isLogin]);


  // 실시간 알림 구독 (SSE)
  useEffect(() => {
    if (!authInfo.isLogin) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      console.warn("SSE: Access token not found, skipping subscription.");
      return;
    }

    const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080"}/api/notifications/subscribe`;
    console.log("SSE: Connecting to", apiUrl);

    const eventSource = new EventSourcePolyfill(apiUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      // heartbeatTimeout을 너무 길게 잡으면 브라우저나 폴리필에 따라 연결 유지가 안 될 수 있음
      // 기본값이나 합리적인 값(예: 30분)으로 조정
      heartbeatTimeout: 30 * 60 * 1000, 
    });

    eventSource.onopen = () => {
      console.log("SSE: Connection opened");
    };

    eventSource.addEventListener("connect", (event) => {
      console.log("SSE: Server connected message:", event.data);
    });

    eventSource.addEventListener("notification", (event) => {
      console.log("SSE: Received notification:", event.data);
      try {
        const newNotification = JSON.parse(event.data);
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      } catch (error) {
        console.error("SSE: Notification parse error:", error);
      }
    });

    eventSource.onerror = (error) => {
      console.error("SSE: Connection error:", error);
      // 에러 객체의 상세 정보 로깅 시도
      if (error.status === 401) {
        console.error("SSE: Unauthorized - check token");
      }
    };

    return () => {
      console.log("SSE: Closing connection");
      eventSource.close();
    };
  }, [authInfo.isLogin]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: "Y" } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  // 알림 클릭 시 이동할 링크 생성
  const getNotificationLink = (notification) => {
    if (notification.postId) {
      return `/post/${notification.postId}`;
    }
    return "#";
  };

  if (!authInfo.isLogin) return null;

  return (
    <div className="position-relative">
      <button
        type="button"
        className="btn btn-sm slog-icon-button position-relative"
        aria-label="알림"
        onClick={handleToggle}
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{
              fontSize: "10px",
              padding: "4px 6px",
              border: "2px solid white",
              transform: "translate(-30%, -30%) !important",
            }}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 알림 드롭다운 */}
      {isOpen && (
        <div
          className="notification-dropdown p-0 bg-white rounded-4 overflow-hidden"
          style={{
            position: "absolute",
            top: "45px",
            right: "0",
            width: "320px",
            zIndex: 1000,
          }}
        >
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
            <h6 className="m-0 fw-bold" style={{ fontSize: "15px" }}>알림</h6>
            <button 
              className="btn btn-link btn-sm text-decoration-none p-0 text-success fw-bold" 
              style={{ fontSize: "12px" }}
              onClick={() => {
                // 전체 읽음 처리 로직 (필요시 구현)
              }}
            >
              모두 읽음
            </button>
          </div>
          
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <Link
                  href={getNotificationLink(n)}
                  key={n.notificationId}
                  className={`notification-item d-block text-decoration-none ${n.isRead === "N" ? "unread" : ""}`}
                  onClick={() => {
                    if (n.isRead === "N") handleMarkAsRead(n.notificationId);
                    setIsOpen(false);
                  }}
                >
                  <div className="small text-dark fw-bold mb-1">
                    {n.type === "COMMENT" ? "새 댓글" : n.type === "LIKE" ? "좋아요" : "알림"}
                  </div>
                  <div className="text-muted" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                    {n.message}
                  </div>
                  <div className="text-end text-muted mt-1" style={{ fontSize: "10px" }}>
                    {new Date(n.createdAt).toLocaleString("ko-KR", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "numeric",
                    })}
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-bell-slash fs-4 d-block mb-2"></i>
                <p className="small m-0">새로운 알림이 없습니다.</p>
              </div>
            )}
          </div>

          <div className="p-2 border-top text-center bg-light bg-opacity-25">
            <button className="btn btn-link btn-sm text-decoration-none text-muted" style={{ fontSize: "12px" }}>
              전체 알림 보기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

