// ✅ src/components/RegisterModal.jsx
import React, { useState } from "react";
import axios from "axios";
import naruatoLogo from "../assets/naruato-logo.jpg";

export default function RegisterModal({ onClose }) {
  const [form, setForm] = useState({
    name: "",
    employeeId: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword)
      return alert("❌ 비밀번호가 일치하지 않습니다.");

    try {
      setLoading(true);

      // ✅ 서버에 회원가입 요청 (status: "대기"로 저장됨)
      const res = await axios.post("http://localhost:3001/api/auth/register", form);

      if (res.data.success) {
        alert("✅ 회원가입 완료! 관리자 승인 후 로그인 가능합니다.\n(승인 시 이메일로 알림이 전송됩니다)");
        onClose();
      } else {
        alert(res.data.message || "회원가입 실패");
      }
    } catch (err) {
      console.error("❌ 회원가입 오류:", err);
      alert("서버 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-40"></div>

      {/* 모달 */}
      <div className="fixed inset-0 flex justify-center items-center z-50">
        <div className="bg-white rounded-2xl shadow-lg p-8 w-80 relative flex flex-col items-center animate-fadeIn">
          {/* 닫기 */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-lg"
          >
            ✕
          </button>

          {/* 로고 */}
          <img src={naruatoLogo} alt="Naruato Logo" className="w-20 h-20 mb-4" />

          <h2 className="text-2xl font-bold mb-4 text-gray-800">회원가입</h2>

          <form onSubmit={handleSubmit} className="w-full space-y-3 text-sm">
            <input
              type="text"
              name="name"
              placeholder="이름"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
            <input
              type="text"
              name="employeeId"
              placeholder="사번"
              value={form.employeeId}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="이메일"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="비밀번호"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="비밀번호 확인"
              value={form.confirmPassword}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md p-2"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-md p-2 text-white font-semibold transition ${
                loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {loading ? "등록 중..." : "회원가입"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full border border-gray-300 rounded-md p-2 hover:bg-gray-100"
            >
              로그인으로 돌아가기
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
