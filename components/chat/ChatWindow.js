import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getMessageHistory, markAsRead, updateMessage, deleteMessage } from '@/api/chatApi';

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
  
  // 수정 관련 상태
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [activeMenuId, setActiveMenuId] = useState(null);
  
  const scrollRef = useRef(null);
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  // 메뉴 팝업 닫기 처리
  useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

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
        const scrollContainer = scrollRef.current;
        const previousScrollHeight = scrollContainer.scrollHeight;
        
        setMessages((prev) => [...reversedHistory, ...prev]);
        
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
            setMessages((prev) => 
              prev.map((m) => {
                if (m.senderId !== data.senderId && new Date(m.createdAt) <= new Date(data.createdAt)) {
                  return { ...m, unreadCount: 0 };
                }
                return m;
              })
            );
          } else if (data.messageType === 'UPDATE') {
            setMessages((prev) => 
              prev.map((m) => m.messageId === data.messageId ? { ...m, content: data.content } : m)
            );
          } else if (data.messageType === 'DELETE') {
            setMessages((prev) => prev.filter((m) => m.messageId !== data.messageId));
          } else {
            setMessages((prev) => [...prev, data]);
            setTimeout(scrollToBottom, 50);
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

  // 메시지 수정 시작
  const startEditing = (msg) => {
    setEditingId(msg.messageId);
    setEditContent(msg.content);
    setActiveMenuId(null);
  };

  // 메시지 수정 취소
  const cancelEditing = () => {
    setEditingId(null);
    setEditContent('');
  };

  // 메시지 수정 완료
  const submitEdit = async () => {
    if (!editContent.trim()) return;
    try {
      await updateMessage(editingId, editContent);
      setEditingId(null);
      setEditContent('');
    } catch (error) {
      console.error("메시지 수정 실패:", error);
      alert("메시지 수정 중 오류가 발생했습니다.");
    }
  };

  // 메시지 삭제
  const handleDelete = async (messageId) => {
    if (!confirm("메시지를 삭제하시겠습니까?")) return;
    try {
      await deleteMessage(messageId);
      setActiveMenuId(null);
    } catch (error) {
      console.error("메시지 삭제 실패:", error);
      alert("메시지 삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="d-flex flex-column h-100 bg-light position-relative">
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
            const isMine = msg.senderId === memberId || msg.isMine;
            const isEditing = editingId === msg.messageId;

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
                <div style={{ maxWidth: '80%', position: 'relative' }}>
                  {!isMine && <div className="ms-1 mb-1 text-muted" style={{ fontSize: '11px' }}>{msg.senderNickname}</div>}
                  
                  <div className="d-flex align-items-end gap-1">
                    {/* 내 메시지일 때 시간 표시 (왼쪽) */}
                    {isMine && !isEditing && (
                      <div className="d-flex flex-column align-items-end" style={{ fontSize: '10px', minWidth: '40px' }}>
                        {msg.unreadCount > 0 && <span className="text-warning fw-bold" style={{ fontSize: '11px' }}>1</span>}
                        <span className="text-muted">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}

                    <div className="position-relative">
                      {isEditing ? (
                        <div className="d-flex flex-column gap-1 bg-white p-2 rounded shadow-sm border border-success">
                          <textarea 
                            className="form-control form-control-sm border-0 p-0"
                            style={{ resize: 'none', minWidth: '200px', fontSize: '14px' }}
                            rows="2"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            autoFocus
                          />
                          <div className="d-flex justify-content-end gap-2">
                            <button className="btn btn-link text-muted p-0 text-decoration-none" style={{ fontSize: '12px' }} onClick={cancelEditing}>취소</button>
                            <button className="btn btn-link text-success p-0 text-decoration-none fw-bold" style={{ fontSize: '12px' }} onClick={submitEdit}>수정</button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`p-2 px-3 rounded-3 shadow-sm ${isMine ? 'bg-success text-white' : 'bg-white'}`}
                          onContextMenu={(e) => {
                            if (isMine) {
                              e.preventDefault();
                              setActiveMenuId(msg.messageId);
                            }
                          }}
                          onClick={(e) => {
                            if (isMine) {
                              e.stopPropagation();
                              setActiveMenuId(activeMenuId === msg.messageId ? null : msg.messageId);
                            }
                          }}
                          style={{ 
                            fontSize: '14px', 
                            borderRadius: isMine ? '15px 15px 0 15px !important' : '15px 15px 15px 0 !important',
                            wordBreak: 'break-all',
                            cursor: isMine ? 'pointer' : 'default'
                          }}
                        >
                          {msg.content}
                        </div>
                      )}

                      {/* 수정/삭제 메뉴 */}
                      {activeMenuId === msg.messageId && isMine && !isEditing && (
                        <div 
                          className="position-absolute bg-white border rounded shadow-sm py-1"
                          style={{ 
                            top: '100%', 
                            right: 0, 
                            zIndex: 10, 
                            minWidth: '80px',
                            marginTop: '5px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-3 py-1 text-dark" style={{ cursor: 'pointer', fontSize: '13px' }} onClick={() => startEditing(msg)}>수정</div>
                          <div className="px-3 py-1 text-danger" style={{ cursor: 'pointer', fontSize: '13px' }} onClick={() => handleDelete(msg.messageId)}>삭제</div>
                        </div>
                      )}
                    </div>

                    {/* 상대방 메시지일 때 시간 표시 (오른쪽) */}
                    {!isMine && (
                      <div className="d-flex flex-column" style={{ fontSize: '10px', minWidth: '40px' }}>
                        <span className="text-muted">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 메시지 입력 영역 */}
      {!editingId && (
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
            <i className="bi bi-send-fill" style={{ fontSize: '18px', transform: 'translate(-1px, 1px)', lineHeight: 1 }}></i>
          </button>
        </form>
      )}
    </div>
  );
};

export default ChatWindow;
