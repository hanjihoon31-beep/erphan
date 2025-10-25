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
    <motion.div className="p-6 bg-gray-50 min-h-screen" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="text-3xl font-bold mb-6 text-center">📊 통합 재고 대시보드</h2>

      {/* 필터 영역 */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
        {/* 날짜 선택 */}
        <div className="flex gap-2 items-center">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 rounded-lg" />
          <span>~</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 rounded-lg" />
        </div>

        {/* 유형 및 창고 필터 */}
        <div className="flex gap-2">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="border p-2 rounded-lg">
            <option>전체</option>
            <option>입고</option>
            <option>출고</option>
            <option>폐기</option>
            <option>반납</option>
          </select>
          <select value={warehouseFilter} onChange={(e) => setWarehouseFilter(e.target.value)} className="border p-2 rounded-lg">
            <option>전체</option>
            <option>외부창고(사무실)</option>
            <option>내부창고(암담)</option>
            <option>내부창고(버거)</option>
            <option>냉동창고</option>
          </select>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={onlyPending} onChange={() => setOnlyPending(!onlyPending)} />
            승인 대기만 보기
          </label>
        </div>

        {/* 검색 & 내보내기 */}
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="🔍 품목명 또는 창고 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border p-2 rounded-lg w-64"
          />
          <button onClick={exportToCSV} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            ⬇ CSV
          </button>
          <button onClick={exportToPDF} className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600">
            📄 PDF
          </button>
        </div>
      </div>

      {/* 그래프 */}
      <div className="bg-white rounded-2xl shadow mb-8 p-6">
        <h3 className="text-lg font-semibold mb-3">📈 입·출·폐기·반납 현황</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={[
              { name: "입고", 수량: stats.inbound },
              { name: "출고", 수량: stats.outbound },
              { name: "폐기", 수량: stats.dispose },
              { name: "반납", 수량: stats.returned },
            ]}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="수량" fill="#3498db" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto bg-white rounded-2xl shadow relative">
        <table className="w-full text-sm text-gray-700">
          <thead className="bg-gray-100">
            <tr className="text-left">
              <th className="p-3">유형</th>
              <th className="p-3">창고</th>
              <th className="p-3">품목명</th>
              <th className="p-3">수량</th>
              <th className="p-3">사유</th>
              <th className="p-3">날짜</th>
              <th className="p-3">상태</th>
              <th className="p-3 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {filteredInventory.length > 0 ? (
              filteredInventory.map((item) => (
                <tr key={item._id || item.id} className="border-b hover:bg-gray-50 cursor-pointer">
                  <td className="p-3 font-bold">{item.type}</td>
                  <td className="p-3">{item.warehouse}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3">{item.quantity}</td>
                  <td className="p-3">{item.reason || "-"}</td>
                  <td className="p-3">{new Date(item.date).toLocaleString("ko-KR")}</td>
                  <td
                    className={`p-3 font-semibold ${
                      item.status === "승인"
                        ? "text-green-600"
                        : item.status === "반려"
                        ? "text-red-500"
                        : "text-gray-500"
                    }`}
                  >
                    {item.status || "대기"}
                  </td>
                  <td className="p-3 text-right space-x-2">
                    {item.status === "대기" && (
                      <>
                        <button
                          onClick={() => handleApprove(item._id || item.id)}
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          승인
                        </button>
                        <button
                          onClick={() => handleReject(item._id || item.id)}
                          className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          반려
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleDelete(item._id || item.id)}
                      className="text-gray-500 hover:text-red-500 ml-2"
                    >
                      삭제
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center p-6 text-gray-500">
                  표시할 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};

export default WarehouseInventory;
