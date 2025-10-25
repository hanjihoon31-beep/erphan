import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import apiClient from "../config/api";
import { useAuth } from "../context/AuthContext";

const AdminApproval = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState("users");
  const [userRequests, setUserRequests] = useState([]);
  const [inventoryRequests, setInventoryRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const canApprove = user?.role === "superadmin" || user?.role === "admin";

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, inventoryRes] = await Promise.all([
        apiClient.get("/api/admin/pending"),
        apiClient.get("/api/inventory"),
      ]);
      setUserRequests(usersRes.data || []);
      setInventoryRequests(
        (inventoryRes.data.inventory || []).filter((i) => i.status === "대기")
      );
    } catch (err) {
      console.error("데이터 불러오기 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ 직원 승인
  const handleUserApprove = async (id) => {
    if (!canApprove) return alert("권한이 없습니다.");
    if (!window.confirm("해당 직원을 승인하시겠습니까?")) return;
    try {
      await apiClient.put(`/api/admin/approve/${id}`);
      alert("✅ 직원 승인 완료");
      fetchData();
    } catch (err) {
      console.error("승인 오류:", err);
      alert("승인 중 오류 발생");
    }
  };

  // ❌ 직원 거부
  const handleUserReject = async (id) => {
    if (!canApprove) return alert("권한이 없습니다.");
    const reason = prompt("거부 사유를 입력해주세요:");
    if (!reason) return;
    try {
      await apiClient.put(`/api/admin/reject/${id}`, { reason });
      alert("❌ 직원 요청 거부 완료");
      fetchData();
    } catch (err) {
      console.error("거부 오류:", err);
      alert("거부 처리 중 오류 발생");
    }
  };

  // ✅ 권한 변경
  const handleRoleChange = async (id, newRole) => {
    if (user?.role !== "superadmin") return alert("최고관리자만 수정 가능합니다.");
    try {
      await apiClient.put(`/api/admin/update-role/${id}`, {
        role: newRole,
      });
      alert("✅ 권한이 변경되었습니다.");
      fetchData();
    } catch (err) {
      console.error("권한 변경 오류:", err);
      alert("권한 변경 중 오류가 발생했습니다.");
    }
  };

  // ✅ 재고 승인
  const handleInventoryApprove = async (id) => {
    if (!canApprove) return alert("권한이 없습니다.");
    try {
      await apiClient.put(`/api/inventory/${id}/approve`);
      alert("✅ 재고 요청 승인 완료");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("재고 승인 중 오류 발생");
    }
  };

  // ❌ 재고 거부
  const handleInventoryReject = async (id) => {
    if (!canApprove) return alert("권한이 없습니다.");
    const reason = prompt("거부 사유를 입력해주세요:");
    if (!reason) return;
    try {
      await apiClient.put(`/api/inventory/${id}/reject`, { reason });
      alert("❌ 재고 요청 거부 완료");
      fetchData();
    } catch (err) {
      console.error(err);
      alert("재고 거부 중 오류 발생");
    }
  };

  if (loading) return <p className="text-center mt-10">로딩 중...</p>;

  return (
    <motion.div
      className="p-8 bg-gray-50 min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 탭 */}
      <div className="flex justify-center gap-4 mb-6">
        <button
          className={`px-6 py-2 rounded-lg font-semibold ${
            tab === "users" ? "bg-blue-600 text-white" : "bg-white border"
          }`}
          onClick={() => setTab("users")}
        >
          👤 회원 승인
        </button>
        <button
          className={`px-6 py-2 rounded-lg font-semibold ${
            tab === "inventory" ? "bg-blue-600 text-white" : "bg-white border"
          }`}
          onClick={() => setTab("inventory")}
        >
          📦 재고 승인
        </button>
      </div>

      {/* 회원 승인 */}
      {tab === "users" && (
        <div>
          <h2 className="text-xl font-bold mb-4">👤 승인 대기 / 권한 관리</h2>
          {userRequests.length === 0 ? (
            <p className="text-gray-500 text-center">
              승인 대기 또는 등록된 직원이 없습니다.
            </p>
          ) : (
            userRequests.map((u) => (
              <div
                key={u._id}
                className="bg-white p-4 rounded-xl shadow-sm mb-3 border"
              >
                <p className="font-semibold">{u.name}</p>
                <p className="text-sm text-gray-500">{u.email}</p>
                <p className="text-sm text-gray-400 mt-1">
                  현재 권한: <strong>{u.role}</strong>
                </p>

                {user?.role === "superadmin" && (
                  <div className="mt-3 flex items-center gap-2">
                    <label className="text-sm text-gray-600">권한 변경:</label>
                    <select
                      defaultValue={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      className="border rounded p-1 text-sm"
                    >
                      <option value="근무자">근무자</option>
                      <option value="중간관리자">중간관리자</option>
                      <option value="superadmin">최고관리자</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-3">
                  {u.status === "대기" && (
                    <>
                      <button
                        onClick={() => handleUserApprove(u._id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleUserReject(u._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
                      >
                        거부
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 재고 승인 */}
      {tab === "inventory" && (
        <div>
          <h2 className="text-xl font-bold mb-4">📦 승인 대기 중인 재고</h2>
          {inventoryRequests.length === 0 ? (
            <p className="text-gray-500 text-center">승인 대기 재고 없음</p>
          ) : (
            inventoryRequests.map((req) => (
              <div
                key={req._id}
                className="bg-white p-4 rounded-xl shadow-sm mb-3 border"
              >
                <p className="font-semibold">
                  [{req.type}] {req.name}
                </p>
                <p className="text-sm text-gray-500">
                  창고: {req.warehouse} / 수량: {req.quantity}개
                </p>
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    onClick={() => handleInventoryApprove(req._id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg"
                  >
                    승인
                  </button>
                  <button
                    onClick={() => handleInventoryReject(req._id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg"
                  >
                    거부
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
};

export default AdminApproval;
