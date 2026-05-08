# 알림 API 명세 (Notification API Specification)

알림 조회, 읽음 처리 및 실시간 알림 구독을 위한 API 명세입니다.

## 기본 정보
-   **Base URL**: `/api/notifications`
-   **Authentication**: `Authorization: Bearer {JWT_TOKEN}` (필수)

---

## 1. 알림 구독 (SSE 연결)
실시간 알림을 받기 위해 서버와 지속적인 연결을 맺습니다.

-   **Endpoint**: `/subscribe`
-   **Method**: `GET`
-   **Produces**: `text/event-stream`
-   **Headers**:
    -   `Authorization`: Bearer {JWT_TOKEN}
-   **Response Events**:
    -   `connect`: 연결 성공 시 최초 1회 발생
    -   `notification`: 실제 알림 데이터가 도착할 때 발생

---

## 2. 내 알림 목록 조회
로그인한 사용자가 수신한 모든 알림 목록을 최신순으로 조회합니다.

-   **Endpoint**: `/`
-   **Method**: `GET`
-   **Response Body**:
    ```json
    {
      "status": "SUCCESS",
      "data": [
        {
          "notificationId": 1,
          "receiverId": 10,
          "senderId": 5,
          "senderNickname": "홍길동",
          "postId": 101,
          "commentId": null,
          "type": "LIKE",
          "message": "'오늘의 일기' 게시글을 좋아합니다.",
          "isRead": "N",
          "createdAt": "2024-05-08T15:30:00",
          "readAt": null
        }
      ],
      "message": "요청이 성공적으로 처리되었습니다."
    }
    ```

---

## 3. 알림 읽음 처리
특정 알림을 읽음 상태로 변경합니다.

-   **Endpoint**: `/{id}/read`
-   **Method**: `PATCH`
-   **Path Variables**:
    -   `id`: 알림 ID
-   **Response Body**:
    ```json
    {
      "status": "SUCCESS",
      "data": null,
      "message": "요청이 성공적으로 처리되었습니다."
    }
    ```

---

## 데이터 모델

### NotificationResponseDto
| 필드명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `notificationId` | Long | 알림 고유 ID |
| `receiverId` | Long | 알림 수신자(로그인 사용자) ID |
| `senderId` | Long | 알림 원인 제공자 ID |
| `senderNickname`| String | 알림 원인 제공자 닉네임 |
| `postId` | Long | 관련 게시글 ID (없을 시 null) |
| `commentId` | Long | 관련 댓글 ID (없을 시 null) |
| `type` | String | 알림 타입 (`LIKE`, `COMMENT`, `FOLLOW`) |
| `message` | String | 알림 메시지 내용 |
| `isRead` | String | 읽음 여부 (`Y` / `N`) |
| `createdAt` | String | 알림 생성 일시 |
| `readAt` | String | 알림 확인 일시 |
