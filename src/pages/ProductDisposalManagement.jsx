// src/pages/ProductDisposalManagement.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = "http://localhost:3001/api";

export default function ProductDisposalManagement() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [disposals, setDisposals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState({ status: "", reason: "", storeId: "" });

  const [disposalForm, setDisposalForm] = useState({
    storeId: "",
    productId: "",
    quantity: 1,
    reason: "근무자실수",
    reasonDetail: "",
    photos: []
  });

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  useEffect(() => {
    loadStores();
    loadProducts();
    loadDisposals();
  }, []);

  const loadStores = async () => {
    try {
      const response = await axios.get(`${API_URL}/inventory/stores`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStores(response.data);
    } catch (error) {
      console.error("매장 로드 실패:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/inventory/products`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setProducts(response.data);
    } catch (error) {
      console.error("제품 로드 실패:", error);
    }
  };

  const loadDisposals = async () => {
    try {
      setLoading(true);
      let url = `${API_URL}/disposal?`;
      if (filter.status) url += `status=${filter.status}&`;
      if (filter.reason) url += `reason=${filter.reason}&`;
      if (filter.storeId) url += `storeId=${filter.storeId}&`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setDisposals(response.data);
    } catch (error) {
      console.error("폐기 목록 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setDisposalForm(prev => ({
      ...prev,
      photos: [...prev.photos, ...files]
    }));
  };

  const removePhoto = (index) => {
    setDisposalForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!disposalForm.storeId || !disposalForm.productId) {
      alert("매장과 제품을 선택해주세요.");
      return;
    }

    if (disposalForm.reason === "기타" && !disposalForm.reasonDetail) {
      alert("기타 사유를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("storeId", disposalForm.storeId);
      formData.append("date", new Date().toISOString());
      formData.append("productId", disposalForm.productId);
      formData.append("quantity", disposalForm.quantity);
      formData.append("reason", disposalForm.reason);
      formData.append("reasonDetail", disposalForm.reasonDetail);

      disposalForm.photos.forEach(photo => {
        formData.append("photos", photo);
      });

      await axios.post(`${API_URL}/disposal`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      alert("폐기가 등록되었습니다!");
      setShowModal(false);
      resetForm();
      loadDisposals();
    } catch (error) {
      console.error("폐기 등록 실패:", error);
      alert("폐기 등록 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (disposalId, currentReason) => {
    const shouldModify = window.confirm("사유를 수정하시겠습니까?");

    let adminModifiedReason = null;
    let adminModifiedReasonDetail = null;

    if (shouldModify) {
      const reasons = ["근무자실수", "기계문제", "품질문제", "기타"];
      const selectedReason = prompt(`사유를 선택하세요:\n1. 근무자실수\n2. 기계문제\n3. 품질문제\n4. 기타\n\n숫자를 입력하세요:`);

      if (selectedReason) {
        const reasonIndex = parseInt(selectedReason) - 1;
        if (reasonIndex >= 0 && reasonIndex < reasons.length) {
          adminModifiedReason = reasons[reasonIndex];

          if (adminModifiedReason === "기타") {
            adminModifiedReasonDetail = prompt("상세 사유를 입력하세요:");
            if (!adminModifiedReasonDetail) return;
          }
        }
      }
    }

    try {
      setLoading(true);
      await axios.patch(
        `${API_URL}/disposal/${disposalId}/approve`,
        { adminModifiedReason, adminModifiedReasonDetail },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("승인되었습니다!");
      loadDisposals();
    } catch (error) {
      console.error("승인 실패:", error);
      alert("승인 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (disposalId) => {
    const reason = prompt("거부 사유를 입력하세요:");
    if (!reason) return;

    try {
      setLoading(true);
      await axios.patch(
        `${API_URL}/disposal/${disposalId}/reject`,
        { rejectionReason: reason },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("거부되었습니다!");
      loadDisposals();
    } catch (error) {
      console.error("거부 실패:", error);
      alert("거부 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await axios.post(
        `${API_URL}/disposal/export`,
        { filters: filter },
        {
          headers: { Authorization: `Bearer ${user.token}` },
          responseType: "blob"
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `폐기내역_${new Date().toISOString().split("T")[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      alert("엑셀 파일이 다운로드되었습니다!");
    } catch (error) {
      console.error("엑셀 내보내기 실패:", error);
      alert("엑셀 내보내기 실패: " + (error.response?.data?.message || error.message));
    }
  };

  const resetForm = () => {
    setDisposalForm({
      storeId: "",
      productId: "",
      quantity: 1,
      reason: "근무자실수",
      reasonDetail: "",
      photos: []
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🗑️ 폐기 관리</h1>

      {/* 필터 및 액션 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">매장</label>
            <select
              value={filter.storeId}
              onChange={(e) => setFilter({...filter, storeId: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              {stores.map(store => (
                <option key={store._id} value={store._id}>{store.storeName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">상태</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({...filter, status: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="대기">대기</option>
              <option value="승인">승인</option>
              <option value="거부">거부</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">사유</label>
            <select
              value={filter.reason}
              onChange={(e) => setFilter({...filter, reason: e.target.value})}
              className="w-full p-2 border rounded"
            >
              <option value="">전체</option>
              <option value="근무자실수">근무자실수</option>
              <option value="기계문제">기계문제</option>
              <option value="품질문제">품질문제</option>
              <option value="기타">기타</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={loadDisposals}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              🔍 검색
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            + 폐기 등록
          </button>
          {isAdmin && (
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
            >
              📊 엑셀 내보내기
            </button>
          )}
        </div>
      </div>

      {/* 폐기 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">매장</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제품</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">수량</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">원래 사유</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">최종 사유</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">요청자</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사진</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">액션</th>}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {disposals.map(disposal => (
                <tr key={disposal._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {new Date(disposal.date).toLocaleDateString("ko-KR")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {disposal.store?.storeName || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {disposal.product?.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {disposal.quantity} {disposal.product?.unit || "개"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {disposal.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      disposal.adminModifiedReason ? "bg-yellow-100 text-yellow-800" : "bg-gray-100"
                    }`}>
                      {disposal.adminModifiedReason || disposal.reason}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {disposal.requestedBy?.name || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded ${
                      disposal.status === "대기" ? "bg-yellow-100 text-yellow-800" :
                      disposal.status === "승인" ? "bg-green-100 text-green-800" :
                      "bg-red-100 text-red-800"
                    }`}>
                      {disposal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {disposal.photos && disposal.photos.length > 0 ? (
                      <span className="text-blue-600">{disposal.photos.length}장</span>
                    ) : (
                      <span className="text-gray-400">없음</span>
                    )}
                  </td>
                  {isAdmin && disposal.status === "대기" && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleApprove(disposal._id, disposal.reason)}
                        className="mr-2 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-xs"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => handleReject(disposal._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                      >
                        거부
                      </button>
                    </td>
                  )}
                  {isAdmin && disposal.status !== "대기" && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      처리 완료
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {disposals.length === 0 && !loading && (
          <div className="p-12 text-center text-gray-500">
            폐기 내역이 없습니다.
          </div>
        )}
      </div>

      {/* 폐기 등록 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">폐기 등록</h3>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">매장 *</label>
                  <select
                    value={disposalForm.storeId}
                    onChange={(e) => setDisposalForm({...disposalForm, storeId: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    {stores.map(store => (
                      <option key={store._id} value={store._id}>{store.storeName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">제품 *</label>
                  <select
                    value={disposalForm.productId}
                    onChange={(e) => setDisposalForm({...disposalForm, productId: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">선택하세요</option>
                    {products.map(product => (
                      <option key={product._id} value={product._id}>{product.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">수량 *</label>
                  <input
                    type="number"
                    value={disposalForm.quantity}
                    onChange={(e) => setDisposalForm({...disposalForm, quantity: parseInt(e.target.value) || 1})}
                    className="w-full p-2 border rounded"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">사유 *</label>
                  <select
                    value={disposalForm.reason}
                    onChange={(e) => setDisposalForm({...disposalForm, reason: e.target.value})}
                    className="w-full p-2 border rounded"
                  >
                    <option value="근무자실수">근무자실수</option>
                    <option value="기계문제">기계문제</option>
                    <option value="품질문제">품질문제</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
              </div>

              {disposalForm.reason === "기타" && (
                <div>
                  <label className="block text-sm font-medium mb-2">상세 사유 *</label>
                  <textarea
                    value={disposalForm.reasonDetail}
                    onChange={(e) => setDisposalForm({...disposalForm, reasonDetail: e.target.value})}
                    className="w-full p-2 border rounded"
                    rows="2"
                    placeholder="상세 사유를 입력하세요..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">사진 (최대 5장)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="w-full p-2 border rounded"
                />
                {disposalForm.photos.length > 0 && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {disposalForm.photos.map((photo, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(photo)}
                          alt={`Preview ${index + 1}`}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || !disposalForm.storeId || !disposalForm.productId}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
              >
                {loading ? "등록 중..." : "등록"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
