"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } from "@/api/notificationApi";
import { followUser } from "@/api/mypageApi";
import useAuth from "@/hooks/useAuth";

export default function NotificationsPage() {
  const { authInfo } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await getNotifications();
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
      window.dispatchEvent(new CustomEvent('notificationsChanged'));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: 'Y' })));
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
      window.dispatchEvent(new CustomEvent('notificationsChanged'));
    } catch (error) {
      console.error("전체 알림 삭제 실패:", error);
    }
  };

  const handleFollowBack = async (e, n) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await followUser(n.senderId);
      alert(`${n.senderNickname || "사용자"}님을 팔로우했습니다.`);
      // 팔로우 수 업데이트를 위해 이벤트 발생
      window.dispatchEvent(new Event("followChanged"));
      // 알림 읽음 처리
      if (n.isRead === 'N') {
        handleMarkAsRead(n.notificationId);
      }
    } catch (error) {
      console.error("팔로우 실패:", error);
      alert("팔로우 처리에 실패했습니다. 이미 팔로우 중일 수 있습니다.");
    }
  };

  const getBadgeConfig = (type) => {
    switch (type) {
      case 'COMMENT': return { label: '댓글', color: 'primary' };
      case 'LIKE': return { label: '좋아요', color: 'danger' };
      case 'FOLLOW': return { label: '팔로우', color: 'success' };
      case 'COMMENT_LIKE': return { label: '댓글 좋아요', color: 'info' };
      default: return { label: '알림', color: 'secondary' };
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
    <div className="container py-5" style={{ maxWidth: "850px" }}>
      <div className="d-flex justify-content-between align-items-end mb-4">
        <div>
          <h2 className="fw-black mb-1" style={{ color: "#16251d", fontSize: "32px", letterSpacing: "-1px" }}>전체 알림</h2>
          <p className="text-muted m-0" style={{ fontSize: "15px", fontWeight: "600" }}>최근 발생한 활동 소식을 확인하세요.</p>
        </div>
        <div className="d-flex gap-2">
          {notifications.some(n => n.isRead === 'N') && (
            <button 
              className="btn btn-outline-success btn-sm fw-bold px-4 rounded-pill border-2"
              style={{ fontSize: "13.5px" }}
              onClick={handleMarkAllAsRead}
            >
              모두 읽음
            </button>
          )}
          {notifications.length > 0 && (
            <button 
              className="btn btn-outline-danger btn-sm fw-bold px-4 rounded-pill border-2"
              style={{ fontSize: "13.5px" }}
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
            {notifications.map((n) => {
              const badge = getBadgeConfig(n.type);
              return (
                <div 
                  key={n.notificationId}
                  className={`list-group-item list-group-item-action p-4 border-0 position-relative transition-all ${n.isRead === 'N' ? 'bg-light bg-opacity-50' : ''}`}
                  style={{ borderLeft: n.isRead === 'N' ? "4px solid var(--slog-green)" : "4px solid transparent" }}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-start gap-3 flex-grow-1">
                      <div className={`rounded-circle bg-${badge.color} bg-opacity-10 d-flex align-items-center justify-content-center flex-shrink-0`} style={{ width: "48px", height: "48px" }}>
                        <i className={`bi ${n.type === 'FOLLOW' ? 'bi-person-plus-fill' : n.type === 'COMMENT' ? 'bi-chat-left-dots-fill' : 'bi-heart-fill'} text-${badge.color} fs-5`}></i>
                      </div>
                      
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <span className={`badge rounded-pill bg-${badge.color} bg-opacity-75 me-2`} style={{ fontSize: "11px", fontWeight: "800", padding: "4px 10px" }}>
                            {badge.label}
                          </span>
                          <span className="text-muted" style={{ fontSize: "13px", fontWeight: "600" }}>
                            {new Date(n.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })} · {new Date(n.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Link 
                          href={n.postId ? `/post/${n.postId}` : n.type === 'FOLLOW' ? `/Mypage/user/${n.senderId}` : "#"}
                          className="text-decoration-none"
                          onClick={() => n.isRead === 'N' && handleMarkAsRead(n.notificationId)}
                        >
                          <p className={`mb-0 ${n.isRead === 'N' ? 'fw-bold text-dark' : 'text-muted font-medium'}`} style={{ fontSize: "16px", lineHeight: "1.5" }}>
                            {n.message}
                          </p>
                        </Link>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-3 ms-4">
                      {n.type === 'FOLLOW' && (
                        <button 
                          className="btn btn-sm btn-outline-success fw-bold px-3 rounded-pill border-2"
                          style={{ fontSize: "13px", height: "32px" }}
                          onClick={(e) => handleFollowBack(e, n)}
                        >
                          맞팔로우
                        </button>
                      )}
                      
                      <div className="d-flex gap-1">
                        {n.isRead === 'N' && (
                          <button 
                            className="btn btn-link text-success p-2 hover-bg-light rounded-circle"
                            onClick={() => handleMarkAsRead(n.notificationId)}
                            title="읽음 처리"
                          >
                            <i className="bi bi-check-all fs-4"></i>
                          </button>
                        )}
                        <button 
                          className="btn btn-link text-danger p-2 hover-bg-light rounded-circle opacity-50"
                          onClick={() => handleDelete(n.notificationId)}
                          title="삭제"
                        >
                          <i className="bi bi-x-lg fs-5"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 bg-white">
            <div className="mb-3 opacity-20">
              <i className="bi bi-bell-slash" style={{ fontSize: "80px", color: "var(--slog-green)" }}></i>
            </div>
            <h4 className="fw-bold text-dark mb-2">도착한 알림이 없어요</h4>
            <p className="text-muted mb-4">새로운 소식이 생기면 이곳에 알려드릴게요.</p>
            <Link href="/" className="btn btn-success rounded-pill px-5 py-2 fw-bold shadow-sm">홈으로 돌아가기</Link>
          </div>
        )}
      </div>
    </div>
  );
}
