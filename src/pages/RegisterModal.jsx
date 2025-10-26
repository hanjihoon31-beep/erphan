// src/pages/RegisterModal.jsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import naruatoLogo from "../assets/naruato-logo.jpg";

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

  const modal = (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target.classList.contains("modal-overlay")) onClose();
      }}
    >
      <AnimatePresence>
        <motion.div
          className="bg-white rounded-2xl shadow-xl p-8 w-[400px] relative"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
        >
          {/* 닫기 */}
          <button
            onClick={onClose}
            className="absolute top-3 right-4 text-gray-400 hover:text-gray-700 text-2xl font-bold"
            aria-label="close"
          >
            ✕
          </button>

          {/* 헤더 */}
          <div className="flex flex-col items-center mb-6">
            <img src={naruatoLogo} alt="Logo" className="w-16 h-16 mb-3" />
            <h2 className="text-2xl font-bold">회원가입</h2>
            <p className="text-sm text-gray-500">
              가입 후 최고관리자의 승인 시 계정이 활성화됩니다.
            </p>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="text"
              name="employeeId"
              placeholder="사번"
              value={formData.employeeId}
              onChange={handleChange}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />
            <input
              type="text"
              name="name"
              placeholder="이름"
              value={formData.name}
              onChange={handleChange}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="이메일"
              value={formData.email}
              onChange={handleChange}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              value={formData.password}
              onChange={handleChange}
              className="border rounded p-2 focus:ring-2 focus:ring-blue-400 outline-none"
              required
            />

            {message && (
              <p
                className={`text-sm mt-2 text-center ${
                  message.startsWith("✅") ? "text-green-600" : "text-red-500"
                }`}
              >
                {message}
              </p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                disabled={loading}
                className={`flex-1 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "전송 중..." : "가입 요청"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 rounded bg-gray-200 hover:bg-gray-300 transition"
              >
                닫기
              </button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  // body에 Portal로 붙여서 어떤 레이아웃에서도 중앙 고정
  return ReactDOM.createPortal(modal, document.body);
};

export default RegisterModal;
