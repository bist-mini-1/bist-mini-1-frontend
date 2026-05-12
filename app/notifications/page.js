"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from "@/api/notificationApi";
import useAuth from "@/hooks/useAuth";

export default function NotificationsPage() {
  const { authInfo } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
      // ApiResponse 규격에 따라 실제 데이터는 .data 안에 있음
      setNotifications(response.data || []);
    } catch (error) {
      console.error("알림 목록 조회 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let initialFetchTimer = null;

    if (authInfo.isLogin) {
      initialFetchTimer = window.setTimeout(() => {
        void fetchNotifications();
      }, 0);
    }

    const handleRefresh = () => {
      console.log("Page: Notifications changed elsewhere, refreshing list...");
      void fetchNotifications();
    };

    window.addEventListener("notificationsChanged", handleRefresh);
    return () => {
      if (initialFetchTimer !== null) {
        window.clearTimeout(initialFetchTimer);
      }
      window.removeEventListener("notificationsChanged", handleRefresh);
    };
  }, [authInfo.isLogin]);

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.notificationId === id ? { ...n, isRead: 'Y' } : n)
      );
      // 종 아이콘 등에 변경 알림
      window.dispatchEvent(new CustomEvent('notificationsChanged'));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 'Y' })));
      // 종 아이콘 등에 변경 알림
      window.dispatchEvent(new CustomEvent('notificationsChanged'));
    } catch (error) {
      console.error("전체 읽음 처리 실패:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("이 알림을 삭제하시겠습니까?")) return;
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.notificationId !== id));
      // 종 아이콘 등에 변경 알림
      window.dispatchEvent(new CustomEvent('notificationsChanged'));
    } catch (error) {
      console.error("알림 삭제 실패:", error);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm("모든 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      await deleteAllNotifications();
      setNotifications([]);
      // 종 아이콘 등에 변경 알림
      window.dispatchEvent(new CustomEvent('notificationsChanged'));
    } catch (error) {
      console.error("전체 알림 삭제 실패:", error);
    }
  };

  if (!authInfo.isLogin) {
    return (
      <div className="container py-5 text-center">
        <p>로그인이 필요한 서비스입니다.</p>
        <Link href="/login" className="btn btn-dark">로그인하러 가기</Link>
      </div>
    );
  }

  return (
    <div className="container py-5" style={{ maxWidth: "800px" }}>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-bold mb-1">전체 알림</h2>
          <p className="text-muted m-0 small">최근 발생한 활동 소식을 확인하세요.</p>
        </div>
        <div className="d-flex gap-2">
          {notifications.some(n => n.isRead === 'N') && (
            <button 
              className="btn btn-outline-success btn-sm fw-bold px-3 rounded-pill"
              onClick={handleMarkAllAsRead}
            >
              모두 읽음
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              className="btn btn-outline-danger btn-sm fw-bold px-3 rounded-pill"
              onClick={handleDeleteAll}
            >
              모두 삭제
            </button>
          )}
        </div>
      </div>

      <div className="card border-0 shadow-sm rounded-4 overflow-hidden">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : notifications.length > 0 ? (
          <div className="list-group list-group-flush">
            {notifications.map((n) => (
              <div 
                key={n.notificationId}
                className={`list-group-item list-group-item-action p-4 border-start-4 ${n.isRead === 'N' ? 'border-success bg-light bg-opacity-25' : 'border-transparent'}`}
                style={{ borderLeftWidth: "4px" }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <Link 
                    href={n.postId ? `/post/${n.postId}` : "#"} 
                    className="text-decoration-none flex-grow-1"
                    onClick={() => n.isRead === 'N' && handleMarkAsRead(n.notificationId)}
                  >
                    <div className="d-flex align-items-center mb-2">
                      <span className={`badge rounded-pill me-2 ${n.type === 'COMMENT' ? 'bg-primary' : 'bg-danger'} bg-opacity-75`}>
                        {n.type === 'COMMENT' ? '댓글' : '좋아요'}
                      </span>
                      <small className="text-muted">
                        {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                    <p className={`mb-0 ${n.isRead === 'N' ? 'fw-bold text-dark' : 'text-muted'}`}>
                      {n.message}
                    </p>
                  </Link>
                  <div className="d-flex gap-2 ms-3">
                    {n.isRead === 'N' && (
                      <button 
                        className="btn btn-link text-success p-0"
                        onClick={() => handleMarkAsRead(n.notificationId)}
                        title="읽음 처리"
                      >
                        <i className="bi bi-check2-circle fs-5"></i>
                      </button>
                    )}
                    <button 
                      className="btn btn-link text-danger p-0 opacity-50 hover-opacity-100"
                      onClick={() => handleDelete(n.notificationId)}
                      title="삭제"
                    >
                      <i className="bi bi-trash fs-5"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-5">
            <i className="bi bi-bell-slash fs-1 text-muted d-block mb-3"></i>
            <p className="text-muted">아직 도착한 알림이 없습니다.</p>
            <Link href="/" className="btn btn-light rounded-pill px-4">홈으로 돌아가기</Link>
          </div>
        )}
      </div>
    </div>
  );
}
