// src/pages/Erphan.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Erphan.css";

export default function Erphan() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAdmin = user?.role === "superadmin" || user?.role === "admin";

  // 메뉴 아이템 정의
  const menuItems = [
    {
      icon: "💰",
      title: "시재금 관리",
      description: "일일 시재금 및 상품권 관리",
      path: "/erp/admin/daily-cash",
      color: "blue",
      adminOnly: true
    },
    {
      icon: "📝",
      title: "일일 재고",
      description: "매장별 일일 재고 입력 및 관리",
      path: "/erp/admin/daily-inventory",
      color: "green",
      adminOnly: false
    },
    {
      icon: "⏰",
      title: "출퇴근 관리",
      description: "출퇴근 체크 및 근태 관리",
      path: "/erp/admin/attendance-check",
      color: "purple",
      adminOnly: false
    },
    {
      icon: "💸",
      title: "급여 관리",
      description: "직원 급여 조회 및 관리",
      path: "/erp/admin/payroll",
      color: "yellow",
      adminOnly: true
    },
    {
      icon: "🔧",
      title: "장비 관리",
      description: "장비 및 비품 관리",
      path: "/erp/admin/equipment",
      color: "red",
      adminOnly: false
    },
    {
      icon: "🗑️",
      title: "폐기 관리",
      description: "제품 폐기 등록 및 승인",
      path: "/erp/admin/disposal",
      color: "gray",
      adminOnly: false
    },
    {
      icon: "🎫",
      title: "권면 관리",
      description: "상품권 및 권면 종류 관리",
      path: "/erp/admin/vouchers",
      color: "pink",
      adminOnly: true
    },
    {
      icon: "✅",
      title: "승인 관리",
      description: "회원가입 및 각종 요청 승인",
      path: "/erp/admin/approval",
      color: "indigo",
      adminOnly: true
    }
  ];

  const getColorClass = (color) => {
    const colors = {
      blue: "from-blue-400 to-blue-600",
      green: "from-green-400 to-green-600",
      purple: "from-purple-400 to-purple-600",
      yellow: "from-yellow-400 to-yellow-600",
      red: "from-red-400 to-red-600",
      gray: "from-gray-400 to-gray-600",
      pink: "from-pink-400 to-pink-600",
      indigo: "from-indigo-400 to-indigo-600"
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">NARUATO ERP</h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.name}님 환영합니다 (사번: {user?.employeeId})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition"
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">대시보드</h2>
          <p className="text-gray-600">원하시는 메뉴를 선택하세요</p>
        </div>

        {/* 메뉴 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems
            .filter(item => !item.adminOnly || isAdmin)
            .map((item, index) => (
              <div
                key={index}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 overflow-hidden"
              >
                <div className={`h-2 bg-gradient-to-r ${getColorClass(item.color)}`}></div>
                <div className="p-6">
                  <div className="text-4xl mb-3">{item.icon}</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
        </div>

        {/* 하단 정보 카드 */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">로그인 정보</p>
                <p className="text-2xl font-bold text-gray-800">{user?.name}</p>
                <p className="text-sm text-gray-500">사번: {user?.employeeId}</p>
              </div>
              <div className="text-4xl">👤</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">권한</p>
                <p className="text-2xl font-bold text-gray-800">
                  {user?.role === "superadmin" ? "최고관리자" :
                   user?.role === "admin" ? "관리자" : "근무자"}
                </p>
              </div>
              <div className="text-4xl">
                {user?.role === "superadmin" || user?.role === "admin" ? "👑" : "⭐"}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">시스템 상태</p>
                <p className="text-2xl font-bold text-green-600">정상</p>
                <p className="text-sm text-gray-500">모든 서비스 작동 중</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
