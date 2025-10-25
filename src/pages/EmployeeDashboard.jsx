// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMyRequests();
  }, [user]);

  const fetchMyRequests = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/inventory/user/${user.id}`);
      if (res.data.success) {
        setRequests(res.data.items);
      }
    } catch (err) {
      console.error("내 요청 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;

  return (
    <motion.div
      className="p-8 bg-gray-50 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">📋 내 요청 현황</h2>

      {requests.length === 0 ? (
        <p className="text-center text-gray-500">아직 요청한 내역이 없습니다.</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {requests.map((req) => (
            <motion.div
              key={req._id}
              className="bg-white rounded-2xl shadow-md p-4 border"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">
                    [{req.type}] {req.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    창고: {req.warehouse} / 수량: {req.quantity}개
                  </p>
                  <p className="text-sm text-gray-500">사유: {req.reason || "없음"}</p>
                  <p className="text-xs text-gray-400">
                    요청일: {new Date(req.date).toLocaleString()}
                  </p>
                </div>
                {req.image && (
                  <img
                    src={`http://localhost:3001${req.image}`}
                    alt="첨부 이미지"
                    className="w-16 h-16 object-cover rounded-lg border ml-2"
                  />
                )}
              </div>

              <div className="mt-3">
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    req.status === "승인"
                      ? "bg-green-100 text-green-700"
                      : req.status === "거부"
                      ? "bg-red-100 text-red-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {req.status}
                </span>
                {req.rejectReason && (
                  <p className="text-xs text-red-500 mt-1">
                    거부 사유: {req.rejectReason}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
