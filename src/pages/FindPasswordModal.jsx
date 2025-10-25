import React, { useState } from "react";
import naruatoLogo from "../assets/naruato-logo.jpg";
import "./FindPasswordModal.css";

const FindPasswordModal = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [serverCode, setServerCode] = useState("");
  const [formData, setFormData] = useState({
    sabun: "",
    email: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  // 입력 변경 처리
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 인증번호 전송
  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!formData.sabun || !formData.email) {
      alert("사번과 이메일을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sabun: formData.sabun,
          email: formData.email,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        alert("이메일로 인증번호가 전송되었습니다!");
        setServerCode(data.code?.toString() || "");
        setStep(2);
      } else {
        alert(data.error || "메일 전송 실패");
      }
    } catch (err) {
      alert("서버 오류가 발생했습니다.");
      console.error(err);
    }
  };

  // 인증번호 확인
  const handleVerifyCode = (e) => {
    e.preventDefault();
    if (formData.code.trim() === serverCode) {
      alert("인증 성공! 새 비밀번호를 설정하세요.");
      setStep(3);
    } else {
      alert("인증번호가 일치하지 않습니다.");
    }
  };

  // 비밀번호 재설정
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      alert("비밀번호가 일치하지 않습니다!");
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sabun: formData.sabun,
          newPassword: formData.newPassword,
        }),
      });

      if (res.ok) {
        alert("비밀번호가 성공적으로 변경되었습니다!");
        onClose();
      } else {
        const data = await res.json();
        alert(data.error || "비밀번호 변경 실패");
      }
    } catch (err) {
      alert("서버 오류가 발생했습니다.");
      console.error(err);
    }
  };

  return (
    <div className="findpw-modal-overlay">
      <div className="findpw-modal">
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        <img src={naruatoLogo} alt="Naruato Logo" className="logo" />
        <h2>비밀번호 찾기</h2>

        {/* STEP 1️⃣ 인증번호 전송 */}
        {step === 1 && (
          <form onSubmit={handleSendCode} className="form-group">
            <label>사번</label>
            <input
              name="sabun"
              placeholder="사번을 입력하세요"
              value={formData.sabun}
              onChange={handleChange}
            />

            <label>이메일</label>
            <div className="email-row">
              <input
                name="email"
                type="email"
                placeholder="이메일을 입력하세요"
                value={formData.email}
                onChange={handleChange}
              />
              <button type="submit" className="send-btn">
                인증번호 보내기
              </button>
            </div>
          </form>
        )}

        {/* STEP 2️⃣ 인증번호 확인 */}
        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="form-group">
            <label>인증번호</label>
            <input
              name="code"
              placeholder="이메일로 받은 인증번호를 입력하세요"
              value={formData.code}
              onChange={handleChange}
            />
            <button type="submit" className="submit-btn">
              인증하기
            </button>
          </form>
        )}

        {/* STEP 3️⃣ 비밀번호 변경 */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="form-group">
            <label>새 비밀번호</label>
            <input
              name="newPassword"
              type="password"
              placeholder="새 비밀번호 입력"
              value={formData.newPassword}
              onChange={handleChange}
            />

            <label>비밀번호 확인</label>
            <input
              name="confirmPassword"
              type="password"
              placeholder="비밀번호 확인"
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            <button type="submit" className="submit-btn">
              비밀번호 변경
            </button>
          </form>
        )}

        <button className="back-btn" onClick={onClose}>
          로그인으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default FindPasswordModal;
