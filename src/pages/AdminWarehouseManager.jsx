// src/pages/AdminWarehouseManager.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

const AdminWarehouseManager = () => {
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [warehouse, setWarehouse] = useState("외부창고(사무실)");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterWarehouse, setFilterWarehouse] = useState("전체");

  // ✅ 초기 데이터 및 실시간 반영
  useEffect(() => {
    const loadData = async () => {
      const [invRes, logRes] = await Promise.all([
        axios.get("http://localhost:3001/api/inventory"),
        axios.get("http://localhost:3001/api/logs"),
      ]);
      setItems(invRes.data.inventory);
      setLogs(logRes.data.logs);
    };
    loadData();

    socket.on("inventory_update", (data) => {
      console.log("📡 실시간 반영됨");
      setItems(data);
    });

    return () => socket.disconnect();
  }, []);

  // ✅ 이미지 업로드
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // ✅ 등록 / 수정
  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("warehouse", warehouse);
    formData.append("name", itemName);
    formData.append("quantity", quantity);
    formData.append("reason", reason);
    if (image) formData.append("file", image);

    if (editingItem) {
      await axios.put(`http://localhost:3001/api/inventory/${editingItem._id}`, {
        warehouse,
        name: itemName,
        quantity,
        reason,
        image: editingItem.image,
      });
      setEditingItem(null);
    } else {
      await axios.post("http://localhost:3001/api/inventory/inbound", formData);
    }

    setItemName("");
    setQuantity("");
    setReason("");
    setImage(null);
    setImagePreview(null);
  };

  // ✅ 삭제
  const handleDelete = async (id) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await axios.delete(`http://localhost:3001/api/inventory/${id}`);
    }
  };

  // ✅ 수정 모드
  const handleEdit = (item) => {
    setEditingItem(item);
    setWarehouse(item.warehouse);
    setItemName(item.name);
    setQuantity(item.quantity);
    setReason(item.reason);
    setImagePreview(item.image);
  };

  // ✅ 필터링
  const filtered = items.filter((i) => {
    const matchName = i.name?.includes(searchTerm);
    const matchWarehouse =
      filterWarehouse === "전체" || i.warehouse === filterWarehouse;
    return matchName && matchWarehouse;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-bold mb-4 text-center">
        🏢 관리자 창고 관리 (MongoDB + 로그 기록)
      </h2>

      {/* 등록 폼 */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-6 rounded-2xl shadow-md space-y-4 max-w-3xl mx-auto"
      >
        <div className="grid grid-cols-2 gap-4">
          <select
            value={warehouse}
            onChange={(e) => setWarehouse(e.target.value)}
            className="border p-2 rounded"
          >
            <option>외부창고(사무실)</option>
            <option>내부창고(암담)</option>
            <option>내부창고(버거)</option>
            <option>냉동창고</option>
          </select>

          <input
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            className="border p-2 rounded"
            placeholder="품목명"
            required
          />
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="border p-2 rounded"
            placeholder="수량"
            required
          />
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="border p-2 rounded"
            placeholder="사유"
          />
          <div className="col-span-2">
            <input type="file" onChange={handleImageChange} />
            {imagePreview && (
              <img
                src={`http://localhost:3001${imagePreview}`}
                alt="preview"
                className="mt-2 w-24 h-24 object-cover rounded"
              />
            )}
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700"
        >
          {editingItem ? "수정 완료" : "등록하기"}
        </button>
      </motion.form>

      {/* 검색/필터 */}
      <div className="flex justify-between items-center max-w-4xl mx-auto mt-6">
        <input
          type="text"
          placeholder="🔍 품목명 검색"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border rounded p-2 w-1/2"
        />
        <select
          value={filterWarehouse}
          onChange={(e) => setFilterWarehouse(e.target.value)}
          className="border rounded p-2"
        >
          <option>전체</option>
          <option>외부창고(사무실)</option>
          <option>내부창고(암담)</option>
          <option>내부창고(버거)</option>
          <option>냉동창고</option>
        </select>
      </div>

      {/* 재고 목록 */}
      <div className="max-w-4xl mx-auto mt-6 space-y-3">
        {filtered.map((i) => (
          <div
            key={i._id}
            className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm"
          >
            <div className="flex items-center space-x-4">
              {i.image && (
                <img
                  src={`http://localhost:3001${i.image}`}
                  alt={i.name}
                  className="w-14 h-14 rounded object-cover"
                />
              )}
              <div>
                <p className="font-bold">{i.name}</p>
                <p className="text-sm text-gray-600">
                  {i.warehouse} / {i.quantity}개 / {i.reason || "-"}
                </p>
              </div>
            </div>
            <div className="space-x-3">
              <button
                onClick={() => handleEdit(i)}
                className="text-blue-500 hover:underline"
              >
                수정
              </button>
              <button
                onClick={() => handleDelete(i._id)}
                className="text-red-500 hover:underline"
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 로그 내역 */}
      <div className="max-w-5xl mx-auto mt-10 bg-white rounded-2xl shadow p-5">
        <h3 className="text-lg font-semibold mb-3">🧾 변경 이력</h3>
        <div className="max-h-64 overflow-y-auto text-sm space-y-2">
          {logs.map((log, idx) => (
            <div key={idx} className="border-b pb-1">
              <span className="font-semibold">{log.action}</span> —{" "}
              {log.itemName} ({log.warehouse})  
              <span className="text-gray-500 ml-2">
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminWarehouseManager;
