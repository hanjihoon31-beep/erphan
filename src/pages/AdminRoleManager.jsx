// src/pages/AdminRoleManager.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import apiClient from "../config/api";
import { useAuth } from "../context/AuthContext";

const AdminRoleManager = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const isSuperAdmin = user?.role === "superadmin";

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ 전체 유저 목록 불러오기
  const fetchUsers = async () => {
    try {
      const res = await apiClient.get("/api/users");
      if (res.data.success) setUsers(res.data.users);
    } catch (err) {
      console.error("❌ 유저 불러오기 오류:", err);
      alert("유저 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 역할 변경 (최종관리자 전용)
  const handleRoleChange = async (employeeId, newRole) => {
    if (!isSuperAdmin) return alert("권한이 없습니다.");
    if (!window.confirm(`${employeeId}의 역할을 ${newRole}으로 변경하시겠습니까?`)) return;

    try {
      const res = await apiClient.put("/api/users/role", {
        employeeId,
        newRole,
      });

      if (res.data.success) {
        alert("✅ 권한이 변경되었습니다.");
        fetchUsers();
      } else {
        alert(res.data.message || "권한 변경 실패");
      }
    } catch (err) {
      console.error("❌ 권한 변경 오류:", err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  // ✅ 계정 비활성화
  const handleDeactivate = async (employeeId) => {
    if (!isSuperAdmin) return alert("권한이 없습니다.");
    if (!window.confirm(`${employeeId} 계정을 비활성화하시겠습니까?`)) return;

    try {
      const res = await apiClient.put("/api/users/deactivate", {
        employeeId,
      });

      if (res.data.success) {
        alert("🚫 계정이 비활성화되었습니다.");
        fetchUsers();
      } else {
        alert(res.data.message || "처리 실패");
      }
    } catch (err) {
      console.error("❌ 비활성화 오류:", err);
      alert("서버 오류가 발생했습니다.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;

  return (
    <motion.div
      className="p-8 bg-gray-50 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">🧑‍💼 관리자 권한 관리</h2>
        <input
          type="text"
          placeholder="이름, 사번, 이메일 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border px-3 py-2 rounded-lg shadow-sm w-64"
        />
      </div>

      {!isSuperAdmin ? (
        <p className="text-center text-gray-600">
          접근 권한이 없습니다. (최종관리자 전용 페이지)
        </p>
      ) : (
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <p className="text-center text-gray-500">등록된 유저가 없습니다.</p>
          ) : (
            filteredUsers.map((u) => (
              <motion.div
                key={u._id}
                className="bg-white border border-gray-200 shadow-sm p-4 rounded-xl flex justify-between items-center"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <p className="font-bold text-lg">{u.name}</p>
                  <p className="text-sm text-gray-600">
                    사번: {u.employeeId} / 이메일: {u.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    현재 역할:{" "}
                    <span className="font-semibold text-blue-500">{u.role}</span>
                    {u.status === "pending" && (
                      <span className="ml-2 text-yellow-500">(승인 대기)</span>
                    )}
                    {u.status === "deactivated" && (
                      <span className="ml-2 text-red-500">(비활성화)</span>
                    )}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      handleRoleChange(
                        u.employeeId,
                        u.role === "admin" ? "employee" : "admin"
                      )
                    }
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {u.role === "admin" ? "직원으로 변경" : "관리자로 변경"}
                  </button>

                  <button
                    onClick={() => handleDeactivate(u.employeeId)}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    비활성화
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AdminRoleManager;
