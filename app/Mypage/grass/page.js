"use client";

import { useState, useEffect } from "react";
import { getMyPosts } from "../../../api/mypageApi";

const GREEN = "#2f8f5b";
const GREEN_DARK = "#26744a";

function buildCalendar(year, month, postDates) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const postSet = new Set(
    postDates.map((d) => {
      const dt = new Date(d);
      return `${dt.getFullYear()}-${dt.getMonth()}-${dt.getDate()}`;
    })
  );
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, hasPost: postSet.has(`${year}-${month}-${d}`) });
  }
  return cells;
}

function calcStreak(postDates) {
  if (!postDates.length) return { current: 0, max: 0 };
  const DAY = 86400000;
  const dates = [...new Set(postDates.map((d) => {
    const dt = new Date(d);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
  }))].sort((a, b) => b - a);
  const today = new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  let current = 0;
  if (dates[0] >= todayTime - DAY) {
    current = 1;
    for (let i = 1; i < dates.length; i++) {
      if (dates[i - 1] - dates[i] === DAY) current++;
      else break;
    }
  }
  let max = 1, streak = 1;
  for (let i = 1; i < dates.length; i++) {
    if (dates[i - 1] - dates[i] === DAY) { streak++; max = Math.max(max, streak); }
    else streak = 1;
  }
  return { current, max: Math.max(max, current) };
}

const MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function motivationIcon(streak) {
  if (streak >= 30) return { icon: "bi-trophy-fill",          color: "#f9a825" };
  if (streak >= 7)  return { icon: "bi-fire",                 color: "#e64a19" };
  if (streak >= 1)  return { icon: "bi-lightning-charge-fill",color: "#1565c0" };
  return                   { icon: "bi-flower1",              color: GREEN };
}

export default function GrassPage() {
  const [postDates, setPostDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [viewYear, setViewYear]   = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    (async () => {
      try {
        const list = await getMyPosts();
        setPostDates(list.map((p) => p.createdAt).filter(Boolean));
      } catch { /* 기본값 유지 */ }
      finally { setLoading(false); }
    })();
  }, []);

  const { current: streak, max: maxStreak } = calcStreak(postDates);
  const calCells = buildCalendar(viewYear, viewMonth, postDates);
  const postsThisMonth = postDates.filter((d) => {
    const dt = new Date(d);
    return dt.getFullYear() === viewYear && dt.getMonth() === viewMonth;
  }).length;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();
    if (isCurrentMonth) return;
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const { icon: motIcon, color: motColor } = motivationIcon(streak);

  const SUMMARY = [
    { icon: "bi-fire",               iconColor: streak > 0 ? "#e64a19" : "#888", label: "현재 연속 기록", value: loading ? "…" : `${streak}일`,        color: streak > 0 ? "#e65100" : "#888" },
    { icon: "bi-trophy-fill",        iconColor: "#f9a825",                        label: "최고 기록",      value: loading ? "…" : `${maxStreak}일`,      color: "#f9a825" },
    { icon: "bi-calendar2-check-fill", iconColor: GREEN_DARK,                     label: "이번 달 기록",   value: loading ? "…" : `${postsThisMonth}일`, color: GREEN_DARK },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: "#222", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
          <i className="bi bi-calendar2-check-fill" style={{ color: GREEN }} />
          잔디
        </h2>
        <p style={{ fontSize: 13, color: "#888", margin: "6px 0 0" }}>매일의 공부가 모여 잔디밭이 완성돼요</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

        {/* 연속 기록 요약 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {SUMMARY.map(({ icon, iconColor, label, value, color }) => (
            <div key={label} style={{ background: "white", borderRadius: 14, border: "1.5px solid #e9ecef", padding: "18px 16px", textAlign: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
              <i className={`bi ${icon}`} style={{ fontSize: 26, color: iconColor, display: "block", marginBottom: 8 }} />
              <div style={{ fontSize: 24, fontWeight: 800, color, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 11, color: "#888" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* 달력 카드 */}
        <div style={{ background: "white", borderRadius: 14, border: "1.5px solid #e9ecef", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
          {/* 달력 헤더 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <button onClick={prevMonth} style={{ border: "1px solid #e0e0e0", background: "white", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#555" }}>‹</button>
            <span style={{ fontWeight: 700, fontSize: 16, color: "#222" }}>
              {viewYear}년 {MONTHS[viewMonth]}
            </span>
            <button
              onClick={nextMonth}
              disabled={viewYear === now.getFullYear() && viewMonth === now.getMonth()}
              style={{ border: "1px solid #e0e0e0", background: "white", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: 14, color: "#555", opacity: (viewYear === now.getFullYear() && viewMonth === now.getMonth()) ? 0.3 : 1 }}
            >›</button>
          </div>

          {/* 요일 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 8 }}>
            {["일","월","화","수","목","금","토"].map((d, i) => (
              <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: i === 0 ? "#e53935" : i === 6 ? "#1565c0" : "#bbb", padding: "4px 0" }}>{d}</div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 4 }}>
            {calCells.map((cell, i) => {
              const isToday = cell?.day === now.getDate() && viewYear === now.getFullYear() && viewMonth === now.getMonth();
              return (
                <div key={i} style={{
                  aspectRatio: "1",
                  borderRadius: 8,
                  background: cell === null ? "transparent" : cell.hasPost ? GREEN : "#f0f0f0",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11,
                  color: cell?.hasPost ? "white" : isToday ? GREEN_DARK : "#888",
                  fontWeight: isToday ? 700 : 400,
                  outline: isToday ? `2px solid ${GREEN_DARK}` : "none",
                  outlineOffset: 1,
                }}>
                  {cell?.day}
                </div>
              );
            })}
          </div>

          {/* 범례 */}
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 16, justifyContent: "flex-end" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: "#f0f0f0" }} />
              <span style={{ fontSize: 11, color: "#aaa" }}>기록 없음</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: GREEN }} />
              <span style={{ fontSize: 11, color: "#aaa" }}>기록 있음</span>
            </div>
          </div>
        </div>

        {/* 동기부여 메시지 */}
        <div style={{ background: "linear-gradient(135deg, #e8f5e9, #f1f8e9)", borderRadius: 14, border: "1.5px solid #c8e6c9", padding: "18px 24px", textAlign: "center" }}>
          <i className={`bi ${motIcon}`} style={{ fontSize: 28, color: motColor, display: "block", marginBottom: 8 }} />
          <div style={{ fontWeight: 700, color: GREEN_DARK, marginBottom: 4, fontSize: 14 }}>
            {streak >= 30 ? `${streak}일 연속! 정말 대단해요!` :
             streak >= 7  ? `${streak}일 연속! 꾸준함이 빛나고 있어요!` :
             streak >= 1  ? `${streak}일 연속! 좋은 출발이에요!` :
             "오늘 첫 기록을 남겨 연속 기록을 시작해요!"}
          </div>
          <div style={{ fontSize: 12, color: "#888" }}>꾸준함이 실력을 만듭니다</div>
        </div>
      </div>
    </div>
  );
}
