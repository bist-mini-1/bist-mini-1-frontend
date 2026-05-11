'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getMessageHistory, markAsRead } from '@/api/chatApi';

/**
 * 실시간 채팅 대화창 컴포넌트
 */
const ChatWindow = ({ room }) => {
  const [messages, setMessages] = useState([]); // 메시지 목록
  const [inputValue, setInputValue] = useState(''); // 입력값
  const [memberId, setMemberId] = useState(null); // 내 ID
  const stompClient = useRef(null);
  const messagesEndRef = useRef(null);

  // 스크롤 하단 이동
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // 내 정보 로드 (memberId 추출)
    const myId = localStorage.getItem('memberId');
    if (myId) {
      setMemberId(Number(myId));
    }

    // 1. 이전 메시지 내역 로드
    const loadHistory = async () => {
      try {
        const history = await getMessageHistory(room.roomId);
        setMessages(history.reverse()); // 최신이 아래로 오도록
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("내역 로드 실패:", error);
      }
    };
    loadHistory();

    // 2. WebSocket 연결
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8080";
    const socket = new SockJS(`${apiBaseUrl}/ws-chat`);
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log('STOMP:', str),
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('STOMP: Connected');
        // 해당 채팅방 구독
        client.subscribe(`/sub/chat/room/${room.roomId}`, (message) => {
          const newMessage = JSON.parse(message.body);
          setMessages((prev) => [...prev, newMessage]);
          setTimeout(scrollToBottom, 100);
        });
      },
      onStompError: (frame) => {
        console.error('STOMP: Error', frame.headers['message']);
      },
    });

    client.activate();
    stompClient.current = client;

    // 읽음 처리
    markAsRead(room.roomId);

    // 컴포넌트 언마운트 시 연결 종료
    return () => {
      if (stompClient.current) {
        stompClient.current.deactivate();
      }
    };
  }, [room.roomId]);

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
      <div className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-3">
        {messages.map((msg, index) => {
          const isMine = msg.senderId === memberId;
          return (
            <div key={msg.messageId || index} className={`d-flex ${isMine ? 'justify-content-end' : 'justify-content-start'}`}>
              {!isMine && (
                <div className="me-2 mt-1">
                  <img src="/images/default-profile.png" alt="p" className="rounded-circle" style={{ width: '30px', height: '30px' }} />
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
                <div className={`mt-1 text-muted ${isMine ? 'text-end' : 'text-start'}`} style={{ fontSize: '10px' }}>
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 영역 */}
      <form className="p-3 bg-white border-top d-flex gap-2" onSubmit={handleSendMessage}>
        <input 
          type="text" 
          className="form-control border-0 bg-light rounded-pill px-3"
          placeholder="메시지를 입력하세요..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          style={{ height: '40px' }}
        />
        <button className="btn btn-success rounded-circle d-flex align-items-center justify-content-center p-0" 
                type="submit"
                style={{ width: '40px', height: '40px' }}>
          <i className="bi bi-send-fill" style={{ fontSize: '18px' }}></i>
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
