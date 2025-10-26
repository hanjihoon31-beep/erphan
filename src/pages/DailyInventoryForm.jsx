// src/pages/DailyInventoryForm.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = "http://localhost:3001/api";

export default function DailyInventoryForm() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailyInventory, setDailyInventory] = useState(null);
  const [loading, setLoading] = useState(false);

  const isAdmin = ["admin", "superadmin"].includes(user?.role);

  useEffect(() => {
    loadStores();
  }, []);

  useEffect(() => {
    if (selectedStore && selectedDate) {
      loadDailyInventory();
    }
  }, [selectedStore, selectedDate]);

  const loadStores = async () => {
    try {
      const response = await axios.get(`${API_URL}/inventory/stores`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setStores(response.data);
      if (response.data.length > 0) {
        setSelectedStore(response.data[0]._id);
      }
    } catch (error) {
      console.error("매장 로드 실패:", error);
    }
  };

  const loadDailyInventory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/daily-inventory/store/${selectedStore}/date/${selectedDate}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setDailyInventory(response.data);
    } catch (error) {
      console.error("일일 재고 로드 실패:", error);
      alert("일일 재고 조회 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (index, field, value) => {
    setDailyInventory(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: parseFloat(value) || 0 } : item
      )
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${API_URL}/daily-inventory/store/${selectedStore}/date/${selectedDate}`,
        {
          items: dailyInventory.items,
          note: dailyInventory.note
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("저장되었습니다!");
      loadDailyInventory();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!dailyInventory.discrepancyReason && dailyInventory.items.some(item => item.discrepancy !== 0)) {
      alert("차이 사유를 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/daily-inventory/${dailyInventory._id}/request-approval`,
        { discrepancyReason: dailyInventory.discrepancyReason },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("승인 요청이 완료되었습니다!");
      loadDailyInventory();
    } catch (error) {
      console.error("승인 요청 실패:", error);
      alert("승인 요청 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/daily-inventory/${dailyInventory._id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("승인되었습니다!");
      loadDailyInventory();
    } catch (error) {
      console.error("승인 실패:", error);
      alert("승인 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("거부 사유를 입력해주세요:");
    if (!reason) return;

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/daily-inventory/${dailyInventory._id}/reject`,
        { rejectionReason: reason },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("거부되었습니다!");
      loadDailyInventory();
    } catch (error) {
      console.error("거부 실패:", error);
      alert("거부 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 날짜 제한 (직원은 당일/전날만)
  const canAccessDate = () => {
    if (isAdmin) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);

    return selected.getTime() === today.getTime() || selected.getTime() === yesterday.getTime();
  };

  if (loading && !dailyInventory) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  }

  if (!dailyInventory) {
    return <div className="flex items-center justify-center h-screen">데이터를 불러오는 중...</div>;
  }

  const hasDiscrepancy = dailyInventory.items.some(item => item.discrepancy !== 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📋 일일 재고 관리</h1>

      {/* 매장 및 날짜 선택 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">매장</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full p-2 border rounded"
            >
              {stores.map(store => (
                <option key={store._id} value={store._id}>
                  {store.storeName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">날짜</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={isAdmin ? undefined : new Date().toISOString().split("T")[0]}
              min={isAdmin ? undefined : new Date(Date.now() - 86400000).toISOString().split("T")[0]}
              className="w-full p-2 border rounded"
            />
            {!canAccessDate() && (
              <p className="text-red-500 text-sm mt-1">직원은 당일과 전날만 접근 가능합니다.</p>
            )}
          </div>
        </div>

        {/* 상태 표시 */}
        <div className="mt-4 flex gap-4 items-center">
          <span className={`px-3 py-1 rounded text-white ${
            dailyInventory.status === "대기" ? "bg-gray-400" :
            dailyInventory.status === "작성중" ? "bg-blue-500" :
            dailyInventory.status === "승인요청" ? "bg-yellow-500" :
            dailyInventory.status === "승인" ? "bg-green-500" :
            "bg-red-500"
          }`}>
            {dailyInventory.status}
          </span>
          {dailyInventory.approvedBy && (
            <span className="text-sm text-gray-600">
              승인자: {dailyInventory.approvedBy.name} ({new Date(dailyInventory.approvedAt).toLocaleString("ko-KR")})
            </span>
          )}
        </div>
      </div>

      {/* 재고 아이템 테이블 */}
      {canAccessDate() && (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제품명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">전날 마감</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">아침 재고</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">입고</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">판매</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">폐기</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">마감 재고</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">차이</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyInventory.items.map((item, index) => (
                    <tr key={index} className={item.discrepancy !== 0 ? "bg-red-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.product?.name || "알 수 없음"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.previousClosingStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.morningStock}
                          onChange={(e) => updateItem(index, 'morningStock', e.target.value)}
                          disabled={dailyInventory.status === "승인"}
                          className="w-20 p-1 border rounded"
                          step="0.01"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.inbound}
                          onChange={(e) => updateItem(index, 'inbound', e.target.value)}
                          disabled={dailyInventory.status === "승인"}
                          className="w-20 p-1 border rounded"
                          step="0.01"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.sales}
                          onChange={(e) => updateItem(index, 'sales', e.target.value)}
                          disabled={dailyInventory.status === "승인"}
                          className="w-20 p-1 border rounded"
                          step="0.01"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.disposal}
                          onChange={(e) => updateItem(index, 'disposal', e.target.value)}
                          disabled={dailyInventory.status === "승인"}
                          className="w-20 p-1 border rounded"
                          step="0.01"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={item.closingStock}
                          onChange={(e) => updateItem(index, 'closingStock', e.target.value)}
                          disabled={dailyInventory.status === "승인"}
                          className="w-20 p-1 border rounded"
                          step="0.01"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-bold ${item.discrepancy !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {item.discrepancy}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 차이 사유 */}
          {hasDiscrepancy && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <label className="block text-sm font-medium mb-2">차이 사유</label>
              <textarea
                value={dailyInventory.discrepancyReason || ""}
                onChange={(e) => setDailyInventory({...dailyInventory, discrepancyReason: e.target.value})}
                disabled={dailyInventory.status === "승인"}
                className="w-full p-2 border rounded"
                rows="3"
                placeholder="재고 차이가 발생한 이유를 입력해주세요..."
              />
            </div>
          )}

          {/* 메모 */}
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <label className="block text-sm font-medium mb-2">메모</label>
            <textarea
              value={dailyInventory.note || ""}
              onChange={(e) => setDailyInventory({...dailyInventory, note: e.target.value})}
              disabled={dailyInventory.status === "승인"}
              className="w-full p-2 border rounded"
              rows="2"
              placeholder="특이사항을 입력해주세요..."
            />
          </div>

          {/* 거부 사유 표시 */}
          {dailyInventory.status === "거부" && dailyInventory.rejectionReason && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <p className="text-red-800 font-medium">거부 사유:</p>
              <p className="text-red-600">{dailyInventory.rejectionReason}</p>
            </div>
          )}

          {/* 액션 버튼 */}
          <div className="flex justify-end gap-3">
            {dailyInventory.status !== "승인" && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
              >
                {loading ? "저장 중..." : "💾 저장"}
              </button>
            )}

            {dailyInventory.status === "작성중" && hasDiscrepancy && (
              <button
                onClick={handleRequestApproval}
                disabled={loading}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:bg-gray-400"
              >
                📤 승인 요청
              </button>
            )}

            {isAdmin && dailyInventory.status === "승인요청" && (
              <>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
                >
                  ✅ 승인
                </button>
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-400"
                >
                  ❌ 거부
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
