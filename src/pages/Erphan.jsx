// src/pages/Erphan.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../config/api";
import "./Erphan.css";

export default function Erphan() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const isAdmin = user?.role === "superadmin" || user?.role === "admin";

  // ✅ 승인 대기 수 불러오기 (회원 + 재고 합산)
  const fetchPendingCount = async () => {
    setLoading(true);
    try {
      const [usersRes, inventoryRes] = await Promise.all([
        apiClient.get("/api/admin/pending"),
        apiClient.get("/api/inventory"),
      ]);

      const userCount = usersRes.data?.length || 0;
      const inventoryCount = (inventoryRes.data?.inventory || []).filter(
        (item) => item.status === "대기"
      ).length;

      setPendingCount(userCount + inventoryCount);
    } catch (error) {
      console.error("승인 대기 수 불러오기 오류:", error);
      setPendingCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);

      // ✅ 승인 처리 시 즉시 새로고침
      const handleApprovalUpdate = () => fetchPendingCount();
      window.addEventListener("approval-updated", handleApprovalUpdate);

      return () => {
        clearInterval(interval);
        window.removeEventListener("approval-updated", handleApprovalUpdate);
      };
    }
  }, [isAdmin]);

  const handleApprovalClick = async () => {
    await fetchPendingCount();
    navigate("/erp/admin/approval");
  };

  return (
    <div className="erphan-container flex min-h-screen bg-gray-50 text-gray-800">
      <aside className="relative w-64 bg-white shadow-md border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-600">NARUATO ERP</h2>
          <p className="text-sm text-gray-500 mt-1">
            {user?.name || "사용자"}님 환영합니다!
          </p>
          <p className="text-xs text-gray-400">
            사번: {user?.employeeId || "미확인"}
          </p>
        </div>

        <nav className="flex-1 p-6 space-y-4">
          <button onClick={() => navigate("/erp")} className="block text-left font-medium text-gray-700 hover:text-blue-600 transition w-full">
            📊 통계
          </button>

          <button onClick={() => navigate("/erp/warehouse")} className="block text-left font-medium text-gray-700 hover:text-blue-600 transition w-full">
            🏭 창고 관리
          </button>

          <button onClick={() => navigate("/erp/inventory")} className="block text-left font-medium text-gray-700 hover:text-blue-600 transition w-full">
            📦 재고 관리
          </button>

          <button onClick={() => navigate("/erp/feedback")} className="block text-left font-medium text-gray-700 hover:text-blue-600 transition w-full">
            💬 피드백
          </button>

          <button onClick={() => navigate("/erp/settings")} className="block text-left font-medium text-gray-700 hover:text-blue-600 transition w-full">
            ⚙️ 설정
          </button>

          {isAdmin && (
            <>
              <button onClick={() => navigate("/erp/warehouse/admin")} className="block text-left font-semibold text-red-600 hover:text-red-700 transition w-full">
                🧰 관리자 창고관리
              </button>

              <button
                onClick={handleApprovalClick}
                className="block text-left font-semibold text-blue-600 hover:text-blue-700 transition w-full flex items-center justify-between"
              >
                ✅ 승인 관리
                {loading ? (
                  <span className="ml-2 text-xs text-gray-400 animate-pulse">...</span>
                ) : pendingCount > 0 ? (
                  <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {pendingCount}
                  </span>
                ) : null}
              </button>
            </>
          )}
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-6">
          <button onClick={handleLogout} className="logout-btn w-full">
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 p-8">
        <header className="erphan-header">
          <h1 className="text-3xl font-semibold text-gray-800">
            📊 ERP SYSTEM DASHBOARD
          </h1>
          <div className="user-info">
            <span>
              로그인 사용자:{" "}
              <strong className="text-blue-600">
                {user?.name || "관리자"}
              </strong>{" "}
              ({user?.employeeId})
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">💰 매출 통계</h3>
            <p className="text-gray-600">
              이번 달 총 매출:{" "}
              <span className="font-bold text-blue-600">₩12,500,000</span>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">👥 방문자 통계</h3>
            <p className="text-gray-600">
              일 평균 방문자 수:{" "}
              <span className="font-bold text-blue-600">1,240명</span>
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold mb-2">💬 피드백</h3>
            <p className="text-gray-600">
              이번 달 피드백 수:{" "}
              <span className="font-bold text-blue-600">32건</span>
            </p>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">📦 최근 입출고 현황</h2>
          <div className="bg-white rounded-xl shadow p-6 text-gray-600">
            아직 등록된 데이터가 없습니다.
          </div>
        </section>
      </main>
    </div>
  );
}
