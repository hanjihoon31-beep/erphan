import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const WarehouseInbound = () => {
  const { user } = useAuth();
  const [warehouse, setWarehouse] = useState("외부창고(사무실)");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !quantity) return alert("품목명과 수량을 입력해주세요.");

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("warehouse", warehouse);
      formData.append("name", itemName);
      formData.append("quantity", quantity);
      formData.append("reason", reason);
      formData.append("status", user.role === "employee" ? "대기" : "승인됨");
      formData.append("userRole", user.role);
      formData.append("type", "입고");
      if (image) formData.append("file", image);

      const res = await axios.post("http://localhost:3001/api/inventory/inbound", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        alert(
          user.role === "employee"
            ? "입고 요청이 등록되었습니다. (관리자 승인 대기)"
            : "입고가 즉시 등록되었습니다."
        );
        setItemName("");
        setQuantity("");
        setReason("");
        setImage(null);
        setPreview(null);
      }
    } catch (err) {
      console.error(err);
      alert("입고 요청 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="p-6 max-w-xl mx-auto bg-white rounded-2xl shadow-md mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">📦 입고 요청</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 창고 선택 */}
        <select
          value={warehouse}
          onChange={(e) => setWarehouse(e.target.value)}
          className="w-full border rounded-lg p-2"
        >
          <option>외부창고(사무실)</option>
          <option>내부창고(암담)</option>
          <option>내부창고(버거)</option>
          <option>냉동창고</option>
        </select>

        <input
          type="text"
          placeholder="품목명"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
        <input
          type="number"
          placeholder="수량"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
        <input
          type="text"
          placeholder="사유"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded-lg p-2"
        />
        <input type="file" onChange={(e) => setImage(e.target.files[0])} />
        {preview && <img src={preview} alt="미리보기" className="mt-3 w-full h-48 object-cover" />}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 mt-4 rounded-lg text-white font-bold transition ${
            loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {loading ? "등록 중..." : "입고 요청하기"}
        </button>
      </form>
    </motion.div>
  );
};

export default WarehouseInbound;
