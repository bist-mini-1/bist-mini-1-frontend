"use client";

import { useState, useEffect } from "react";
import { getMyPosts } from "../../../api/mypageApi";

const GREEN = "#2f8f5b";
const GREEN_DARK = "#26744a";

function calcLevel(postCount) {
  const exp = postCount * 50;
  const level = Math.floor(exp / 200) + 1;
  const currentExp = exp % 200;
  const titles = ["새싹", "성실한 새싹", "열정 학습자", "꾸준한 기록자", "학습 마스터", "전설의 기록자"];
  return { level, currentExp, nextExp: 200, title: titles[Math.min(level - 1, titles.length - 1)] };
}

const BADGES = [
  { id: "start",  icon: "bi-rocket-takeoff-fill", color: "#e64a19", label: "시작해요", desc: "첫 글 작성",        check: (s) => s.postCount >= 1 },
  { id: "s7",     icon: "bi-fire",                color: "#ff6d00", label: "꾸준해요", desc: "7일 연속 기록",     check: (s) => s.streak >= 7 },
  { id: "p10",    icon: "bi-check2-all",           color: "#1565c0", label: "집중력",   desc: "글 10개 이상",      check: (s) => s.postCount >= 10 },
  { id: "writer", icon: "bi-pen-fill",             color: "#6a1b9a", label: "기록왕",   desc: "글 50개 이상",      check: (s) => s.postCount >= 50 },
  { id: "liked",  icon: "bi-hand-thumbs-up-fill",  color: "#f9a825", label: "인기글",   desc: "좋아요 50개 이상",  check: (s) => s.likeCount >= 50 },
];

const ROADMAP = [
  { lv: 1, title: "새싹",          exp: 0,    icon: "bi-flower1",    color: "#a5d6a7" },
  { lv: 2, title: "성실한 새싹",   exp: 200,  icon: "bi-tree",       color: "#66bb6a" },
  { lv: 3, title: "열정 학습자",   exp: 400,  icon: "bi-tree-fill",  color: "#43a047" },
  { lv: 4, title: "꾸준한 기록자", exp: 600,  icon: "bi-tree-fill",  color: "#26744a" },
  { lv: 5, title: "학습 마스터",   exp: 800,  icon: "bi-award-fill", color: "#26744a" },
  { lv: 6, title: "전설의 기록자", exp: 1000, icon: "bi-gem",        color: "#f9a825" },
];

function charIcon(level) {
  if (level >= 5) return { icon: "bi-gem",        color: "#f9a825" };
  if (level >= 3) return { icon: "bi-tree-fill",  color: "#26744a" };
  return               { icon: "bi-flower1",     color: "#66bb6a" };
}

