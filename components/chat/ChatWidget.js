'use client';

import React, { useState, useEffect, useRef } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';
import useAuth from '../../hooks/useAuth';
import { getChatRooms } from '@/api/chatApi';
import { subscribeNotificationSse } from '../../utils/notificationSse';

/**
 * 전역 채팅 플로팅 위젯
 */
const ChatWidget = () => {
  const { authInfo } = useAuth();
  const [isOpen, setIsOpen] = useState(false); // 위젯 열림 상태
  const [currentRoom, setCurrentRoom] = useState(null); // 현재 보고 있는 채팅방
  const [totalUnread, setTotalUnread] = useState(0); // 전체 안 읽은 메시지 수
  const widgetRef = useRef(null);

  // 안 읽은 메시지 총합 계산
  const fetchTotalUnread = async () => {
    if (!authInfo.isLogin) return;
    try {
      const rooms = await getChatRooms();
      const sum = rooms.reduce((acc, room) => acc + (room.unreadCount || 0), 0);
      setTotalUnread(sum);
    } catch (error) {
      console.error("전체 안 읽은 메시지 조회 실패:", error);
    }
  };

  // 초기 로드 및 SSE 구독
  useEffect(() => {
    if (!authInfo.isLogin) return;

    fetchTotalUnread();

    const unsubscribe = subscribeNotificationSse({
      onChatUnreadUpdate: () => {
        console.log('SSE (ChatWidget): 채팅 안 읽음 카운트 갱신 이벤트 수신');
        fetchTotalUnread();
        window.dispatchEvent(new Event("chat_unread_update"));
      },
      onNotification: () => {
        fetchTotalUnread();
      },
      onOpen: () => {
        console.log('SSE (ChatWidget): Connected');
      },
      onError: (error) => {
        console.error('SSE (ChatWidget): Connection error', error);
      },
    });

    return () => {
      unsubscribe();
    };
  }, [authInfo.isLogin]);

  // 내부 읽음 처리 이벤트 리스너
  useEffect(() => {
    const handleChatRead = () => {
      console.log('Local Event: Chat read, refreshing total unread...');
      fetchTotalUnread();
    };
    window.addEventListener('chatUnreadChanged', handleChatRead);
    return () => window.removeEventListener('chatUnreadChanged', handleChatRead);
  }, []);

  // 바깥 영역 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event) {
      if (widgetRef.current && !widgetRef.current.contains(event.target)) {
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

  // 채팅창 토글
  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setCurrentRoom(null);
      fetchTotalUnread();
    }
  };

  const handleSelectRoom = (room) => {
    setCurrentRoom(room);
  };

  const handleBackToList = () => {
    setCurrentRoom(null);
    fetchTotalUnread();
  };

  if (!authInfo.isLogin) return null;

  return (
    <div className="chat-widget-container" ref={widgetRef} 
         style={{ 
           position: 'fixed', 
           bottom: '30px', 
           right: '30px', 
           zIndex: 1050,
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'flex-end'
         }}>
      
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-widget-card {
          animation: fadeInUp 0.3s ease-out;
        }
        .fab-button:hover {
          transform: scale(1.05);
        }
        .unread-badge {
          position: absolute;
          top: 0;
          right: 0;
          background-color: #ff4d4f;
          color: white;
          border-radius: 50%;
          padding: 0;
          min-width: 22px;
          height: 22px;
          font-size: 11px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          transform: translate(30%, -30%);
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          z-index: 2;
        }
      `}</style>

      {/* 채팅 위젯 본체 */}
      {isOpen && (
        <div className="chat-widget-card shadow-lg border-0" 
             style={{ 
               width: '380px', 
               height: '550px', 
               backgroundColor: '#fff', 
               borderRadius: '20px', 
               marginBottom: '15px',
               display: 'flex',
               flexDirection: 'column',
               overflow: 'hidden',
               border: '1px solid #eee'
             }}>
          
          <div className="chat-header d-flex justify-content-between align-items-center px-4 py-3" 
               style={{ background: 'var(--slog-green-gradient, #2f8f5b)', color: '#fff' }}>
            <div className="d-flex align-items-center">
              {currentRoom && (
                <button className="btn btn-link text-white p-0 me-2" onClick={handleBackToList}>
                  <i className="bi bi-chevron-left"></i>
                </button>
              )}
              <h6 className="m-0 fw-bold">
                {currentRoom ? (currentRoom.partnerNickname || '채팅방') : '실시간 채팅'}
              </h6>
            </div>
            <button className="btn btn-link text-white p-0" onClick={toggleWidget}>
              <i className="bi bi-x-lg"></i>
            </button>
          </div>

          <div className="chat-content flex-grow-1" style={{ position: 'relative', overflow: 'hidden' }}>
            {currentRoom ? (
              <ChatWindow room={currentRoom} onBack={handleBackToList} />
            ) : (
              <ChatList onSelectRoom={handleSelectRoom} />
            )}
          </div>
        </div>
      )}

      {/* 플로팅 버튼 (FAB) */}
      <button 
        className="btn btn-success rounded-circle shadow-lg d-flex align-items-center justify-content-center fab-button position-relative"
        onClick={toggleWidget}
        style={{ 
          width: '60px', 
          height: '60px', 
          fontSize: '24px',
          background: isOpen ? '#6c757d' : '#2f8f5b',
          border: 'none',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          color: '#fff'
        }}
      >
        <i className={`${isOpen ? "bi bi-chat-dots-fill" : "bi bi-chat-dots"} text-white`}></i>
        {!isOpen && totalUnread > 0 && (
          <span className="unread-badge">
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  );
};

export default ChatWidget;
