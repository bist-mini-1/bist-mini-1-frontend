"use client";

import { useState, useEffect, useRef } from "react";
import {
  getMyProfile,
  updateNickname,
  updatePassword,
  updateBio,
  updateProfileImage,
  checkNicknameDuplicate,
  getMyInterestTags,
  updateInterestTags,
} from "../../../api/mypageApi";
import { getTagList } from "../../../api/memberApi";
import Image from "next/image";

const GREEN = "#3cb878";
const GREEN_DARK = "#2e7d32";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* 프로필 데이터 */
  const [nickname, setNickname] = useState("");
  const [bio, setBio] = useState("");
  const [profileImage, setProfileImage] = useState(null); // 절대 URL or null

  /* 닉네임 수정 */
  const [newNickname, setNewNickname] = useState("");
  const [nickMsg, setNickMsg] = useState({ text: "", ok: null });

  /* 비밀번호 변경 */
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwMsg, setPwMsg] = useState({ text: "", ok: null });

  /* 자기소개 */
  const [newBio, setNewBio] = useState("");

  /* 이미지 */
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileRef = useRef(null);

  /* 관심 태그 */
  const [allTags,         setAllTags]         = useState([]);
  const [selectedTagIds,  setSelectedTagIds]  = useState([]);
  const [tagSaving,       setTagSaving]       = useState(false);

  /* ── 프로필 불러오기 ── */
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const [data, tagList, myTagIds] = await Promise.all([
          getMyProfile(),
          getTagList(),
          getMyInterestTags().catch(() => []),
        ]);
        setNickname(data.nickname || "");
        setNewNickname(data.nickname || "");
        setBio(data.bio || "");
        setNewBio(data.bio || "");
        setProfileImage(data.profileImageUrl || null);
        setAllTags(tagList || []);
        // API가 tagId 배열을 반환하거나 객체 배열일 경우 모두 처리
        const ids = Array.isArray(myTagIds)
          ? myTagIds.map((t) => (typeof t === "object" ? t.tagId : t))
          : [];
        setSelectedTagIds(ids);
      } catch {
        const nick = (typeof window !== "undefined" ? localStorage.getItem("nickname") : "") || "";
        setNickname(nick);
        setNewNickname(nick);
        // 태그 목록은 별도로 재시도
        try {
          const tagList = await getTagList();
          setAllTags(tagList || []);
        } catch { /* 무시 */ }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ── 닉네임 중복 확인 ── */
  const checkNickname = async () => {
    if (!newNickname.trim()) {
      setNickMsg({ text: "닉네임을 입력해 주세요.", ok: false });
      return;
    }
    if (newNickname.trim() === nickname) {
      setNickMsg({ text: "현재 닉네임과 동일합니다.", ok: true });
      return;
    }
    try {
      const isDuplicate = await checkNicknameDuplicate(newNickname.trim());
      if (isDuplicate) {
        setNickMsg({ text: "이미 사용 중인 닉네임입니다.", ok: false });
      } else {
        setNickMsg({ text: "사용 가능한 닉네임입니다.", ok: true });
      }
    } catch {
      setNickMsg({ text: "확인 중 오류가 발생했습니다.", ok: false });
    }
  };

  /* ── 닉네임 저장 ── */
  const NICKNAME_PATTERN = /^[가-힣a-zA-Z0-9]{2,20}$/;
  const saveNickname = async () => {
    if (!newNickname.trim()) {
      alert("닉네임을 입력해 주세요.");
      return;
    }
    if (!NICKNAME_PATTERN.test(newNickname.trim())) {
      setNickMsg({ text: "닉네임은 2~20자의 한글, 영문, 숫자만 사용할 수 있습니다.", ok: false });
      return;
    }
    setSaving(true);
    try {
      await updateNickname(newNickname.trim());
      localStorage.setItem("nickname", newNickname.trim());
      window.dispatchEvent(new Event("authChanged"));
      setNickname(newNickname.trim());
      setNickMsg({ text: "", ok: null });
      alert("닉네임이 변경되었습니다!");
    } catch {
      alert("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  /* ── 비밀번호 변경 ── */
  const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-{}\[\]:;"'<>,.?/]).{8,20}$/;
  const savePassword = async () => {
    if (!curPw || !newPw || !confirmPw) {
      setPwMsg({ text: "모든 필드를 입력해 주세요.", ok: false });
      return;
    }
    if (!PASSWORD_PATTERN.test(newPw)) {
      setPwMsg({ text: "비밀번호는 8~20자이며 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.", ok: false });
      return;
    }
    if (newPw !== confirmPw) {
      setPwMsg({ text: "새 비밀번호가 일치하지 않습니다.", ok: false });
      return;
    }
    setSaving(true);
    try {
      await updatePassword(curPw, newPw);
      setCurPw("");
      setNewPw("");
      setConfirmPw("");
      setPwMsg({ text: "비밀번호가 변경되었습니다.", ok: true });
    } catch (e) {
      const is400 = e.response?.status === 400;
      setPwMsg({
        text: is400 ? "현재 비밀번호가 올바르지 않습니다." : "변경에 실패했습니다.",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  /* ── 자기소개 저장 ── */
  const saveBio = async () => {
    setSaving(true);
    try {
      await updateBio(newBio.trim());
      setBio(newBio.trim());
      alert("자기소개가 저장되었습니다!");
    } catch {
      alert("저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  /* ── 관심 태그 토글 ── */
  const toggleTag = (tagId) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  /* ── 관심 태그 저장 ── */
  const saveTags = async () => {
    setTagSaving(true);
    try {
      await updateInterestTags(selectedTagIds);
      alert("관심 태그가 저장되었습니다!");
    } catch {
      alert("저장에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setTagSaving(false);
    }
  };

  /* ── 이미지 선택 ── */
  const onImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type)) {
      alert("JPG·PNG·GIF·WEBP만 가능합니다.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("5MB 이하만 가능합니다.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  /* ── 이미지 업로드 ── */
  const saveImage = async () => {
    if (!imageFile) {
      alert("이미지를 선택해 주세요.");
      return;
    }
    setSaving(true);
    try {
      const data = await updateProfileImage(imageFile);
      const url = data?.profileImageUrl || imagePreview;
      setProfileImage(url);
      localStorage.setItem("profileImageUrl", url);
      window.dispatchEvent(new Event("authChanged"));
      setImageFile(null);
      setImagePreview(null);
      alert("프로필 사진이 변경되었습니다!");
    } catch {
      alert("업로드에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const displayImage = imagePreview || profileImage;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#222", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-sliders2" style={{ color: "#555" }} />
          설정
        </h2>
        <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>개인 정보를 관리해요</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* ── 프로필 사진 ── */}
        <div style={card}>
          <SectionTitle><i className="bi bi-person-circle" style={{ marginRight: 6 }} />프로필 사진</SectionTitle>
          <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 16 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {displayImage ? (
                <div
                  role="img"
                  aria-label="프로필"
                  style={{
                    width: 88,
                    height: 88,
                    borderRadius: "50%",
                    backgroundImage: `url(${displayImage})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    border: `3px solid ${GREEN}`,
                  }}
                />
              ) : (
                <div style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #c8e6c9, #a5d6a7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800, color: "white", border: `3px solid ${GREEN}` }}>
                  {nickname ? nickname.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                style={{ position: "absolute", bottom: 0, right: 0, width: 26, height: 26, borderRadius: "50%", background: GREEN_DARK, border: "2px solid white", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "white" }}
              >✎</button>
            </div>

            <div style={{ flex: 1 }}>
              {imageFile ? (
                <div>
                  <p style={{ fontSize: 12, color: "#555", marginBottom: 10 }}>
                    선택된 파일: <strong>{imageFile.name}</strong>
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={saveImage} disabled={saving} style={greenBtn}>
                      {saving ? "업로드 중…" : "저장"}
                    </button>
                    <button
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      style={outlineBtn}
                    >취소</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>JPG·PNG·GIF·WEBP / 최대 5MB</p>
                  <button onClick={() => fileRef.current?.click()} style={greenBtn}>사진 변경</button>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                style={{ display: "none" }}
                onChange={onImageChange}
              />
            </div>
          </div>
        </div>

        {/* ── 닉네임 수정 ── */}
        <div style={card}>
          <SectionTitle><i className="bi bi-person-badge-fill" style={{ marginRight: 6 }} />닉네임 수정</SectionTitle>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Label>현재 닉네임</Label>
              <div style={{ padding: "9px 12px", background: "#f5f5f5", borderRadius: 8, fontSize: 14, color: "#444" }}>
                {loading ? "…" : nickname}
              </div>
            </div>
            <div>
              <Label>새 닉네임</Label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={newNickname}
                  onChange={(e) => { setNewNickname(e.target.value); setNickMsg({ text: "", ok: null }); }}
                  maxLength={20}
                  placeholder="새 닉네임 입력"
                  style={input}
                />
                <button onClick={checkNickname} style={smallGreenBtn}>중복 확인</button>
              </div>
              {nickMsg.text && (
                <p style={{ fontSize: 12, marginTop: 5, color: nickMsg.ok ? GREEN_DARK : "#e53935" }}>
                  {nickMsg.ok ? "✓ " : "✗ "}{nickMsg.text}
                </p>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={saveNickname} disabled={saving} style={greenBtn}>
                {saving ? "저장 중…" : "닉네임 저장"}
              </button>
            </div>
          </div>
        </div>

        {/* ── 비밀번호 변경 ── */}
        <div style={card}>
          <SectionTitle><i className="bi bi-shield-lock-fill" style={{ marginRight: 6 }} />비밀번호 변경</SectionTitle>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <Label>현재 비밀번호</Label>
              <input
                type="password"
                value={curPw}
                onChange={(e) => { setCurPw(e.target.value); setPwMsg({ text: "", ok: null }); }}
                placeholder="현재 비밀번호 입력"
                style={input}
              />
            </div>
            <div>
              <Label>새 비밀번호</Label>
              <input
                type="password"
                value={newPw}
                onChange={(e) => { setNewPw(e.target.value); setPwMsg({ text: "", ok: null }); }}
                placeholder="새 비밀번호 (8자 이상, 영문+숫자+특수문자)"
                style={input}
              />
            </div>
            <div>
              <Label>새 비밀번호 확인</Label>
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => { setConfirmPw(e.target.value); setPwMsg({ text: "", ok: null }); }}
                placeholder="새 비밀번호 재입력"
                style={input}
              />
            </div>
            {newPw && confirmPw && (
              <p style={{ fontSize: 12, color: newPw === confirmPw ? GREEN_DARK : "#e53935" }}>
                {newPw === confirmPw ? "✓ 비밀번호가 일치합니다." : "✗ 비밀번호가 일치하지 않습니다."}
              </p>
            )}
            {pwMsg.text && (
              <p style={{ fontSize: 12, color: pwMsg.ok ? GREEN_DARK : "#e53935" }}>
                {pwMsg.ok ? "✓ " : "✗ "}{pwMsg.text}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={savePassword} disabled={saving} style={greenBtn}>
                {saving ? "변경 중…" : "비밀번호 변경"}
              </button>
            </div>
          </div>
        </div>

        {/* ── 자기소개 ── */}
        <div style={card}>
          <SectionTitle><i className="bi bi-chat-quote-fill" style={{ marginRight: 6 }} />자기소개</SectionTitle>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                placeholder="나를 소개하는 글을 작성해 보세요 ✨"
                maxLength={1000}
                style={{ ...input, height: 120, resize: "vertical", lineHeight: 1.7 }}
              />
              <div style={{ fontSize: 11, color: "#aaa", textAlign: "right", marginTop: 4 }}>
                {newBio.length} / 1000
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={saveBio} disabled={saving} style={greenBtn}>
                {saving ? "저장 중…" : "자기소개 저장"}
              </button>
            </div>
          </div>
        </div>

        {/* ── 관심 태그 ── */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <SectionTitle><i className="bi bi-hash" style={{ marginRight: 6 }} />관심 태그 수정</SectionTitle>
              <p style={{ fontSize: 12, color: "#888", margin: "4px 0 0" }}>
                관심 있는 태그를 선택해 보세요. 
              </p>
            </div>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20,
              background: "#f0f9f1", color: GREEN, border: `1px solid #c8e6c9`,
            }}>
              {selectedTagIds.length}개 선택
            </span>
          </div>

          <div style={{ marginTop: 16 }}>
            {loading ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} style={{ height: 32, width: 70, borderRadius: 20, background: "#f0f0f0", animation: "pulse 1.5s ease-in-out infinite" }} />
                ))}
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
              </div>
            ) : allTags.length === 0 ? (
              <p style={{ fontSize: 13, color: "#aaa", textAlign: "center", padding: "16px 0" }}>
                선택 가능한 태그가 없습니다.
              </p>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {allTags.map((tag) => {
                  const selected = selectedTagIds.includes(tag.tagId);
                  return (
                    <button
                      key={tag.tagId}
                      type="button"
                      onClick={() => toggleTag(tag.tagId)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 20,
                        border: selected ? `1.5px solid ${GREEN}` : "1.5px solid #ddd",
                        background: selected ? `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})` : "white",
                        color: selected ? "white" : "#555",
                        fontSize: 12,
                        fontWeight: selected ? 700 : 500,
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={saveTags} disabled={tagSaving || loading} style={greenBtn}>
              {tagSaving ? "저장 중…" : "태그 저장"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── 공통 서브 컴포넌트 ── */
function SectionTitle({ children }) {
  return <h3 style={{ fontSize: 15, fontWeight: 700, color: "#222", margin: 0 }}>{children}</h3>;
}
function Label({ children }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#666", marginBottom: 6 }}>
      {children}
    </label>
  );
}

/* ── 공통 스타일 ── */
const card = {
  background: "white",
  borderRadius: 14,
  border: "1.5px solid #e9ecef",
  padding: "20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};
const input = {
  width: "100%",
  border: "1.5px solid #ddd",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: 13,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box",
};
const greenBtn = {
  padding: "7px 20px",
  background: `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})`,
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
};
const smallGreenBtn = {
  flexShrink: 0,
  padding: "9px 14px",
  background: GREEN,
  color: "white",
  border: "none",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
};
const outlineBtn = {
  padding: "7px 16px",
  background: "white",
  color: "#555",
  border: "1.5px solid #ddd",
  borderRadius: 8,
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
};
