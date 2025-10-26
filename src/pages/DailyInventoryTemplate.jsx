// src/pages/DailyInventoryTemplate.jsx
import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const API_URL = "http://localhost:3001/api";

export default function DailyInventoryTemplate() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedStore, setSelectedStore] = useState("");
  const [template, setTemplate] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadStores();
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedStore) {
      loadTemplate();
    }
  }, [selectedStore]);

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

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/daily-inventory/template/${selectedStore}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setTemplate(response.data.products || []);
    } catch (error) {
      console.error("템플릿 로드 실패:", error);
      setTemplate([]);
    } finally {
      setLoading(false);
    }
  };

  const addProduct = (productId) => {
    if (template.includes(productId)) {
      alert("이미 추가된 제품입니다.");
      return;
    }
    setTemplate([...template, productId]);
  };

  const removeProduct = (productId) => {
    setTemplate(template.filter(id => id !== productId));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/daily-inventory/template/${selectedStore}`,
        { products: template },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      alert("템플릿이 저장되었습니다!");
      loadTemplate();
    } catch (error) {
      console.error("저장 실패:", error);
      alert("저장 실패: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const selectedProducts = products.filter(p => template.includes(p._id));
  const availableProducts = products.filter(p => !template.includes(p._id));

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📝 일일 재고 템플릿 관리</h1>

      {/* 매장 선택 */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <label className="block text-sm font-medium mb-2">매장 선택</label>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="w-full p-2 border rounded max-w-md"
        >
          {stores.map(store => (
            <option key={store._id} value={store._id}>
              {store.storeName}
            </option>
          ))}
        </select>
        <p className="text-sm text-gray-500 mt-2">
          이 매장에서 매일 관리할 제품 목록을 설정하세요. 매일 자동으로 재고 폼이 생성됩니다.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* 선택된 제품 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">✅ 템플릿에 포함된 제품 ({selectedProducts.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {selectedProducts.map(product => (
              <div key={product._id} className="flex justify-between items-center p-3 bg-green-50 border border-green-200 rounded">
                <div>
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({product.category})</span>
                </div>
                <button
                  onClick={() => removeProduct(product._id)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                >
                  제거
                </button>
              </div>
            ))}
            {selectedProducts.length === 0 && (
              <p className="text-gray-400 text-center py-8">템플릿에 제품을 추가해주세요</p>
            )}
          </div>
        </div>

        {/* 사용 가능한 제품 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">➕ 추가 가능한 제품 ({availableProducts.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {availableProducts.map(product => (
              <div key={product._id} className="flex justify-between items-center p-3 bg-gray-50 border border-gray-200 rounded">
                <div>
                  <span className="font-medium">{product.name}</span>
                  <span className="text-sm text-gray-500 ml-2">({product.category})</span>
                </div>
                <button
                  onClick={() => addProduct(product._id)}
                  className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                >
                  추가
                </button>
              </div>
            ))}
            {availableProducts.length === 0 && (
              <p className="text-gray-400 text-center py-8">모든 제품이 템플릿에 추가되었습니다</p>
            )}
          </div>
        </div>
      </div>

      {/* 저장 버튼 */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400"
        >
          {loading ? "저장 중..." : "💾 템플릿 저장"}
        </button>
      </div>

      {/* 안내 메시지 */}
      <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-2">💡 템플릿 작동 방식</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 매일 자정(00:01)에 자동으로 다음날 재고 폼이 생성됩니다</li>
          <li>• 전날 마감 재고가 자동으로 당일 예상 재고로 복사됩니다</li>
          <li>• 직원은 당일과 전날 재고만 입력/수정할 수 있습니다</li>
          <li>• 관리자는 모든 날짜의 재고를 확인할 수 있습니다</li>
          <li>• 재고 차이가 발생하면 승인 요청이 필요합니다</li>
        </ul>
      </div>
    </div>
  );
}
