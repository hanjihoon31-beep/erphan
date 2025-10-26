// src/pages/RegisterModal.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import naruatoLogo from "../assets/naruato-logo.jpg";
import "./RegisterModal.css";

const RegisterModal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // ESC 키로 닫기
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 역할은 항상 employee (근무자)
      const payload = { ...formData, role: "employee" };
      const res = await axios.post("http://localhost:3001/api/auth/register", payload);

      if (res.data?.success) {
        setMessage("✅ 가입 요청이 완료되었습니다. 최고관리자 승인 후 사용 가능합니다.");
        // 3초 후 모달 닫기
        setTimeout(() => onClose(), 3000);
      } else {
        setMessage(res.data?.message || "❌ 가입에 실패했습니다.");
      }
    } catch (err) {
      console.error("회원가입 오류:", err);
      const errorMsg = err.response?.data?.message || "서버 연결 오류가 발생했습니다.";
      setMessage(`❌ ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => {
      if (e.target.classList.contains("modal-overlay")) onClose();
    }}>
      <div className="modal-container">
        <button className="close-btn" onClick={onClose}>✕</button>

        <img src={naruatoLogo} alt="Naruato Logo" className="logo" />
        <h2>회원가입</h2>
        <p>가입 후 최고관리자의 승인 시 계정이 활성화됩니다.</p>

        <form onSubmit={handleSubmit} className="register-form">
          <label>사번</label>
          <input
            type="text"
            name="employeeId"
            placeholder="사번을 입력하세요"
            value={formData.employeeId}
            onChange={handleChange}
            required
          />

          <label>이름</label>
          <input
            type="text"
            name="name"
            placeholder="이름을 입력하세요"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <label>이메일</label>
          <input
            type="email"
            name="email"
            placeholder="이메일을 입력하세요"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <label>비밀번호</label>
          <input
            type="password"
            name="password"
            placeholder="비밀번호를 입력하세요"
            value={formData.password}
            onChange={handleChange}
            required
          />

          {message && (
            <p className={message.startsWith("✅") ? "register-success-msg" : "register-error-msg"}>
              {message}
            </p>
          )}

          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? "전송 중..." : "가입 요청"}
          </button>

          <button type="button" className="back-btn" onClick={onClose}>
            로그인으로 돌아가기
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterModal;
