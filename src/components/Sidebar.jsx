// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut } from "lucide-react";

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  const menus = [
    { label: "📊 대시보드", path: "/erp/admin/dashboard" },
    { label: "🧾 승인 관리", path: "/erp/admin/approval" },
    { label: "🧑‍💼 권한 관리", path: "/erp/admin/roles" },
    { label: "📜 로그 이력", path: "/erp/admin/logs" },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white flex flex-col justify-between">
      <div>
        <div className="p-5 text-2xl font-bold border-b border-gray-700 text-center">
          ERP 관리자
        </div>
        <ul className="mt-6">
          {menus.map((menu) => (
            <li key={menu.path}>
              <Link
                to={menu.path}
                className={`block px-5 py-3 hover:bg-gray-700 transition ${
                  location.pathname === menu.path ? "bg-gray-700" : ""
                }`}
              >
                {menu.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-700 flex items-center justify-between">
        <span className="text-sm">{user?.name || "알 수 없음"}</span>
        <button
          onClick={logout}
          className="flex items-center gap-1 text-sm bg-gray-700 px-2 py-1 rounded hover:bg-red-600"
        >
          <LogOut size={16} /> 로그아웃
        </button>
      </div>
    </div>
  );
}
