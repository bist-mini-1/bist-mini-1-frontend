'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getMessageHistory, markAsRead } from '@/api/chatApi';

/**
 * 실시간 채팅 대화창 컴포넌트
 */
const ChatWindow = ({ room }) => {
  const [messages, setMessages] = useState([]); 
  const [inputValue, setInputValue] = useState(''); 
  const [memberId, setMemberId] = useState(null); 
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollRef = useRef(null);
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  // 스크롤 하단 이동 (최초 로드 또는 내 메시지 전송 시)
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // 메시지 로드 함수
  const loadHistory = async (targetPage, isInitial = false) => {
    if (isLoading || (!isInitial && !hasMore)) return;
    
    setIsLoading(true);
    try {
      const size = 20;
      const history = await getMessageHistory(room.roomId, targetPage, size);
      
      if (history.length < size) {
        setHasMore(false);
      }

      const reversedHistory = [...history].reverse();
      
      if (isInitial) {
        setMessages(reversedHistory);
        setTimeout(scrollToBottom, 50);
      } else {
        // 과거 내역 추가 시 스크롤 위치 보존 로직
        const scrollContainer = scrollRef.current;
        const previousScrollHeight = scrollContainer.scrollHeight;
        
        setMessages((prev) => [...reversedHistory, ...prev]);
        
        // 데이터 렌더링 후 스크롤 위치 보정
        requestAnimationFrame(() => {
          if (scrollContainer) {
            const newScrollHeight = scrollContainer.scrollHeight;
            scrollContainer.scrollTop = newScrollHeight - previousScrollHeight;
          }
        });
      }
      setPage(targetPage);
    } catch (error) {
      console.error("내역 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 초기 로드 및 구독
  useEffect(() => {
    const myId = localStorage.getItem('memberId');
    if (myId) setMemberId(Number(myId));

    setMessages([]);
    setPage(1);
    setHasMore(true);
    loadHistory(1, true);

    const getBaseURL = () => {
      if (process.env.NEXT_PUBLIC_API_BASE_URL) return process.env.NEXT_PUBLIC_API_BASE_URL;
      if (typeof window !== "undefined" && window.location) {
        const hostname = window.location.hostname;
        if (hostname !== "localhost" && hostname !== "127.0.0.1") return `http://${hostname}:8080`;
      }
      return "http://localhost:8080";
    };

    const apiBaseUrl = getBaseURL();
    const socket = new SockJS(`${apiBaseUrl}/ws-chat`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('STOMP:', str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('STOMP: Connected');
        client.subscribe(`/sub/chat/room/${room.roomId}`, (message) => {
          const data = JSON.parse(message.body);
          
          if (data.messageType === 'READ') {
            // 누군가 읽었을 때 (상대방이 내 메시지를 읽었을 때)
            setMessages((prev) => 
              prev.map((m) => {
                // 내 메시지이면서 읽은 시간보다 이전에 보낸 것이면 읽음 처리
                if (m.senderId !== data.senderId && new Date(m.createdAt) <= new Date(data.createdAt)) {
                  return { ...m, unreadCount: 0 };
                }
                return m;
              })
            );
          } else {
            // 일반 메시지 수신
            setMessages((prev) => [...prev, data]);
            setTimeout(scrollToBottom, 50);
            
            // 내가 방에 있는 상태에서 메시지를 받으면 바로 읽음 처리 API 호출
            if (data.senderId !== Number(localStorage.getItem('memberId'))) {
              handleMarkAsRead();
            }
          }
        });
      },
    });

    client.activate();
    stompClient.current = client;
    handleMarkAsRead();

    return () => {
      if (stompClient.current) stompClient.current.deactivate();
    };
  }, [room.roomId]);

  // 읽음 처리 핸들러
  const handleMarkAsRead = async () => {
    try {
      await markAsRead(room.roomId);
      // 읽음 처리 후 전역 카운트 갱신 유도
      window.dispatchEvent(new CustomEvent('chatUnreadChanged'));
    } catch (error) {
      console.error("읽음 처리 실패:", error);
    }
  };

  // 상단 스크롤 감지 (추가 로드)
  const handleScroll = (e) => {
    if (e.target.scrollTop === 0 && hasMore && !isLoading) {
      loadHistory(page + 1);
    }
  };

  // 메시지 전송
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !stompClient.current || !stompClient.current.connected) return;

    const messageData = {
      roomId: room.roomId,
      senderId: memberId,
      messageType: 'TEXT',
      content: inputValue
    };

    stompClient.current.publish({
      destination: '/pub/chat/message',
      body: JSON.stringify(messageData),
    });

    setInputValue('');
  };

  return (
    <div className="d-flex flex-column h-100 bg-light">
      {/* 메시지 출력 영역 */}
      <div 
        className="flex-grow-1 overflow-auto p-3" 
        ref={scrollRef} 
        onScroll={handleScroll}
      >
        <div className="d-flex flex-column gap-3 justify-content-end" style={{ minHeight: '100%' }}>
          {isLoading && page > 1 && (
            <div className="text-center py-2">
              <div className="spinner-border spinner-border-sm text-success" role="status"></div>
            </div>
          )}
          {messages.map((msg, index) => {
            const isMine = msg.senderId === memberId;
            return (
              <div key={msg.messageId || index} className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
                {!isMine && (
                  <div className="me-2 mt-1" style={{ width: '30px', height: '30px', position: 'relative' }}>
                    <Image 
                      src="/images/default-profile.png" 
                      alt="p" 
                      className="rounded-circle" 
                      fill
                      style={{ objectFit: 'cover' }} 
                    />
                  </div>
                )}
                <div style={{ maxWidth: '75%' }}>
                  {!isMine && <div className="ms-1 mb-1 text-muted" style={{ fontSize: '11px' }}>{msg.senderNickname}</div>}
                  <div 
                    className={`p-2 px-3 rounded-3 shadow-sm ${isMine ? 'bg-success text-white' : 'bg-white'}`}
                    style={{ 
                      fontSize: '14px', 
                      borderRadius: isMine ? '15px 15px 0 15px !important' : '15px 15px 15px 0 !important',
                      wordBreak: 'break-all'
                    }}
                  >
                    {msg.content}
                  </div>
                  <div className={`mt-1 d-flex align-items-center ${isMine ? 'justify-content-end' : 'justify-content-start'}`} style={{ fontSize: '10px' }}>
                    {isMine && msg.unreadCount > 0 && (
                      <span className="text-warning fw-bold me-1" style={{ fontSize: '11px' }}>1</span>
                    )}
                    <span className="text-muted">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 메시지 입력 영역 */}
      <form className="p-3 bg-white border-top d-flex align-items-center gap-2" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          className="form-control border-0 bg-light rounded-pill px-3"
          placeholder="메시지를 입력하세요..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ height: '40px' }}
        />
        <button className="btn btn-success rounded-circle d-flex align-items-center justify-content-center p-0 flex-shrink-0" 
                type="submit"
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  minWidth: '40px',
                  background: 'var(--slog-green-gradient, #28a745)',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
          <i className="bi bi-send-fill" style={{ 
            fontSize: '18px', 
            transform: 'translate(-1px, 1px)', // 시각적 중앙 보정
            lineHeight: 1 
          }}></i>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
