// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import naruatoLogo from "../assets/naruato-logo.jpg";
import "./LoginPage.css";
import RegisterModal from "./RegisterModal";
import FindPasswordModal from "./FindPasswordModal";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ employeeId: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showFindPw, setShowFindPw] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const result = await login(formData.employeeId, formData.password);
      if (result?.success) {
        navigate("/erp");
      } else {
        setMessage(result?.message || "❌ 로그인에 실패했습니다.");
      }
    } catch (error) {
      console.error("로그인 오류:", error);
      setMessage("서버 연결 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 로그인 본문 */}
      <div className="login-wrapper">
        <div className="login-box">
          <img src={naruatoLogo} alt="Naruato Logo" className="logo" />
          <h1>환영합니다</h1>
          <p>NARUATO ERP SYSTEM</p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label>사번</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              placeholder="사번을 입력하세요"
            />

            <label>비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="비밀번호를 입력하세요"
            />

            {message && (
              <p className="error-message" style={{ color: "red", marginTop: 8 }}>
                {message}
              </p>
            )}

            <div className="btn-group">
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "로그인 중..." : "로그인"}
              </button>

              {/* 회원가입 버튼: submit 아님 + 기본동작/버블링 차단 */}
              <button
                type="button"
                className="register-btn"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowRegister(true);
                  document.body.classList.add("modal-open"); // 스크롤 잠금
                }}
              >
                회원가입
              </button>
            </div>
          </form>

          <button
            type="button"
            className="findpw-btn"
            onClick={() => {
              setShowFindPw(true);
              document.body.classList.add("modal-open");
            }}
          >
            비밀번호 찾기
          </button>
        </div>
      </div>

      {/* 모달(Portal) */}
      {showRegister && (
        <RegisterModal
          onClose={() => {
            setShowRegister(false);
            document.body.classList.remove("modal-open");
          }}
        />
      )}
      {showFindPw && (
        <FindPasswordModal
          onClose={() => {
            setShowFindPw(false);
            document.body.classList.remove("modal-open");
          }}
        />
      )}
    </>
  );
};

export default LoginPage;
