'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { getChatRooms, getFollowingList, getOrCreatePersonalRoom } from '@/api/chatApi';

/**
 * 채팅방 목록 및 팔로우 목록 컴포넌트
 */
const ChatList = ({ onSelectRoom }) => {
  const [rooms, setRooms] = useState([]); // 참여 중인 방
  const [followings, setFollowings] = useState([]); // 팔로우 중인 사람
  const [showFollowing, setShowFollowing] = useState(false); // 팔로우 목록 표시 여부
  const [loading, setLoading] = useState(true);
  // 참여 중인 채팅방 목록 조회
  async function fetchRooms() {
    try {
      setLoading(true);
      const data = await getChatRooms();
      setRooms(data);
    } catch (error) {
      console.error("채팅방 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => fetchRooms(), 0);
    return () => clearTimeout(t);
  }, []);

  // 팔로우 목록 조회
    const fetchFollowings = async () => {
      try {
        setLoading(true);
        // localStorage에서 내 정보 가져오기
        const myId = localStorage.getItem('memberId');
        if (!myId) {
          alert("로그인이 필요합니다.");
          return;
        }
        
        const data = await getFollowingList(myId);
        setFollowings(data.users || []); // FollowListResponse에서 users 추출
        setShowFollowing(true);
      } catch (error) {
        console.error("팔로우 목록 로드 실패:", error);
        alert("팔로우 목록을 불러올 수 없습니다.");
        setFollowings([]);
        setShowFollowing(false);
      } finally {
        setLoading(false);
      }
    };

  // 새 대화 시작 (팔로우 클릭 시)
  const handleStartChat = async (partnerId) => {
    try {
      const room = await getOrCreatePersonalRoom(partnerId);
      onSelectRoom(room); // 위젯의 currentRoom으로 설정
    } catch (error) {
      alert("채팅방을 생성할 수 없습니다.");
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center h-100">
        <div className="spinner-border text-success" role="status"></div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column h-100">
      {/* 검색 및 새 채팅 버튼 */}
      <div className="p-3 border-bottom bg-light">
        {!showFollowing ? (
          <button className="btn btn-outline-success w-100 fw-bold rounded-pill" onClick={fetchFollowings}>
            <i className="bi bi-plus-lg me-2"></i>새 채팅 시작 (팔로우)
          </button>
        ) : (
          <div className="d-flex align-items-center">
            <button className="btn btn-link p-0 me-2" onClick={() => setShowFollowing(false)}>
              <i className="bi bi-arrow-left text-dark"></i>
            </button>
            <h6 className="m-0 fw-bold">대화 상대 선택</h6>
          </div>
        )}
      </div>

      {/* 목록 영역 */}
      <div className="flex-grow-1 overflow-auto">
        {!showFollowing ? (
          /* 채팅방 목록 */
          rooms.length > 0 ? (
            <div className="list-group list-group-flush">
              {rooms.map(room => (
                <button 
                  key={room.roomId} 
                  className="list-group-item list-group-item-action d-flex align-items-center p-3 border-0"
                  onClick={() => onSelectRoom(room)}
                >
                  <div className="flex-shrink-0" style={{ width: '45px', height: '45px', position: 'relative' }}>
                    <Image 
                      src={room.partnerProfileImage || '/images/default-profile.png'} 
                      alt="profile" 
                      className="rounded-circle"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="ms-3 flex-grow-1 overflow-hidden">
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="fw-bold text-truncate">{room.partnerNickname || '참여 중'}</span>
                      <small className="text-muted" style={{ fontSize: '11px' }}>
                        {new Date(room.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                    <div className="text-muted text-truncate" style={{ fontSize: '13px' }}>
                      {room.lastMessage}
                    </div>
                  </div>
                  {room.unreadCount > 0 && (
                    <div className="ms-2 flex-shrink-0">
                      <span className="badge rounded-pill bg-danger" style={{ fontSize: '10px', padding: '5px 7px' }}>
                        {room.unreadCount > 99 ? '99+' : room.unreadCount}
                      </span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center mt-5 text-muted">
              <i className="bi bi-chat-left-dots style={{ fontSize: '3rem' }}"></i>
              <p className="mt-2">참여 중인 대화가 없습니다.</p>
            </div>
          )
        ) : (
          /* 팔로잉 목록 */
          followings.length > 0 ? (
            <div className="list-group list-group-flush">
              {followings.map(member => (
                <button 
                  key={member.memberId} 
                  className="list-group-item list-group-item-action d-flex align-items-center p-3 border-0"
                  onClick={() => handleStartChat(member.memberId)}
                >
                  <div className="flex-shrink-0" style={{ width: '40px', height: '40px', position: 'relative' }}>
                    <Image 
                      src={member.profileImage || '/images/default-profile.png'} 
                      alt="profile" 
                      className="rounded-circle"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                  <div className="ms-3">
                    <div className="fw-bold">{member.nickname}</div>
                    <small className="text-muted">{member.bio || '안녕하세요!'}</small>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center mt-5 text-muted p-4">
              팔로우 중인 사용자가 없습니다.<br/>먼저 사용자를 팔로우해 보세요!
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ChatList;
