// src/pages/AdminLogManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

const AdminLogManager = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ 로그 불러오기
  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/logs");
      if (res.data.success) setLogs(res.data.logs || []);
    } catch (err) {
      console.error("로그 불러오기 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLogs();
    setTimeout(() => setRefreshing(false), 500);
  };

  const filteredLogs =
    filter === "all" ? logs : logs.filter((log) => log.actionType === filter);

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;

  return (
    <motion.div
      className="p-8 bg-gray-50 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">📜 승인 / 거부 로그</h2>
        <button
          onClick={handleRefresh}
          className={`px-4 py-2 rounded-lg text-white ${
            refreshing ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          새로고침
        </button>
      </div>

      {/* 필터 */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filter === "all" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setFilter("inventory")}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filter === "inventory" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          재고 승인
        </button>
        <button
          onClick={() => setFilter("user")}
          className={`px-4 py-2 rounded-lg font-semibold ${
            filter === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
          }`}
        >
          직원 승인
        </button>
      </div>

      {filteredLogs.length === 0 ? (
        <p className="text-gray-500 text-center">로그가 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <motion.div
              key={log._id}
              className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between">
                <div>
                  <p className="font-semibold text-lg">
                    {log.actionType === "inventory" ? "📦 재고" : "👤 직원"}{" "}
                    {log.action === "approve"
                      ? "승인"
                      : log.action === "reject"
                      ? "거부"
                      : "기타"}
                  </p>
                  <p className="text-sm text-gray-700">
                    대상: {log.targetName || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">
                    처리자: {log.approverName || "알 수 없음"} (
                    {log.approverRole})
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    사유: {log.reason || "없음"}
                  </p>
                </div>
                <div className="text-right text-xs text-gray-400">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default AdminLogManager;
