export const validateLoginId = (loginId) => {
  const regex = /^[a-z0-9]{4,20}$/;

  if (!loginId.trim()) {
    return "아이디를 입력해주세요.";
  }

  if (!regex.test(loginId)) {
    return "아이디는 4~20자의 영문 소문자와 숫자만 사용할 수 있습니다.";
  }

  return "";
};

export const validatePassword = (password) => {
  const regex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-{}\[\]:;"'<>,.?/]).{8,20}$/;

  if (!password.trim()) {
    return "비밀번호를 입력해주세요.";
  }

  if (!regex.test(password)) {
    return "비밀번호는 8~20자이며 영문, 숫자, 특수문자를 각각 1개 이상 포함해야 합니다.";
  }

  return "";
};

export const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email.trim()) {
    return "이메일을 입력해주세요.";
  }

  if (!regex.test(email)) {
    return "이메일 형식이 올바르지 않습니다.";
  }

  return "";
};

export const validateNickname = (nickname) => {
  const regex = /^[가-힣a-zA-Z0-9]{2,20}$/;

  if (!nickname.trim()) {
    return "닉네임을 입력해주세요.";
  }

  if (!regex.test(nickname)) {
    return "닉네임은 2~20자의 한글, 영문, 숫자만 사용할 수 있습니다.";
  }

  return "";
};

export const validateBio = (bio) => {
  if (bio && bio.length > 1000) {
    return "자기소개는 1000자 이하로 입력해주세요.";
  }

  return "";
};