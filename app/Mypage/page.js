"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MyPageIndex() {
  const router = useRouter();
  useEffect(() => { router.replace("/Mypage/character"); }, []);
  return null;
}
