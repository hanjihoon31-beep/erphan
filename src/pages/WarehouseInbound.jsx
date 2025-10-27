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
    <motion.div
      className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#1d4ed8_0%,_transparent_55%)] opacity-70" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-sky-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Inbound</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">입고 요청</h2>
            <p className="mt-2 text-sm text-slate-300">
              창고로 들어오는 물품을 등록하면 관리자가 실시간으로 확인합니다. 사진 첨부 시 검수 속도가 향상됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              창고 선택
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
              >
                <option>외부창고(사무실)</option>
                <option>내부창고(암담)</option>
                <option>내부창고(버거)</option>
                <option>냉동창고</option>
              </select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                품목명
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
                  placeholder="예: 프린터 토너"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                수량
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
                  placeholder="예: 15"
                />
              </label>
            </div>

            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              사유 및 비고
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
                placeholder="사용 용도 또는 참고 메모"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              사진 첨부 (선택)
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-2 w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-500/80 file:px-4 file:py-2 file:text-xs file:font-semibold hover:file:bg-indigo-500"
              />
            </label>
            {preview && (
              <img
                src={preview}
                alt="미리보기"
                className="h-48 w-full rounded-2xl border border-white/10 object-cover"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                loading
                  ? "bg-slate-700"
                  : "bg-gradient-to-r from-indigo-500 via-blue-500 to-cyan-500 shadow-lg shadow-indigo-500/30 hover:translate-y-[-1px]"
              }`}
            >
              {loading ? "등록 중..." : "입고 요청하기"}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default WarehouseInbound;
