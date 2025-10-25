// src/pages/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import apiClient from "../config/api";
import { useAuth } from "../context/AuthContext";

const COLORS = ["#4F46E5", "#10B981", "#F59E0B", "#EF4444"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInventory: 0,
    pendingCount: 0,
    typeCounts: {},
    userCounts: {},
    recentLogs: [],
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [inventoryRes, userRes, logRes] = await Promise.all([
        apiClient.get("/api/inventory"),
        apiClient.get("/api/users"),
        apiClient.get("/api/logs"),
      ]);

      const inventory = inventoryRes.data.inventory || [];
      const users = userRes.data.users || [];
      const logs = logRes.data.logs || [];

      const pendingCount = inventory.filter((i) => i.status === "대기").length;
      const typeCounts = inventory.reduce((acc, i) => {
        acc[i.type] = (acc[i.type] || 0) + 1;
        return acc;
      }, {});

      const userCounts = users.reduce((acc, u) => {
        acc[u.role] = (acc[u.role] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalInventory: inventory.length,
        pendingCount,
        typeCounts,
        userCounts,
        recentLogs: logs.slice(0, 5),
      });
    } catch (err) {
      console.error("통계 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin)
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-500">
        ⚠️ 접근 권한이 없습니다.
      </div>
    );

  if (loading)
    return <p className="text-center mt-10 text-gray-500">로딩 중...</p>;

  const chartData = Object.entries(stats.typeCounts).map(([key, value]) => ({
    name: key,
    value,
  }));

  const userData = Object.entries(stats.userCounts).map(([key, value]) => ({
    name:
      key === "superadmin"
        ? "최종관리자"
        : key === "admin"
        ? "관리자"
        : "직원",
    value,
  }));

  return (
    <motion.div
      className="p-8 bg-gray-50 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h1 className="text-3xl font-bold mb-6 text-center">📊 관리자 대시보드</h1>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <h3 className="text-sm text-gray-500">총 재고 등록 건수</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalInventory}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <h3 className="text-sm text-gray-500">승인 대기 건수</h3>
          <p className="text-2xl font-bold text-yellow-500">{stats.pendingCount}</p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <h3 className="text-sm text-gray-500">관리자 수</h3>
          <p className="text-2xl font-bold text-green-600">
            {stats.userCounts.admin || 0}
          </p>
        </div>
        <div className="bg-white shadow rounded-xl p-4 text-center">
          <h3 className="text-sm text-gray-500">직원 수</h3>
          <p className="text-2xl font-bold text-gray-700">
            {stats.userCounts.employee || 0}
          </p>
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="text-center text-gray-700 mb-4 font-semibold">
            📦 재고 이동 현황
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label
              >
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow rounded-2xl p-4">
          <h3 className="text-center text-gray-700 mb-4 font-semibold">
            👥 사용자 비율
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={userData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label
              >
                {userData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 최근 로그 */}
      <div className="bg-white shadow rounded-2xl p-6">
        <h3 className="text-lg font-bold mb-4">🧾 최근 활동 로그</h3>
        <ul className="divide-y divide-gray-200">
          {stats.recentLogs.length === 0 ? (
            <p className="text-gray-400 text-center py-4">
              최근 로그가 없습니다.
            </p>
          ) : (
            stats.recentLogs.map((log) => (
              <li key={log._id} className="py-2 text-sm">
                <span className="font-semibold">{log.action}</span> —{" "}
                {log.itemName} ({new Date(log.timestamp).toLocaleString()})
              </li>
            ))
          )}
        </ul>
      </div>
    </motion.div>
  );
}
