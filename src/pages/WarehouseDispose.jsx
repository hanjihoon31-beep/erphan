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
       className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#ef4444_0%,_transparent_55%)] opacity-60" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-rose-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-2xl">
        <div className="rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur">
          <div className="mb-6 text-center">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Dispose</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">폐기 요청</h2>
            <p className="mt-2 text-sm text-slate-300">
              안전한 폐기를 위해 정확한 정보와 사유를 기록해 주세요. 승인 후 즉시 로그에 반영됩니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              창고 선택
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-rose-400 focus:outline-none"
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
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-rose-400 focus:outline-none"
                  placeholder="예: 손상된 장비"
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                폐기 수량
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-rose-400 focus:outline-none"
                  placeholder="예: 2"
                />
              </label>
            </div>

            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              폐기 사유
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-100 focus:border-rose-400 focus:outline-none"
                placeholder="폐기 필요 사유"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
              사진 첨부 (선택)
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-2 w-full text-sm text-slate-200 file:mr-4 file:rounded-full file:border-0 file:bg-rose-500/80 file:px-4 file:py-2 file:text-xs file:font-semibold hover:file:bg-rose-500"
              />
            </label>
            {preview && (
              <img src={preview} alt="미리보기" className="h-48 w-full rounded-2xl border border-white/10 object-cover" />
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
                loading
                  ? "bg-slate-700"
                  : "bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 shadow-lg shadow-rose-500/30 hover:translate-y-[-1px]"
              }`}
            >
              {loading ? "등록 중..." : "폐기 요청하기"}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
};

export default WarehouseDispose;
