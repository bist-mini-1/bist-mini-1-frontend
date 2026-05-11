# 알림 시스템 SSE (Server-Sent Events) 가이드

본 프로젝트는 실시간 알림 기능을 위해 SSE(Server-Sent Events) 프로토콜을 사용합니다. SSE는 서버에서 클라이언트로 실시간 데이터를 스트리밍하는 단방향 통신 방식입니다.

## 1. 아키텍처 개요

1.  **구독(Subscribe)**: 클라이언트가 서버의 SSE 엔드포인트로 연결을 요청합니다.
2.  **연결 유지**: 서버는 `SseEmitter` 객체를 생성하여 사용자별로 메모리(`ConcurrentHashMap`)에 보관하고 연결을 유지합니다.
3.  **이벤트 발생**: 댓글 작성, 좋아요 클릭 등의 액션이 발생하면 Spring AOP(`NotificationAspect`)가 이를 감지하여 알림 서비스를 호출합니다.
4.  **푸시(Push)**: 서버는 저장된 사용자의 `SseEmitter`를 찾아 이벤트를 전송합니다.

## 2. 기술 스택 및 설정

-   **Spring SseEmitter**: Spring Framework에서 제공하는 SSE 구현체
-   **AOP (Aspect Oriented Programming)**: 비즈니스 로직과 알림 트리거 로직을 분리하기 위해 사용
-   **ConcurrentHashMap**: 사용자 ID와 Emitter 객체를 안전하게 매핑하여 관리
-   **Timeout**: 1시간 (60분) 설정

## 3. SSE 이벤트 흐름

### 3.1 연결 단계 (Handshake)
-   **URL**: `/api/notifications/subscribe`
-   **Method**: `GET`
-   **Header**: `Accept: text/event-stream`, `Authorization: Bearer {token}`
-   **초기 데이터**: 연결 성공 시 `{"name": "connect", "data": "connected!"}` 이벤트를 전송하여 503 에러를 방지합니다.

### 3.2 알림 전송 (Push)
-   비즈니스 로직 수행 후 `NotificationService.createNotification`이 호출됩니다.
-   DB에 알림 정보를 저장한 후, 현재 접속 중인 경우 클라이언트에게 이벤트를 전송합니다.
-   **이벤트명**: `notification`
-   **데이터 포맷**: `Notification` 엔티티 객체 (JSON 형식)

## 4. 예외 및 재연결 처리

-   **연결 종료**: 클라이언트가 브라우저를 닫거나 네트워크 문제가 생기면 `onCompletion`, `onTimeout`, `onError` 콜백이 실행되어 서버 메모리에서 해당 Emitter를 제거합니다.
-   **재연결**: SSE는 기본적으로 브라우저에 의해 자동 재연결이 시도되지만, 클라이언트 코드(JS)에서도 연결 유실 시 `EventSource`를 다시 생성하는 로직이 권장됩니다.
-   **503 Service Unavailable**: 초기 연결 시 더미 데이터를 전송하지 않으면 브라우저에서 타임아웃으로 판단하여 503 에러가 발생할 수 있습니다. 이를 방지하기 위해 `connect` 이벤트를 즉시 발송합니다.

## 5. AOP 트리거링 (NotificationAspect)

현재 다음과 같은 작업 수행 시 자동으로 실시간 알림이 전송됩니다:

1.  **댓글 작성 (`CommentService.createComment`)**: 게시글 작성자에게 알림 전송
2.  **좋아요 클릭 (`LikeService.toggleLike`)**: 게시글 작성자에게 알림 전송 (좋아요를 누른 경우에만)
