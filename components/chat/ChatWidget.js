'use client';

import React, { useState } from 'react';
import ChatList from './ChatList';
import ChatWindow from './ChatWindow';

/**
 * 전역 채팅 플로팅 위젯
 */
const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false); // 위젯 열림 상태
  const [currentRoom, setCurrentRoom] = useState(null); // 현재 보고 있는 채팅방

  // 채팅창 토글
  const toggleWidget = () => {
    setIsOpen(!isOpen);
    if (!isOpen) setCurrentRoom(null); // 닫힐 때 초기화
  };

  // 특정 채팅방으로 진입
  const handleSelectRoom = (room) => {
    setCurrentRoom(room);
  };

  // 목록으로 돌아가기
  const handleBackToList = () => {
    setCurrentRoom(null);
  };

  return (
    <div className="chat-widget-container" 
         style={{ 
           position: 'fixed', 
           bottom: '30px', 
           right: '30px', 
           zIndex: 1050,
           display: 'flex',
           flexDirection: 'column',
           alignItems: 'flex-end' // 오른쪽 정렬 고정
         }}>
      
      {/* 스타일 정의 (애니메이션) */}
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .chat-widget-card {
          animation: fadeInUp 0.3s ease-out;
        }
        .fab-button:hover {
          transform: scale(1.1);
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
          
          {/* 헤더 */}
          <div className="chat-header d-flex justify-content-between align-items-center px-4 py-3" 
               style={{ background: 'var(--slog-green-gradient, #28a745)', color: '#fff' }}>
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

          {/* 컨텐츠 (목록 또는 상세창) */}
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
        className="btn btn-success rounded-circle shadow-lg d-flex align-items-center justify-content-center fab-button"
        onClick={toggleWidget}
        style={{ 
          width: '60px', 
          height: '60px', 
          fontSize: '24px',
          background: isOpen ? '#6c757d' : '#28a745',
          border: 'none',
          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          color: '#fff'
        }}
      >
        <i className={`${isOpen ? "bi bi-chat-dots-fill" : "bi bi-chat-dots"} text-white`}></i>
      </button>
    </div>
  );
};

export default ChatWidget;
