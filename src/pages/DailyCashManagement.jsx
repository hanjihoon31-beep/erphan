// src/pages/DailyCashManagement.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = "http://localhost:3001/api";

export default function DailyCashManagement() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [dailyCash, setDailyCash] = useState(null);
  const [giftCardTypes, setGiftCardTypes] = useState([]);
  const [voucherTypes, setVoucherTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // 초기 데이터 로드
  useEffect(() => {
    loadStores();
    loadGiftCardTypes();
    loadVoucherTypes();
  }, []);

  // 매장 선택시 시재금 데이터 로드
  useEffect(() => {
    if (selectedStore && selectedDate) {
      loadDailyCash();
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

  const loadGiftCardTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/gift-cards`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setGiftCardTypes(response.data);
    } catch (error) {
      console.error("상품권 타입 로드 실패:", error);
    }
  };

  const loadVoucherTypes = async () => {
    try {
      const response = await axios.get(`${API_URL}/vouchers`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setVoucherTypes(response.data);
    } catch (error) {
      console.error("권면 타입 로드 실패:", error);
    }
  };

  const loadDailyCash = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/daily-cash/store/${selectedStore}/date/${selectedDate}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setDailyCash(response.data);
    } catch (error) {
      console.error("시재금 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.put(
        `${API_URL}/daily-cash/store/${selectedStore}/date/${selectedDate}`,
        dailyCash,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("저장되었습니다!");
      loadDailyCash();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const updateDeposit = (field, value) => {
    setDailyCash(prev => ({
      ...prev,
      deposit: {
        ...prev.deposit,
        [field]: parseInt(value) || 0
      }
    }));
  };

  const updateCarryOver = (field, value) => {
    setDailyCash(prev => ({
      ...prev,
      carryOver: {
        ...prev.carryOver,
        [field]: parseInt(value) || 0
      }
    }));
  };

  const updateSales = (field, value) => {
    setDailyCash(prev => ({
      ...prev,
      sales: {
        ...prev.sales,
        [field]: parseInt(value) || 0
      }
    }));
  };

  const addGiftCard = () => {
    setDailyCash(prev => ({
      ...prev,
      giftCards: [...(prev.giftCards || []), { type: "", amount: 0 }]
    }));
  };

  const removeGiftCard = (index) => {
    setDailyCash(prev => ({
      ...prev,
      giftCards: prev.giftCards.filter((_, i) => i !== index)
    }));
  };

  const updateGiftCard = (index, field, value) => {
    setDailyCash(prev => ({
      ...prev,
      giftCards: prev.giftCards.map((item, i) =>
        i === index ? { ...item, [field]: field === 'amount' ? parseInt(value) || 0 : value } : item
      )
    }));
  };

  const addVoucher = () => {
    setDailyCash(prev => ({
      ...prev,
      vouchers: [...(prev.vouchers || []), { voucherType: "", amount: 0, quantity: 1 }]
    }));
  };

  const removeVoucher = (index) => {
    setDailyCash(prev => ({
      ...prev,
      vouchers: prev.vouchers.filter((_, i) => i !== index)
    }));
  };

  const updateVoucher = (index, field, value) => {
    setDailyCash(prev => ({
      ...prev,
      vouchers: prev.vouchers.map((item, i) =>
        i === index ? { ...item, [field]: ['amount', 'quantity'].includes(field) ? parseInt(value) || 0 : value } : item
      )
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">로딩 중...</div>;
  }

  if (!dailyCash) {
    return <div className="flex items-center justify-center h-screen">데이터를 불러오는 중...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">💰 일일 시재금 관리</h1>

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
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* 입금 정보 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">💵 입금 (당일 마감)</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">5만원권</label>
            <input
              type="number"
              value={dailyCash.deposit?.bill50000 || 0}
              onChange={(e) => updateDeposit('bill50000', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">1만원권</label>
            <input
              type="number"
              value={dailyCash.deposit?.bill10000 || 0}
              onChange={(e) => updateDeposit('bill10000', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">5천원권</label>
            <input
              type="number"
              value={dailyCash.deposit?.bill5000 || 0}
              onChange={(e) => updateDeposit('bill5000', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">1천원권</label>
            <input
              type="number"
              value={dailyCash.deposit?.bill1000 || 0}
              onChange={(e) => updateDeposit('bill1000', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">500원</label>
            <input
              type="number"
              value={dailyCash.deposit?.coin500 || 0}
              onChange={(e) => updateDeposit('coin500', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">100원</label>
            <input
              type="number"
              value={dailyCash.deposit?.coin100 || 0}
              onChange={(e) => updateDeposit('coin100', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* 상품권 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">🎁 상품권</h2>
        {(dailyCash.giftCards || []).map((item, index) => (
          <div key={index} className="flex gap-4 mb-3">
            <select
              value={item.type?._id || item.type || ""}
              onChange={(e) => updateGiftCard(index, 'type', e.target.value)}
              className="flex-1 p-2 border rounded"
            >
              <option value="">선택하세요</option>
              {giftCardTypes.map(type => (
                <option key={type._id} value={type._id}>{type.name}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="금액"
              value={item.amount || 0}
              onChange={(e) => updateGiftCard(index, 'amount', e.target.value)}
              className="w-32 p-2 border rounded"
            />
            <button
              onClick={() => removeGiftCard(index)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          onClick={addGiftCard}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + 상품권 추가
        </button>
      </div>

      {/* 권면 (패키지권, 티켓) */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">🎫 권면 (패키지권/티켓)</h2>
        {(dailyCash.vouchers || []).map((item, index) => (
          <div key={index} className="flex gap-4 mb-3">
            <select
              value={item.voucherType?._id || item.voucherType || ""}
              onChange={(e) => updateVoucher(index, 'voucherType', e.target.value)}
              className="flex-1 p-2 border rounded"
            >
              <option value="">선택하세요</option>
              {voucherTypes.map(type => (
                <option key={type._id} value={type._id}>
                  [{type.category}] {type.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="권면금액"
              value={item.amount || 0}
              onChange={(e) => updateVoucher(index, 'amount', e.target.value)}
              className="w-32 p-2 border rounded"
            />
            <input
              type="number"
              placeholder="수량"
              value={item.quantity || 0}
              onChange={(e) => updateVoucher(index, 'quantity', e.target.value)}
              className="w-24 p-2 border rounded"
            />
            <button
              onClick={() => removeVoucher(index)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          onClick={addVoucher}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + 권면 추가
        </button>
      </div>

      {/* 이월 시재 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">💼 이월 시재 (다음날 준비금)</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">1만원권</label>
            <input
              type="number"
              value={dailyCash.carryOver?.bill10000 || 0}
              onChange={(e) => updateCarryOver('bill10000', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">5천원권</label>
            <input
              type="number"
              value={dailyCash.carryOver?.bill5000 || 0}
              onChange={(e) => updateCarryOver('bill5000', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">1천원권</label>
            <input
              type="number"
              value={dailyCash.carryOver?.bill1000 || 0}
              onChange={(e) => updateCarryOver('bill1000', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">500원</label>
            <input
              type="number"
              value={dailyCash.carryOver?.coin500 || 0}
              onChange={(e) => updateCarryOver('coin500', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">100원</label>
            <input
              type="number"
              value={dailyCash.carryOver?.coin100 || 0}
              onChange={(e) => updateCarryOver('coin100', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* 판매 정보 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-bold mb-4">🛍️ 판매 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">판매 갯수</label>
            <input
              type="number"
              value={dailyCash.sales?.itemCount || 0}
              onChange={(e) => updateSales('itemCount', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">판매 금액</label>
            <input
              type="number"
              value={dailyCash.sales?.totalAmount || 0}
              onChange={(e) => updateSales('totalAmount', e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? "저장 중..." : "💾 저장하기"}
        </button>
      </div>
    </div>
  );
}
