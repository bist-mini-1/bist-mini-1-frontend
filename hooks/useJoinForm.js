"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  checkLoginId,
  checkEmail,
  checkNickname,
  join,
} from "../api/memberApi";
import {
  validateLoginId,
  validatePassword,
  validateEmail,
  validateNickname,
  validateBio,
} from "../utils/validationUtils";

export default function useJoinForm() {
  const router = useRouter();

  const [joinForm, setJoinForm] = useState({
    loginId: "",
    password: "",
    email: "",
    nickname: "",
    bio: "",
  });

  const [duplicateChecked, setDuplicateChecked] = useState({
    loginId: false,
    email: false,
    nickname: false,
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setJoinForm((prevJoinForm) => ({
      ...prevJoinForm,
      [name]: value,
    }));

    if (name === "loginId" || name === "email" || name === "nickname") {
      setDuplicateChecked((prev) => ({
        ...prev,
        [name]: false,
      }));
    }

    setErrorMessage("");
    setSuccessMessage("");
  };

  const handleCheckLoginId = async () => {
    const loginIdMessage = validateLoginId(joinForm.loginId);

    if (loginIdMessage) {
      setErrorMessage(loginIdMessage);
      setSuccessMessage("");
      return;
    }

    try {
      const isDuplicate = await checkLoginId(joinForm.loginId);

      if (isDuplicate) {
        setDuplicateChecked((prev) => ({
          ...prev,
          loginId: false,
        }));

        setErrorMessage("이미 사용 중인 아이디입니다.");
        setSuccessMessage("");
      } else {
        setDuplicateChecked((prev) => ({
          ...prev,
          loginId: true,
        }));

        setErrorMessage("");
        setSuccessMessage("사용 가능한 아이디입니다.");
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("아이디 중복확인 중 오류가 발생했습니다.");
      setSuccessMessage("");
    }
  };

  const handleCheckEmail = async () => {
    const emailMessage = validateEmail(joinForm.email);

    if (emailMessage) {
      setErrorMessage(emailMessage);
      setSuccessMessage("");
      return;
    }

    try {
      const isDuplicate = await checkEmail(joinForm.email);

      if (isDuplicate) {
        setDuplicateChecked((prev) => ({
          ...prev,
          email: false,
        }));

        setErrorMessage("이미 가입된 이메일입니다.");
        setSuccessMessage("");
      } else {
        setDuplicateChecked((prev) => ({
          ...prev,
          email: true,
        }));

        setErrorMessage("");
        setSuccessMessage("사용 가능한 이메일입니다.");
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("이메일 중복확인 중 오류가 발생했습니다.");
      setSuccessMessage("");
    }
  };

  const handleCheckNickname = async () => {
    const nicknameMessage = validateNickname(joinForm.nickname);

    if (nicknameMessage) {
      setErrorMessage(nicknameMessage);
      setSuccessMessage("");
      return;
    }

    try {
      const isDuplicate = await checkNickname(joinForm.nickname);

      if (isDuplicate) {
        setDuplicateChecked((prev) => ({
          ...prev,
          nickname: false,
        }));

        setErrorMessage("이미 사용 중인 닉네임입니다.");
        setSuccessMessage("");
      } else {
        setDuplicateChecked((prev) => ({
          ...prev,
          nickname: true,
        }));

        setErrorMessage("");
        setSuccessMessage("사용 가능한 닉네임입니다.");
      }
    } catch (error) {
      console.log(error);
      setErrorMessage("닉네임 중복확인 중 오류가 발생했습니다.");
      setSuccessMessage("");
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();

    const loginIdMessage = validateLoginId(joinForm.loginId);
    if (loginIdMessage) {
      setErrorMessage(loginIdMessage);
      setSuccessMessage("");
      return;
    }

    const passwordMessage = validatePassword(joinForm.password);
    if (passwordMessage) {
      setErrorMessage(passwordMessage);
      setSuccessMessage("");
      return;
    }

    const emailMessage = validateEmail(joinForm.email);
    if (emailMessage) {
      setErrorMessage(emailMessage);
      setSuccessMessage("");
      return;
    }

    const nicknameMessage = validateNickname(joinForm.nickname);
    if (nicknameMessage) {
      setErrorMessage(nicknameMessage);
      setSuccessMessage("");
      return;
    }

    const bioMessage = validateBio(joinForm.bio);
    if (bioMessage) {
      setErrorMessage(bioMessage);
      setSuccessMessage("");
      return;
    }

    if (!duplicateChecked.loginId) {
      setErrorMessage("아이디 중복확인을 해주세요.");
      setSuccessMessage("");
      return;
    }

    if (!duplicateChecked.email) {
      setErrorMessage("이메일 중복확인을 해주세요.");
      setSuccessMessage("");
      return;
    }

    if (!duplicateChecked.nickname) {
      setErrorMessage("닉네임 중복확인을 해주세요.");
      setSuccessMessage("");
      return;
    }

    try {
      await join(joinForm);

      alert("회원가입이 완료되었습니다.");
      router.push("/login");
    } catch (error) {
      console.log(error);

      const message =
        error.response?.data?.message || "회원가입 중 오류가 발생했습니다.";

      setSuccessMessage("");
      setErrorMessage(message);
    }
  };

  return {
    joinForm,
    errorMessage,
    successMessage,
    duplicateChecked,
    handleChange,
    handleCheckLoginId,
    handleCheckEmail,
    handleCheckNickname,
    handleJoin,
  };
}