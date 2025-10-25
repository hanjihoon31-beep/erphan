// src/context/InventoryContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const InventoryContext = createContext();
export default InventoryContext;

export function useInventory() {
  return useContext(InventoryContext);
}

export function InventoryProvider({ children }) {
  const { user } = useAuth();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = io("http://localhost:3001");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get("http://localhost:3001/api/inventory");
        if (res.data.success) setInventory(res.data.inventory);
      } catch (err) {
        console.error("❌ 재고 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    socket.on("inventory_update", (updated) => setInventory(updated));
    return () => socket.disconnect();
  }, []);

  // ✅ 승인 또는 즉시 등록 로직
  const submitInventory = async (type, formData) => {
    try {
      const endpoint = {
        입고: "inbound",
        출고: "outbound",
        폐기: "dispose",
        반납: "return",
      }[type];

      // 일반 직원은 승인 대기로 저장
      if (user?.role === "employee") {
        const pendingReq = {
          ...Object.fromEntries(formData.entries()),
          type,
          status: "대기",
          requestedBy: user.name,
          date: new Date().toISOString(),
        };
        const prev = JSON.parse(localStorage.getItem("pendingRequests")) || [];
        localStorage.setItem("pendingRequests", JSON.stringify([...prev, pendingReq]));
        alert("✅ 승인 요청이 등록되었습니다. 관리자 승인 후 처리됩니다.");
        return;
      }

      // 관리자 이상은 즉시 처리
      const res = await axios.post(
        `http://localhost:3001/api/inventory/${endpoint}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      if (res.data.success) {
        setInventory((prev) => [...prev, res.data.item]);
        alert(`✅ ${type} 등록이 완료되었습니다!`);
      } else {
        alert("❌ 등록 실패");
      }
    } catch (err) {
      console.error(`${type} 등록 오류:`, err);
      alert(`${type} 등록 중 오류가 발생했습니다.`);
    }
  };

  const deleteItem = async (id) => {
    try {
      await axios.delete(`http://localhost:3001/api/inventory/${id}`);
      setInventory((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      console.error("삭제 실패:", err);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        inventory,
        loading,
        submitInventory,
        deleteItem,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
}
