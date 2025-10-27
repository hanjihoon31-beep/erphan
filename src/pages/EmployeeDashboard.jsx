// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchMyRequests();
  }, [user]);

  const fetchMyRequests = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/inventory/user/${user.id}`);
      if (res.data.success) {
        setRequests(res.data.items);
      }
    } catch (err) {
      console.error("내 요청 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        요청 내역을 불러오는 중입니다...
      </div>
    );

  return (
    <motion.div
      className="relative min-h-screen overflow-hidden bg-slate-950 px-6 py-10 text-slate-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_#1e3a8a_0%,_transparent_55%)] opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-emerald-500/20 blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8">
        <header className="text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-slate-400">My Activity</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">내 요청 현황</h2>
          <p className="mt-2 text-sm text-slate-300">
            입출고·반납·폐기 요청이 한 눈에 정리됩니다. 진행 상태와 관리자 피드백을 실시간으로 확인하세요.
          </p>
        </header>

        {requests.length === 0 ? (
          <p className="rounded-3xl border border-dashed border-white/10 bg-white/5 py-16 text-center text-sm text-slate-400">
            아직 등록된 요청이 없습니다.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {requests.map((req) => (
              <motion.div
                key={req._id}
                className="rounded-3xl border border-white/5 bg-white/5 p-5 text-sm text-slate-200 backdrop-blur"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-semibold text-white">[{req.type}] {req.name}</p>
                    <p className="mt-2 text-xs text-slate-300">창고 {req.warehouse}</p>
                    <p className="text-xs text-slate-300">수량 {req.quantity}개</p>
                    <p className="text-xs text-slate-400">사유: {req.reason || "없음"}</p>
                    <p className="mt-2 text-[11px] text-slate-400">
                      요청일 {new Date(req.date).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  {req.image && (
                    <img
                      src={`http://localhost:3001${req.image}`}
                      alt="첨부 이미지"
                      className="h-16 w-16 rounded-2xl border border-white/10 object-cover"
                    />
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <span
                    className={`inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold ${
                      req.status === "승인"
                        ? "bg-emerald-500/20 text-emerald-200"
                        : req.status === "거부"
                        ? "bg-rose-500/20 text-rose-200"
                        : "bg-amber-500/20 text-amber-200"
                    }`}
                  >
                    {req.status}
                  </span>
                  {req.rejectReason && (
                    <p className="text-[11px] text-rose-300">거부 사유: {req.rejectReason}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
