"use client";

import { useEffect, useRef } from "react";

export default function ToastViewer({ content }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!containerRef.current) return;

      // 동적으로 뷰어 모듈 불러오기
      const mod = await import("@toast-ui/editor");
      const Viewer = mod?.default || mod?.Viewer || mod;

      // 기존 인스턴스 정리
      if (viewerRef.current) {
        try {
          viewerRef.current.remove();
        } catch (e) {
          // ignore
        }
        viewerRef.current = null;
      }

      if (!mounted) return;

      try {
        // Viewer 인스턴스 생성
        const instance = new Viewer({
          el: containerRef.current,
          initialValue: content || "",
          viewer: true,
          usageStatistics: false,
        });

        viewerRef.current = instance;
      } catch (err) {
        console.error("ToastViewer init failed:", err);
      }
    };

    init();

    return () => {
      mounted = false;
      if (viewerRef.current) {
        try {
          viewerRef.current.remove();
        } catch (e) {
          // ignore
        }
        viewerRef.current = null;
      }
    };
  }, [content]);

  return <div ref={containerRef} />;
}
