# BIST Mini Project 1

## 📖 프로젝트 소개 (Project Description)
BIST Mini Project 1은 사용자들이 마크다운을 활용해 자유롭게 게시글을 작성하고 공유하며, 실시간 채팅 및 알림, 소셜 상호작용(팔로우 등), 게이미피케이션 요소(활동 잔디, 캐릭터)를 통해 활발하게 소통할 수 있는 웹 커뮤니티 플랫폼입니다.

## 👥 팀원 소개 (Team Members)
| 이름 | 역할 / 파트 | GitHub |
| :---: | :---: | :---: |
| **전명준** | Member | [@baming320](https://github.com/baming320) |
| **김지환** | Member | [@pileuszu](https://github.com/pileuszu) |
| **방대혁** | Member | [@daehyuk1231](https://github.com/daehyuk1231) |
| **신동원** | Member | [@shindw2001](https://github.com/shindw2001) |

## 🛠️ 기술 스택 (Tech Stack)
- **Framework/Library:** Next.js 16 (App Router), React 19
- **Styling:** Bootstrap 5, Bootstrap Icons
- **HTTP Client:** Axios
- **Real-time Communication:** SockJS, StompJS (Websocket), EventSource (SSE)
- **Markdown Editor:** `@uiw/react-md-editor`, `react-markdown`

## ✨ 주요 기능 (Key Features)

### 1. 인증 및 계정 관리 (Auth & User)
- 회원가입 (비밀번호 정책 검증, 아이디/이메일/닉네임 중복 확인)
- 로그인 및 로그아웃 (JWT 기반 세션 유지)
- 프로필 관리 (이미지 업로드, 닉네임 및 자기소개 변경)

### 2. 콘텐츠 관리 (Post Management)
- 마크다운 기반 에디터 지원 (이미지 삽입, 서식 설정)
- 썸네일 이미지 및 첨부파일 업로드 지원
- 게시글 태그 추가 및 자동 완성 기능
- 댓글 및 대댓글(계층 구조) 작성, 수정, 삭제
- 게시글 좋아요 및 북마크 기능

### 3. 피드 및 검색 (Feed & Search)
- 메인 피드 조회 (최신순, 인기순, 추천순 필터링 제공)
- 무한 스크롤 / 페이지네이션 지원
- 통합 검색 (제목, 내용, 작성자, 태그 기반 검색)

### 4. 소셜 기능 (Social Interaction)
- 유저 간 팔로우 / 언팔로우 시스템
- 타 유저 프로필 방문 및 작성 글 목록 조회

### 5. 실시간 소통 (Real-time Chat)
- 유저 간 1:1 실시간 채팅 (WebSocket 연동)
- 채팅방 목록 조회 및 읽지 않은 메시지 알림 표시

### 6. 알림 시스템 (Notification)
- 좋아요, 댓글, 팔로우 등의 이벤트 발생 시 실시간 알림 수신 (SSE 기반)
- 알림 목록 조회 및 전체 읽음 처리 기능

### 7. 게이미피케이션 (Gamification)
- **활동 잔디 (Contribution Grass):** 게시글/댓글 활동 기록에 따른 마이페이지 잔디 채우기
- **성장형 캐릭터:** 유저 활동 점수에 연동되어 변하는 캐릭터/아바타 이미지 제공

## 🚀 로컬 실행 방법 (Getting Started)

프로젝트를 로컬 환경에서 실행하려면 아래 명령어를 사용하세요.

```bash
# 1. 의존성 패키지 설치
npm install
# 또는 yarn install / pnpm install

# 2. 개발 서버 실행
npm run dev
# 또는 yarn dev / pnpm dev
```

이후 브라우저에서 [http://localhost:3000](http://localhost:3000) 주소로 접속하여 확인할 수 있습니다.
