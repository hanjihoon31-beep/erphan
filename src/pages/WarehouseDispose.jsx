import React, { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const WarehouseDispose = () => {
  const { user } = useAuth();
  const [warehouse, setWarehouse] = useState("외부창고(사무실)");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

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
      formData.append("type", "폐기");
      formData.append("userRole", user?.role || 3);
      formData.append("userId", user?.id || "unknown");
      if (image) formData.append("file", image);

      const res = await axios.post("http://localhost:3001/api/inventory/dispose", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        if (user.role === 3) alert("🗑 폐기 요청이 관리자 승인 대기로 등록되었습니다.");
        else alert("🗑 폐기가 즉시 처리되었습니다.");
        setItemName("");
        setQuantity("");
        setReason("");
        setImage(null);
        setPreview(null);
      } else alert("서버 응답 오류");
    } catch (err) {
      console.error(err);
      alert("폐기 요청 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="p-6 max-w-xl mx-auto bg-white rounded-2xl shadow-md mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="text-2xl font-bold mb-6 text-center">🗑 폐기 요청</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className="w-full border rounded-lg p-2">
          <option>외부창고(사무실)</option>
          <option>내부창고(암담)</option>
          <option>내부창고(버거)</option>
          <option>냉동창고</option>
        </select>

        <input type="text" placeholder="품목명" value={itemName} onChange={(e) => setItemName(e.target.value)} className="w-full border rounded-lg p-2" />
        <input type="number" placeholder="폐기 수량" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border rounded-lg p-2" />
        <input type="text" placeholder="폐기 사유" value={reason} onChange={(e) => setReason(e.target.value)} className="w-full border rounded-lg p-2" />

        <input type="file" accept="image/*" onChange={handleImageChange} />
        {preview && <img src={preview} alt="미리보기" className="mt-3 w-full h-48 object-cover rounded-xl border" />}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 mt-4 rounded-lg text-white font-bold transition ${loading ? "bg-gray-400" : "bg-red-500 hover:bg-red-600"}`}
        >
          {loading ? "등록 중..." : "폐기 요청하기"}
        </button>
      </form>
    </motion.div>
  );
};

export default WarehouseDispose;
