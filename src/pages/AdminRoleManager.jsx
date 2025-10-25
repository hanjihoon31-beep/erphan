// src/pages/AdminRoleManager.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { Users, Shield, UserX, UserCheck } from "lucide-react";

const AdminRoleManager = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // ✅ 전체 유저 목록 불러오기
  const fetchUsers = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const res = await axios.get("http://localhost:3001/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      console.error("❌ 유저 불러오기 오류:", err);
      alert("유저 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 역할 변경
  const handleRoleChange = async (userId, currentRole) => {
    const roleOptions = ["staff", "manager", "admin", "superadmin"];
    const newRole = prompt(
      `새 역할을 입력하세요 (${roleOptions.join(", ")}):`,
      currentRole
    );

    if (!newRole || !roleOptions.includes(newRole)) {
      return alert("유효하지 않은 역할입니다.");
    }

    if (newRole === currentRole) {
      return alert("같은 역할입니다.");
    }

    if (!window.confirm(`이 사용자의 역할을 ${newRole}(으)로 변경하시겠습니까?`)) {
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const res = await axios.put(
        `http://localhost:3001/api/admin/update-role/${userId}`,
        { role: newRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("✅ 권한이 변경되었습니다.");
        fetchUsers();
      }
    } catch (err) {
      console.error("❌ 권한 변경 오류:", err);
      alert(err.response?.data?.message || "권한 변경에 실패했습니다.");
    }
  };

  // ✅ 계정 비활성화 (퇴사 처리)
  const handleDeactivate = async (userId, userName) => {
    const reason = prompt(`${userName}님의 퇴사 사유를 입력하세요:`, "퇴사");

    if (!reason) return;

    if (!window.confirm(`${userName}님의 계정을 비활성화하시겠습니까?`)) {
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const res = await axios.put(
        `http://localhost:3001/api/admin/deactivate/${userId}`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("🚫 계정이 비활성화되었습니다.");
        fetchUsers();
      }
    } catch (err) {
      console.error("❌ 비활성화 오류:", err);
      alert(err.response?.data?.message || "비활성화에 실패했습니다.");
    }
  };

  // ✅ 계정 재활성화
  const handleReactivate = async (userId, userName) => {
    if (!window.confirm(`${userName}님의 계정을 재활성화하시겠습니까?`)) {
      return;
    }

    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const res = await axios.put(
        `http://localhost:3001/api/admin/reactivate/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        alert("✅ 계정이 재활성화되었습니다.");
        fetchUsers();
      }
    } catch (err) {
      console.error("❌ 재활성화 오류:", err);
      alert(err.response?.data?.message || "재활성화에 실패했습니다.");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      u.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // 상태별 통계
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "active").length,
    pending: users.filter(u => u.status === "pending").length,
    inactive: users.filter(u => u.status === "inactive").length,
  };

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;

  if (!isAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600 font-semibold">접근 권한이 없습니다.</p>
      </div>
    );
  }

  return (
    <motion.div
      className="p-8 bg-gray-50 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="mb-6">
        <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Users className="w-8 h-8" />
          사용자 관리
        </h2>
        <p className="text-gray-600">전체 사용자 목록 및 권한 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">전체 사용자</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Users className="w-10 h-10 text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">활성 사용자</p>
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
            </div>
            <UserCheck className="w-10 h-10 text-green-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">승인 대기</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Shield className="w-10 h-10 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">비활성화</p>
              <p className="text-2xl font-bold text-red-600">{stats.inactive}</p>
            </div>
            <UserX className="w-10 h-10 text-red-500" />
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="이름 또는 이메일 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border px-4 py-2 rounded-lg shadow-sm"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border px-4 py-2 rounded-lg shadow-sm"
        >
          <option value="all">전체 상태</option>
          <option value="active">활성</option>
          <option value="pending">승인 대기</option>
          <option value="rejected">거절됨</option>
          <option value="inactive">비활성화</option>
        </select>
      </div>

      {/* 사용자 목록 */}
      <div className="space-y-4">
        {filteredUsers.length === 0 ? (
          <p className="text-center text-gray-500">검색 결과가 없습니다.</p>
        ) : (
          filteredUsers.map((u) => (
            <motion.div
              key={u._id}
              className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <p className="font-bold text-xl">{u.name}</p>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        u.status === "active"
                          ? "bg-green-100 text-green-700"
                          : u.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : u.status === "rejected"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.status === "active" && "활성"}
                      {u.status === "pending" && "승인 대기"}
                      {u.status === "rejected" && "거절됨"}
                      {u.status === "inactive" && "비활성화"}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        u.role === "superadmin"
                          ? "bg-purple-100 text-purple-700"
                          : u.role === "admin"
                          ? "bg-blue-100 text-blue-700"
                          : u.role === "manager"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {u.role === "superadmin" && "최고관리자"}
                      {u.role === "admin" && "관리자"}
                      {u.role === "manager" && "매니저"}
                      {u.role === "staff" && "직원"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    이메일: {u.email}
                  </p>
                  <p className="text-xs text-gray-400">
                    가입일: {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                  {u.status === "inactive" && u.inactivationReason && (
                    <p className="text-sm text-red-600 mt-2">
                      사유: {u.inactivationReason}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleRoleChange(u._id, u.role)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm"
                    disabled={u.status === "inactive"}
                  >
                    권한 변경
                  </button>

                  {u.status === "inactive" ? (
                    <button
                      onClick={() => handleReactivate(u._id, u.name)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition text-sm"
                    >
                      재활성화
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeactivate(u._id, u.name)}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                      disabled={u.status === "pending"}
                    >
                      비활성화
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default AdminRoleManager;
