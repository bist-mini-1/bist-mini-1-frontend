# 댓글 API 명세서 (Comment API Specification)

댓글 관리와 관련된 API 명세입니다. 모든 API 요청 시 기본 베이스 URL은 `/api/comments`입니다.

## 1. 댓글 등록
새로운 댓글 또는 대댓글을 등록합니다.

- **URL:** `/api/comments`
- **Method:** `POST`
- **Authentication:** `Required (JWT Token)`

### Request
#### Headers
| Name | Value | Description |
| :--- | :--- | :--- |
| Authorization | `Bearer {token}` | 사용자 인증 토큰 |

#### Body
| Field | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| postId | Long | Y | 게시글 ID | 1 |
| parentId | Long | N | 부모 댓글 ID (대댓글인 경우) | 8 |
| content | String | Y | 댓글 내용 (최대 2000자) | 정말 유익한 포스팅이네요! |

```json
{
  "postId": 1,
  "parentId": null,
  "content": "정말 유익한 포스팅이네요!"
}
```

### Response
- **Status:** `200 OK`

```json
{
  "status": "success",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "commentId": 15,
    "postId": 1,
    "memberId": 10,
    "parentId": null,
    "content": "정말 유익한 포스팅이네요!",
    "isDeleted": "N",
    "createdAt": "2024-05-08T15:30:00",
    "updatedAt": null,
    "deletedAt": null
  }
}
```

---

## 2. 게시글별 댓글 목록 조회
특정 게시글에 작성된 모든 댓글 목록을 조회합니다.

- **URL:** `/api/comments/post/{postId}`
- **Method:** `GET`
- **Authentication:** `None`

### Request
#### Path Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| postId | Long | 게시글 ID |

### Response
- **Status:** `200 OK`

```json
{
  "status": "success",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    {
      "commentId": 1,
      "postId": 1,
      "memberId": 10,
      "parentId": null,
      "content": "첫 번째 댓글입니다.",
      "isDeleted": "N",
      "createdAt": "2024-05-08T10:00:00",
      "updatedAt": null,
      "deletedAt": null
    },
    {
      "commentId": 2,
      "postId": 1,
      "memberId": 11,
      "parentId": 1,
      "content": "첫 번째 댓글에 대한 답글입니다.",
      "isDeleted": "N",
      "createdAt": "2024-05-08T10:05:00",
      "updatedAt": null,
      "deletedAt": null
    }
  ]
}
```

---

## 3. 댓글 수정
작성자가 자신의 댓글 내용을 수정합니다.

- **URL:** `/api/comments/{commentId}`
- **Method:** `PUT`
- **Authentication:** `Required (JWT Token)`

### Request
#### Path Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| commentId | Long | 수정할 댓글 ID |

#### Headers
| Name | Value | Description |
| :--- | :--- | :--- |
| Authorization | `Bearer {token}` | 사용자 인증 토큰 |

#### Body
| Field | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| content | String | Y | 수정할 댓글 내용 (최대 2000자) | 내용을 수정했습니다. |

```json
{
  "content": "내용을 수정했습니다."
}
```

### Response
- **Status:** `200 OK`

```json
{
  "status": "success",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    "commentId": 1,
    "postId": 1,
    "memberId": 10,
    "parentId": null,
    "content": "내용을 수정했습니다.",
    "isDeleted": "N",
    "createdAt": "2024-05-08T10:00:00",
    "updatedAt": "2024-05-08T15:40:00",
    "deletedAt": null
  }
}
```

---

## 4. 댓글 삭제
작성자가 자신의 댓글을 삭제합니다. 자식 댓글(대댓글)이 있는 경우 함께 삭제 처리된 목록이 반환될 수 있습니다.

- **URL:** `/api/comments/{commentId}`
- **Method:** `DELETE`
- **Authentication:** `Required (JWT Token)`

### Request
#### Path Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| commentId | Long | 삭제할 댓글 ID |

#### Headers
| Name | Value | Description |
| :--- | :--- | :--- |
| Authorization | `Bearer {token}` | 사용자 인증 토큰 |

### Response
- **Status:** `200 OK`
- **Description:** 삭제 처리된 댓글 목록을 반환합니다.

```json
{
  "status": "success",
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": [
    {
      "commentId": 1,
      "postId": 1,
      "memberId": 10,
      "parentId": null,
      "content": "삭제된 댓글입니다.",
      "isDeleted": "Y",
      "createdAt": "2024-05-08T10:00:00",
      "updatedAt": null,
      "deletedAt": "2024-05-08T16:00:00"
    }
  ]
}
```
