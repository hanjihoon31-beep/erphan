// src/pages/WarehouseInventory.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { io } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import jsPDF from "jspdf";
import "jspdf-autotable";

const WarehouseInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [filterType, setFilterType] = useState("전체");
  const [warehouseFilter, setWarehouseFilter] = useState("전체");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [detailItem, setDetailItem] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    inbound: 0,
    outbound: 0,
    dispose: 0,
    returned: 0,
  });

  // ✅ 서버 + 소켓 연결
  useEffect(() => {
    fetchInventory();
    const socket = io("http://localhost:3001");
    socket.on("inventory_update", (updated) => {
      setInventory(updated);
    });
    return () => socket.disconnect();
  }, []);

  // ✅ 전체 재고 불러오기
  const fetchInventory = async () => {
    try {
      const res = await axios.get("http://localhost:3001/api/inventory");
      if (res.data.success) setInventory(res.data.inventory);
    } catch (err) {
      console.error("❌ 재고 로드 실패:", err);
    }
  };

  // ✅ 승인 / 반려 처리
  const handleApprove = async (id) => {
    if (!window.confirm("이 항목을 승인하시겠습니까?")) return;
    try {
      await axios.patch(`http://localhost:3001/api/inventory/${id}/approve`);
      fetchInventory();
    } catch (err) {
      console.error("승인 실패:", err);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("이 항목을 반려하시겠습니까?")) return;
    try {
      await axios.patch(`http://localhost:3001/api/inventory/${id}/reject`);
      fetchInventory();
    } catch (err) {
      console.error("반려 실패:", err);
    }
  };

  // ✅ 삭제
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      console.error("삭제 실패:", err);
    }
  };

  // ✅ 필터 적용
  const applyFilters = () => {
    let filtered = [...inventory];

    // 날짜 필터
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filtered = filtered.filter((i) => {
        const d = new Date(i.date);
        return d >= start && d <= end;
      });
    }

    // 유형 필터
    if (filterType !== "전체") filtered = filtered.filter((i) => i.type === filterType);

    // 창고 필터
    if (warehouseFilter !== "전체")
      filtered = filtered.filter((i) => i.warehouse === warehouseFilter);

    // 승인 대기 필터
    if (onlyPending) filtered = filtered.filter((i) => i.status === "대기");

    // 검색 필터
    if (search.trim()) {
      const keyword = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(keyword) ||
          i.warehouse.toLowerCase().includes(keyword)
      );
    }

    setFilteredInventory(filtered);
    updateStats(filtered);
  };

  // ✅ 통계
  const updateStats = (data) => {
    const inbound = data.filter((i) => i.type === "입고").length;
    const outbound = data.filter((i) => i.type === "출고").length;
    const dispose = data.filter((i) => i.type === "폐기").length;
    const returned = data.filter((i) => i.type === "반납").length;
    setStats({ total: data.length, inbound, outbound, dispose, returned });
  };

  // ✅ CSV & PDF 내보내기
  const exportToCSV = () => {
    if (filteredInventory.length === 0) return alert("내보낼 데이터가 없습니다.");
    const headers = ["유형", "창고", "품목명", "수량", "사유", "날짜", "상태"];
    const rows = filteredInventory.map((i) => [
      i.type,
      i.warehouse,
      i.name,
      i.quantity,
      i.reason || "-",
      new Date(i.date).toLocaleString("ko-KR"),
      i.status || "대기",
    ]);
    const csv =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `warehouse_inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const exportToPDF = () => {
    if (filteredInventory.length === 0) return alert("PDF로 내보낼 데이터가 없습니다.");
    const doc = new jsPDF("l", "mm", "a4");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("📦 창고 통합 재고 리포트", 14, 15);
    const tableData = filteredInventory.map((i) => [
      i.type,
      i.warehouse,
      i.name,
      i.quantity,
      i.reason || "-",
      new Date(i.date).toLocaleString("ko-KR"),
      i.status || "대기",
    ]);
    doc.autoTable({
      head: [["유형", "창고", "품목명", "수량", "사유", "날짜", "상태"]],
      body: tableData,
      startY: 30,
      theme: "striped",
      headStyles: { fillColor: [41, 128, 185] },
    });
    doc.save(`warehouse_inventory_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  useEffect(() => {
    applyFilters();
  }, [inventory, filterType, warehouseFilter, search, startDate, endDate, onlyPending]);

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#3730a3_0%,_transparent_55%)] opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col gap-8">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Inventory Intelligence</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">통합 재고 대시보드</h2>
          <p className="mt-2 text-sm text-slate-300">
            창고별 이동 현황과 승인 상태를 최신 UI로 정리했습니다. 필요한 자료는 즉시 내보낼 수 있습니다.
          </p>
        </header>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
              />
              <span className="text-xs text-slate-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
              >
                <option>전체</option>
                <option>입고</option>
                <option>출고</option>
                <option>폐기</option>
                <option>반납</option>
              </select>
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
              >
                <option>전체</option>
                <option>외부창고(사무실)</option>
                <option>내부창고(암담)</option>
                <option>내부창고(버거)</option>
                <option>냉동창고</option>
              </select>
              <label className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
                <input
                  type="checkbox"
                  className="accent-indigo-500"
                  checked={onlyPending}
                  onChange={() => setOnlyPending(!onlyPending)}
                />
                승인 대기만 보기
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="text"
                placeholder="🔍 품목명 또는 창고 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full max-w-xs rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-slate-100 focus:border-indigo-400 focus:outline-none"
              />
              <button
                onClick={exportToCSV}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30 transition hover:translate-y-[-1px]"
              >
                ⬇ CSV
              </button>
              <button
                onClick={exportToPDF}
                className="rounded-2xl bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-500/30 transition hover:translate-y-[-1px]"
              >
                📄 PDF
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 backdrop-blur">
          <h3 className="text-lg font-semibold text-white">📈 입·출·폐기·반납 현황</h3>
          <p className="mt-1 text-xs text-slate-400">재고 이동량을 시각화하여 변화를 빠르게 확인하세요.</p>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { name: "입고", 수량: stats.inbound },
                  { name: "출고", 수량: stats.outbound },
                  { name: "폐기", 수량: stats.dispose },
                  { name: "반납", 수량: stats.returned },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="name" stroke="#cbd5f5" />
                <YAxis stroke="#cbd5f5" />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderRadius: 12, border: "1px solid rgba(148,163,184,0.25)", color: "#e2e8f0" }} />
                <Legend wrapperStyle={{ color: "#cbd5f5" }} />
                <Bar dataKey="수량" fill="url(#inventoryBar)" radius={[10, 10, 0, 0]} />
                <defs>
                  <linearGradient id="inventoryBar" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/10 backdrop-blur">
          <table className="w-full text-sm text-slate-200">
            <thead className="bg-white/5 text-xs uppercase tracking-wide text-slate-400">
              <tr className="text-left">
                <th className="px-4 py-3">유형</th>
                <th className="px-4 py-3">창고</th>
                <th className="px-4 py-3">품목명</th>
                <th className="px-4 py-3">수량</th>
                <th className="px-4 py-3">사유</th>
                <th className="px-4 py-3">날짜</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length > 0 ? (
                filteredInventory.map((item) => (
                  <tr
                    key={item._id || item.id}
                    className="border-t border-white/5 transition hover:bg-white/5"
                  >
                    <td className="px-4 py-3 font-semibold text-white">{item.type}</td>
                    <td className="px-4 py-3 text-slate-200">{item.warehouse}</td>
                    <td className="px-4 py-3 text-slate-200">{item.name}</td>
                    <td className="px-4 py-3 text-slate-200">{item.quantity}</td>
                    <td className="px-4 py-3 text-slate-400">{item.reason || "-"}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(item.date).toLocaleString("ko-KR")}</td>
                    <td
                      className={`px-4 py-3 font-semibold ${
                        item.status === "승인"
                          ? "text-emerald-300"
                          : item.status === "반려"
                          ? "text-rose-300"
                          : "text-amber-300"
                      }`}
                    >
                      {item.status || "대기"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.status === "대기" && (
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(item._id || item.id)}
                            className="rounded-xl bg-emerald-500/80 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-500"
                          >
                            승인
                          </button>
                          <button
                            onClick={() => handleReject(item._id || item.id)}
                            className="rounded-xl bg-rose-500/80 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-500"
                          >
                            반려
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleDelete(item._id || item.id)}
                        className="ml-3 text-xs text-slate-400 transition hover:text-rose-300"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-sm text-slate-400">
                    표시할 데이터가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
};

export default WarehouseInventory;
