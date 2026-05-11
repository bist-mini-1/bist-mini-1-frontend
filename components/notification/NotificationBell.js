"use client";

import { useState, useEffect, useRef } from "react";
import { EventSourcePolyfill } from "event-source-polyfill";
import useAuth from "../../hooks/useAuth";
import { getNotifications, markAsRead, markAllAsRead, deleteAllNotifications } from "../../api/notificationApi";
import { followUser } from "../../api/followApi";
import Link from "next/link";

export default function NotificationBell() {
  const { authInfo } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
   const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef(null);

  // 바깥 영역 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (bellRef.current && !bellRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // 초기 알림 목록 조회
  useEffect(() => {
    if (!authInfo.isLogin) return;

    const fetchInitialData = async () => {
      try {
        const response = await getNotifications();
        const data = response.data || [];
        setNotifications(data);
        setUnreadCount(data.filter((n) => n.isRead === "N").length);
      } catch (error) {
        console.error("알림을 불러오는데 실패했습니다.", error);
      }
    };

    fetchInitialData();

    const handleRefresh = () => {
      console.log("SSE: Notifications changed elsewhere, refreshing...");
      fetchInitialData();
    };

    window.addEventListener("notificationsChanged", handleRefresh);
    return () => {
      window.removeEventListener("notificationsChanged", handleRefresh);
    };
  }, [authInfo.isLogin]);

  // 실시간 알림 구독 (SSE)
  useEffect(() => {
    if (!authInfo.isLogin) return;

    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) return;

    const getBaseURL = () => {
      if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
      if (typeof window !== "undefined" && window.location) {
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") {
          return `http://${hostname}:8080`;
        }
      }
      return "http://127.0.0.1:8080";
    };

    const apiUrl = `${getBaseURL()}/api/notifications/subscribe`;
    console.log("SSE: Connecting to", apiUrl);
    
    const eventSource = new EventSourcePolyfill(apiUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      heartbeatTimeout: 30 * 60 * 1000,
    });

    eventSource.addEventListener("notification", (event) => {
      try {
        const newNotification = JSON.parse(event.data);
        console.log("SSE: Received new notification:", newNotification);
        setNotifications((prev) => [newNotification, ...prev]);
        setUnreadCount((prev) => prev + 1);
      } catch (error) {
        console.error("SSE Parse Error:", error);
      }
    });

    return () => eventSource.close();
  }, [authInfo.isLogin]);

  const handleToggle = () => setIsOpen(!isOpen);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.notificationId === id ? { ...n, isRead: "Y" } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      // 다른 컴포넌트(전체 알림 페이지 등)와 동기화
      window.dispatchEvent(new CustomEvent('notificationsChanged'));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: "Y" })));
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notificationsChanged'));
    } catch (error) {
      console.error("전체 읽음 처리 실패:", error);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("모든 알림을 삭제하시겠습니까?")) return;
    try {
      await deleteAllNotifications();
      setNotifications([]);
      setUnreadCount(0);
      window.dispatchEvent(new CustomEvent('notificationsChanged'));
    } catch (error) {
      console.error("전체 삭제 실패:", error);
    }
  };

  const handleFollowBack = async (e, senderId, notificationId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await followUser(senderId);
      alert("맞팔로우했습니다!");
      if (notificationId) handleMarkAsRead(notificationId);
    } catch (error) {
      console.error("팔로우 실패:", error);
      alert("팔로우에 실패했습니다.");
    }
  };

  const getNotificationLink = (notification) => {
    return notification.postId ? `/post/${notification.postId}` : "#";
  };

  if (!authInfo.isLogin) return null;

  return (
    <div className="position-relative" ref={bellRef}>
      <button
        type="button"
        className="btn btn-sm slog-icon-button position-relative"
        onClick={handleToggle}
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ fontSize: "10px", padding: "4px 6px", border: "2px solid white", transform: "translate(-30%, -30%) !important" }}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown p-0 bg-white rounded-4 overflow-hidden shadow-lg border"
          style={{ position: "absolute", top: "45px", right: "0", width: "320px", zIndex: 1000 }}>
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-light bg-opacity-50">
            <h6 className="m-0 fw-bold" style={{ fontSize: "15px" }}>알림</h6>
            <div className="d-flex gap-2">
              {notifications.length > 0 && (
                <button className="btn btn-link btn-sm text-decoration-none p-0 text-muted" 
                  style={{ fontSize: "12px" }} onClick={handleDeleteAll} title="모두 삭제">
                  <i className="bi bi-trash3 me-1"></i>모두 삭제
                </button>
              )}
              {unreadCount > 0 && (
                <button className="btn btn-link btn-sm text-decoration-none p-0 text-success fw-bold" 
                  style={{ fontSize: "12px" }} onClick={handleMarkAllAsRead}>
                  <i className="bi bi-check2-all me-1"></i>모두 읽음
                </button>
              )}
            </div>
          </div>
          
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.notificationId} className="position-relative">
                  <Link href={getNotificationLink(n)}
                    className={`notification-item d-block text-decoration-none ${n.isRead === "N" ? "unread" : ""}`}
                    onClick={() => {
                      if (n.isRead === "N") handleMarkAsRead(n.notificationId);
                      setIsOpen(false);
                    }}>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <div className="small text-dark fw-bold mb-1">
                          {n.type === "COMMENT" ? "새 댓글" : n.type === "LIKE" ? "좋아요" : n.type === "FOLLOW" ? "팔로우" : "알림"}
                        </div>
                        <div className="text-muted" style={{ fontSize: "12px", lineHeight: "1.4" }}>
                          {n.message}
                        </div>
                      </div>
                      {n.type === "FOLLOW" && n.isRead === "N" && (
                        <button 
                          className="btn btn-outline-success btn-sm py-0 px-2 flex-shrink-0"
                          style={{ fontSize: "11px", height: "22px" }}
                          onClick={(e) => handleFollowBack(e, n.senderId, n.notificationId)}
                        >
                          맞팔로우
                        </button>
                      )}
                    </div>
                    <div className="text-end text-muted mt-1" style={{ fontSize: "10px" }}>
                      {new Date(n.createdAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" })}
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-bell-slash fs-4 d-block mb-2"></i>
                <p className="small m-0">새로운 알림이 없습니다.</p>
              </div>
            )}
          </div>

          <div className="p-2 border-top text-center bg-light bg-opacity-25">
            <Link href="/notifications" className="btn btn-link btn-sm text-decoration-none text-muted" 
              style={{ fontSize: "12px" }} onClick={() => setIsOpen(false)}>
              전체 알림 보기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
