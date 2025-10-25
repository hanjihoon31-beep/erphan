import React from "react";
import naruatoLogo from "../assets/naruato-logo.jpg";

const LoginModal = ({ isOpen, onClose, onOpenRegister, onOpenForgot }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[400px] relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-black"
        >
          ✕
        </button>

        <div className="flex flex-col items-center">
          <img src={naruatoLogo} alt="Logo" className="w-24 mb-4" />
          <h2 className="text-2xl font-bold mb-6">로그인</h2>

          <input
            type="text"
            placeholder="아이디"
            className="w-full border rounded-lg p-2 mb-3"
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full border rounded-lg p-2 mb-3"
          />

          <button className="w-full bg-blue-600 text-white p-2 rounded-lg font-semibold hover:bg-blue-700 transition">
            로그인
          </button>

          <div className="flex justify-between text-sm text-gray-600 mt-4 w-full">
            <button onClick={onOpenRegister} className="hover:text-blue-500">
              회원가입
            </button>
            <button onClick={onOpenForgot} className="hover:text-blue-500">
              비밀번호 찾기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
