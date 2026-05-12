# 게시글 마크다운 이미지 업로드 가이드

이 문서는 프론트엔드 마크다운 에디터와 서버의 임시 업로드 시스템을 연동하는 예시를 제공합니다. 목표는 에디터에서 이미지를 업로드하면 서버가 `tempId`을 반환하고, 본문에 임시 URL(`/api/attachments/temp/{tempId}`)을 삽입한 뒤 게시글 전송 시 서버가 이를 영구 URL로 치환하도록 하는 것입니다.

## 개요

- 임시 업로드 엔드포인트: `POST /api/attachments/temp` (multipart/form-data, `uploadType=INLINE_IMAGE` 또는 `ATTACHMENT`)
- 임시 파일 접근(미디어 삽입용): `/api/attachments/temp/{tempId}`
- 서버 동기화 동작: 게시글 생성/수정 시 서버가 본문에서 `/api/attachments/temp/{tempId}`를 찾아 DB에 저장하고 영구 URL(`/api/attachments/{id}/download`)로 치환합니다.
- 제한: 이미지 파일 사이즈 및 타입은 서버 정책을 따릅니다 (예: inline 이미지 최대 10MB).

## 흐름 요약

1. 사용자가 에디터에서 이미지 업로드 버튼을 클릭.
2. 클라이언트가 이미지 파일을 `POST /api/attachments/temp`로 전송(필드: files[], uploadType=INLINE_IMAGE).
3. 서버는 `tempId`(UUID 문자열)와 `fileUrl`(예: `/api/attachments/temp/{tempId}`)을 응답으로 반환.
4. 클라이언트는 에디터 본문에 마크다운 이미지 문법으로 임시 URL을 삽입:
   - `![alt text](/api/attachments/temp/{tempId})`
5. 사용자가 게시글을 저장(생성/수정)하면 서버는 본문에서 `tempId`들을 찾아 영구 저장 후 본문 내 URL을 치환.
6. 서버는 필요 시 사용되지 않은 임시 파일을 정리합니다.

## 프론트엔드 예시 (Vanilla JS + Fetch)

- 업로드 함수: `uploadImages(files)` — `files`는 FileList 또는 File 배열

```javascript
async function uploadImages(files) {
  const form = new FormData();
  for (const f of files) form.append('files', f);
  // INLINE_IMAGE: 본문에 삽입되는 이미지
  form.append('uploadType', 'INLINE_IMAGE');

  const res = await fetch('/api/attachments/temp', {
    method: 'POST',
    body: form,
    credentials: 'include'
  });
  if (!res.ok) throw new Error('업로드 실패');
  return await res.json(); // 서버가 [{ tempId, fileUrl, originalName, ... }, ...] 반환 가정
}
```

- 에디터에 이미지 삽입(마크다운 에디터 API에 맞게 조정)

```javascript
// files: FileList
async function handleImageUpload(files, insertMarkdownCallback) {
  try {
    const json = await uploadImages(Array.from(files));
    // json은 배열 형태로 반환된다고 가정
    for (const item of json) {
      const tempUrl = item.fileUrl; // /api/attachments/temp/{tempId}
      const alt = item.originalName || '';
      const md = `![${alt}](${tempUrl})`;
      insertMarkdownCallback(md);
    }
  } catch (e) {
    console.error(e);
    alert('이미지 업로드에 실패했습니다.');
  }
}
```

- 게시글 전송 예시 (게시글 생성)

```javascript
async function submitPost({ title, content, tags, is_public = 'Y', is_temp = 'N', thumbnail }) {
  const payload = {
    title,
    content,
    is_public,
    is_temp,
    tags,
    // 프론트엔드에서 tempId 목록을 별도로 수집할 수도 있지만
    // 서버는 본문에서 tempId를 자동으로 추출하므로 이 필드는 선택적입니다.
    // tempInlineImageIds: ["uuid-1", "uuid-2"]
    thumbnail
  };

  const res = await fetch('/api/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('게시글 등록 실패');
  return await res.json();
}
```

> 참고: 서버 구현에서 `PostService`는 `tempInlineImageIds`가 비어있으면 본문에서 `/api/attachments/temp/{tempId}` 패턴을 추출하도록 되어 있으므로, 프론트엔드가 별도 ID 목록을 보내지 않아도 동작합니다. 다만 안정성을 위해 프론트엔드가 업로드 응답에서 `tempId` 목록을 수집해 `tempInlineImageIds`로 함께 보내면 더 명시적입니다.

## 마크다운 삽입 예시

- 표준 마크다운 이미지 문법:
  - `![설명](/api/attachments/temp/uuid-1234-...)`
- HTML 태그 사용(일부 에디터에서 허용):
  - `<img src="/api/attachments/temp/uuid-1234-..." alt="설명" />`

서버 측 정규식은 `/api/attachments/temp/{tempId}` 형태를 찾아 처리하므로 위 두 가지 방식 모두 감지됩니다.

## 게시글 수정 시 유의사항

- 수정 시 기존 본문에 남아있는 영구 URL은 그대로 유지됩니다.
- 사용자가 본문에서 이미지를 제거하면 서버는 기존 DB의 첨부 파일을 찾아 사용되지 않는 이미지는 soft-delete 처리합니다.
- 프론트엔드에서 이미지 삭제를 명시적으로 처리하려면 별도 API를 만들어 삭제 요청을 보내는 방식도 고려하세요.

## 추가 권장사항

- 에디터에서 업로드 진행 중에는 임시 프리뷰를 제공하세요 (temp URL 사용).
- 업로드 실패 시 사용자에게 명확한 에러 메시지를 보여주세요.
- CORS, 인증(토큰/쿠키) 설정을 확인하세요 (`credentials: 'include'` 등).
- `uploadType` 값은 `INLINE_IMAGE`(본문 삽입용) 또는 `ATTACHMENT`(파일 첨부용)로 구분해 서버 검증을 활용하세요.

---

문서 위치: `docs/POST_MARKDOWN_IMAGE_GUIDE.md`

필요하시면 이 예시를 React 컴포넌트(예: `MarkdownEditorWithImageUpload.jsx`)나 Vue 컴포넌트로 변환해 드리겠습니다.