export default function CharacterPage() {
  const [stats, setStats] = useState({ postCount: 0, streak: 0, viewCount: 0, likeCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const list = await getMyPosts();
        setStats({
          postCount: list.length,
          streak: 0,
          viewCount: list.reduce((s, p) => s + (p.viewCount || 0), 0),
          likeCount: list.reduce((s, p) => s + (p.likeCount || 0), 0),
        });
      } catch { /* 기본값 유지 */ }
      finally { setLoading(false); }
    })();
  }, []);

  const { level, currentExp, nextExp, title: lvTitle } = calcLevel(stats.postCount);
  const earnedBadges = BADGES.filter((b) => b.check(stats));
  const { icon: cIcon, color: cColor } = charIcon(level);

  return (
    <div>
      {/* 페이지 제목 */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#222", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-person-badge-fill" style={{ color: GREEN }} />
          캐릭터 성장
        </h2>
        <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>경험치를 모아 캐릭터와 함께 성장해요</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* 캐릭터 + 레벨 카드 */}
        <div style={card}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            {/* 캐릭터 */}
            <div style={{
              width: 100, height: 100, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "3px solid #a5d6a7",
              boxShadow: "0 4px 16px rgba(46,125,50,0.15)",
            }}>
              <i className={`bi ${cIcon}`} style={{ fontSize: 48, color: cColor }} />
            </div>

            {/* 레벨 정보 */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#222" }}>Lv. {level}</span>
                <span style={{ fontSize: 15, color: "#555", fontWeight: 600 }}>{lvTitle}</span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginBottom: 4 }}>
                  <span>EXP {currentExp} / {nextExp}</span>
                  <span>다음 레벨까지 {nextExp - currentExp} 남음</span>
                </div>
                <div style={{ background: "#e8f5e9", borderRadius: 99, height: 10, overflow: "hidden" }}>
                  <div style={{ width: `${(currentExp / nextExp) * 100}%`, height: "100%", background: `${GREEN}`, borderRadius: 99, transition: "width 0.8s ease" }} />
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#888" }}>
                글 1개 작성 시 <strong style={{ color: GREEN_DARK }}>50 EXP</strong> 획득 · 레벨업까지 글 {Math.ceil((nextExp - currentExp) / 50)}개
              </div>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div style={{ ...card, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, padding: 0, overflow: "hidden" }}>
          {[
            { icon: "bi-file-earmark-text-fill", label: "작성한 글", value: loading ? "…" : stats.postCount, color: "#26744a" },
            { icon: "bi-eye-fill",              label: "총 조회수",  value: loading ? "…" : stats.viewCount,  color: "#1565c0" },
            { icon: "bi-suit-heart-fill",       label: "총 좋아요",  value: loading ? "…" : stats.likeCount,  color: "#c62828" },
          ].map(({ icon, label, value, color }, i) => (
            <div key={label} style={{ padding: "20px 16px", textAlign: "center", borderRight: i < 2 ? "1px solid #f0f0f0" : "none" }}>
              <i className={`bi ${icon}`} style={{ fontSize: 22, color, marginBottom: 6, display: "block" }} />
              <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 배지 카드 */}
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#222", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              <i className="bi bi-patch-check-fill" style={{ color: "#f9a825" }} />
              배지 컬렉션
            </h3>
            <span style={{ fontSize: 12, color: GREEN, fontWeight: 600 }}>{earnedBadges.length} / {BADGES.length} 획득</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
            {BADGES.map((badge) => {
              const earned = badge.check(stats);
              return (
                <div key={badge.id} title={badge.desc} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "14px 8px", borderRadius: 12,
                  background: earned ? "#f0faf3" : "#f7f7f7",
                  border: `1.5px solid ${earned ? "#a5d6a7" : "#e0e0e0"}`,
                  opacity: earned ? 1 : 0.4,
                  transition: "all 0.2s",
                }}>
                  <i className={`bi ${badge.icon}`} style={{ fontSize: 28, color: earned ? badge.color : "#bbb" }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: earned ? GREEN_DARK : "#999", textAlign: "center" }}>{badge.label}</span>
                  <span style={{ fontSize: 9, color: "#bbb", textAlign: "center", lineHeight: 1.3 }}>{badge.desc}</span>
                </div>
              );
            })}
          </div>
          {earnedBadges.length === 0 && (
            <p style={{ textAlign: "center", color: "#bbb", fontSize: 12, marginTop: 16 }}>
              첫 글을 작성하면 배지를 획득할 수 있어요!
            </p>
          )}
        </div>

        {/* 레벨 로드맵 */}
        <div style={card}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#222", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 6 }}>
            <i className="bi bi-signpost-2-fill" style={{ color: GREEN }} />
            성장 로드맵
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ROADMAP.map((row) => {
              const reached = level >= row.lv;
              const isCurrent = level === row.lv;
              return (
                <div key={row.lv} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 14px", borderRadius: 10,
                  background: isCurrent ? "#e8f5e9" : reached ? "#f5f5f5" : "transparent",
                  border: isCurrent ? `1.5px solid ${GREEN}` : "1.5px solid transparent",
                }}>
                  <i
                    className={`bi ${row.icon}`}
                    style={{ fontSize: 20, color: reached ? row.color : "#ccc", opacity: reached ? 1 : 0.4 }}
                  />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: isCurrent ? 700 : 500, color: reached ? "#222" : "#bbb" }}>
                      Lv.{row.lv} {row.title}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: "#aaa" }}>EXP {row.exp}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 11, background: GREEN, color: "white", borderRadius: 99, padding: "2px 8px", fontWeight: 600 }}>현재</span>
                  )}
                  {reached && !isCurrent && (
                    <i className="bi bi-check-circle-fill" style={{ fontSize: 16, color: GREEN }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

const card = {
  background: "white",
  borderRadius: 14,
  border: "1.5px solid #e9ecef",
  padding: "20px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
};
