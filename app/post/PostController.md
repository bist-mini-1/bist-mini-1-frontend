# PostController API 명세

문서 기준 컨트롤러: [PostController.java](PostController.java)

## 1. 공통 정보

- Base URL: `/api/posts`
- 공통 응답 형식: `ApiResponse<T>`
- 성공 응답 예시

```json
{
  "status": "success",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {}
}
```

- 인증 방식: `@LoginMember` 기반 토큰 인증
- 게시글 상세 조회는 비로그인 사용자도 가능

## 2. 게시글 작성

### `POST /api/posts`

새로운 게시글을 등록합니다.

#### 권한

- 로그인 필요

#### Request Body: `PostRequest`

| 필드 | 타입 | 필수 | 설명 | 예시 |
| :--- | :--- | :--- | :--- | :--- |
| title | String | Y | 게시글 제목 | `제목작성` |
| content | String | Y | 게시글 내용 | `게시글 내용 작성` |
| is_public | String | Y | 공개 여부, `Y` 또는 `N` | `Y` |
| is_temp | String | Y | 임시저장 여부, `Y` 또는 `N` | `N` |
| tags | List<String> | N | 태그 목록 | `["Spring", "JPA"]` |
| tempAttachmentIds | List<String> | N | 임시 첨부파일 ID 목록 | `["uuid-1", "uuid-2"]` |
| tempInlineImageIds | List<String> | N | 본문 인라인 이미지 ID 목록 | `["uuid-3", "uuid-4"]` |
| thumbnail | String | N | 썸네일 이미지 URL | `https://example.com/thumbnail.jpg` |

#### Validation

- `title`: 필수, 1자 이상 200자 이내
- `content`: 필수, 1자 이상
- `is_public`: 필수, `Y` 또는 `N`
- `is_temp`: 필수, `Y` 또는 `N`

#### Response Body: `PostResponse`

| 필드 | 타입 | 설명 |
| :--- | :--- | :--- |
| postId | Long | 게시글 ID |
| memberId | Long | 작성자 회원 ID |
| title | String | 제목 |
| content | String | 내용 |
| viewCount | Long | 조회수 |
| likeCount | Long | 좋아요 수 |
| commentCount | Long | 댓글 수 |
| isPublic | String | 공개 여부 |
| isTemp | String | 임시저장 여부 |
| createdAt | LocalDateTime | 작성일시 |
| updatedAt | LocalDateTime | 수정일시 |
| tags | List<Tag> | 태그 목록 |
| isLiked | Boolean | 로그인 사용자 기준 좋아요 여부 |
| isBookmarked | Boolean | 로그인 사용자 기준 북마크 여부 |

## 3. 게시글 상세 조회

### `GET /api/posts/{postId}`

게시글 ID로 단일 게시글을 조회합니다. 조회 시 조회수가 증가합니다.

#### 권한

- 비로그인 가능

#### Path Parameter

| 이름 | 타입 | 필수 | 설명 | 예시 |
| :--- | :--- | :--- | :--- | :--- |
| postId | Long | Y | 게시글 ID | `1` |

#### Response Body: `PostResponse`

`POST /api/posts` 응답과 동일한 구조를 반환합니다.

#### 주의 사항

- 삭제된 게시글은 조회할 수 없습니다.
- 로그인한 경우 `isLiked`, `isBookmarked` 값이 함께 계산됩니다.

## 4. 게시글 수정

### `PUT /api/posts/{postId}`

게시글 내용을 수정합니다.

#### 권한

- 로그인 필요
- 작성자만 수정 가능

#### Path Parameter

| 이름 | 타입 | 필수 | 설명 | 예시 |
| :--- | :--- | :--- | :--- | :--- |
| postId | Long | Y | 게시글 ID | `1` |

#### Request Body: `PostRequest`

게시글 작성과 동일한 구조를 사용합니다.

#### Response Body: `PostResponse`

수정 완료된 게시글 정보를 반환합니다.

## 5. 게시글 삭제

### `DELETE /api/posts/{postId}`

게시글을 삭제 처리합니다.

#### 권한

- 로그인 필요
- 작성자만 삭제 가능

#### Path Parameter

| 이름 | 타입 | 필수 | 설명 | 예시 |
| :--- | :--- | :--- | :--- | :--- |
| postId | Long | Y | 게시글 ID | `1` |

#### Response Body

- `ApiResponse<Void>`
- `data`는 `null`로 반환될 수 있습니다.

## 6. 임시저장 게시글 목록 조회

### `GET /api/posts/temp/list`

본인이 작성한 임시저장 게시글 목록을 조회합니다.

#### 권한

- 로그인 필요

#### Response Body: `List<PostResponse>`

- 임시저장된 게시글 목록을 배열 형태로 반환합니다.

## 7. 예외 및 처리 기준

- 제목 또는 내용이 비어 있으면 요청이 실패합니다.
- 공개 여부와 임시저장 여부는 `Y` 또는 `N`만 허용됩니다.
- 작성자와 수정/삭제 요청 사용자가 다르면 실패합니다.
- 존재하지 않는 `postId`로 조회/수정/삭제 시 실패합니다.
- 삭제된 게시글은 상세 조회 대상이 아닙니다.
