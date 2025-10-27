// src/components/Sidebar.jsx
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CheckSquare,
  ShieldCheck,
  ScrollText,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    label: "대시보드",
    description: "실시간 지표와 인사이트",
    path: "/erp/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "승인 관리",
    description: "회원 · 재고 승인 처리",
    path: "/erp/admin/approval",
    icon: CheckSquare,
  },
  {
    label: "권한 관리",
    description: "팀 역할과 액세스 제어",
    path: "/erp/admin/roles",
    icon: ShieldCheck,
  },
  {
    label: "로그 이력",
    description: "승인 및 변경 추적",
    path: "/erp/admin/logs",
    icon: ScrollText,
  },
];

export default function Sidebar() {
  const { logout, user } = useAuth();
  const location = useLocation();

  

  return (
    <aside className="relative flex h-full min-h-screen w-72 flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 shadow-2xl">
      <div className="pointer-events-none absolute inset-0 opacity-60">
        <div className="absolute -left-24 top-12 h-48 w-48 rounded-full bg-indigo-600/40 blur-3xl" />
        <div className="absolute -right-16 top-1/3 h-40 w-40 rounded-full bg-blue-500/30 blur-3xl" />
      </div>

      <div className="relative z-10 flex-1 px-6 py-8">
        <div className="mb-10 space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Admin Suite</p>
          <h1 className="text-2xl font-bold leading-tight text-white">Naruato ERP</h1>
          <p className="text-sm text-slate-400">
            {user?.name ? `${user.name}님, 환영합니다.` : "관리자 모드"}
          </p>
        </div>
        <nav className="space-y-3">
          {menuItems.map(({ label, description, path, icon: Icon }) => {
            const isActive = location.pathname.startsWith(path);
            return (      
              <Link
                key={path}
                to={path}
                className={`group relative block overflow-hidden rounded-2xl border border-white/5 bg-white/5 p-4 transition-all duration-200 hover:border-indigo-400/40 hover:bg-white/10 ${
                  isActive ? "border-indigo-400/50 bg-white/10" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-300 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "bg-indigo-500/20 text-indigo-200" : ""
                    }`}
                  >
                    <Icon size={22} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">{label}</p>
                    <p className="text-xs text-slate-400">{description}</p>
                  </div>
                </div>
                {isActive && (
                  <span className="absolute inset-x-4 bottom-4 h-px bg-gradient-to-r from-transparent via-indigo-400/70 to-transparent" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="relative z-10 border-t border-white/5 bg-white/5 px-6 py-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">현재 사용자</p>
            <p className="text-sm font-semibold text-white">{user?.name || "알 수 없음"}</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] hover:shadow-indigo-500/40"
          >
            <LogOut size={16} strokeWidth={1.75} /> 로그아웃
          </button>
        </div>
      </div>
    </aside>
  );
}
