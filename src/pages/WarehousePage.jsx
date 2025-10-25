// src/pages/WarehousePage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./WarehousePage.css";

export default function WarehousePage() {
  const navigate = useNavigate();

  const [inbound, setInbound] = useState([]);
  const [outbound, setOutbound] = useState([]);
  const [dispose, setDispose] = useState([]);
  const [returns, setReturns] = useState([]);

  useEffect(() => {
    setInbound(JSON.parse(localStorage.getItem("inboundItems")) || []);
    setOutbound(JSON.parse(localStorage.getItem("outboundItems")) || []);
    setDispose(JSON.parse(localStorage.getItem("disposedItems")) || []);
    setReturns(JSON.parse(localStorage.getItem("returnedItems")) || []);
  }, []);

  const renderItemList = (items) => {
    if (items.length === 0)
      return <p className="empty">등록된 내역이 없습니다.</p>;

    return items.slice(-3).map((item) => (
      <div key={item.id} className="item-preview">
        {item.photo && <img src={item.photo} alt={item.name} />}
        <div className="item-info">
          <h4>{item.name}</h4>
          <p>수량: {item.quantity}개</p>
          <p className="status">
            상태:{" "}
            <span
              className={
                item.status === "approved" ? "status-approved" : "status-pending"
              }
            >
              {item.status === "approved" ? "승인됨" : "대기중"}
            </span>
          </p>
        </div>
      </div>
    ));
  };

  return (
    <div className="warehouse-container">
      <h1>🏭 창고 관리 시스템</h1>

      <div className="warehouse-grid">
        {/* 입고 */}
        <div className="warehouse-card">
          <h2>📥 입고 내역</h2>
          {renderItemList(inbound)}
          <button onClick={() => navigate("/warehouse/inbound")}>
            입고 관리로 이동 →
          </button>
        </div>

        {/* 출고 */}
        <div className="warehouse-card">
          <h2>📤 출고 내역</h2>
          {renderItemList(outbound)}
          <button onClick={() => navigate("/warehouse/outbound")}>
            출고 관리로 이동 →
          </button>
        </div>

        {/* 폐기 */}
        <div className="warehouse-card">
          <h2>🗑️ 폐기 내역</h2>
          {renderItemList(dispose)}
          <button onClick={() => navigate("/warehouse/dispose")}>
            폐기 관리로 이동 →
          </button>
        </div>

        {/* 반납 */}
        <div className="warehouse-card">
          <h2>🔁 반납 내역</h2>
          {renderItemList(returns)}
          <button onClick={() => navigate("/warehouse/return")}>
            반납 관리로 이동 →
          </button>
        </div>
      </div>
    </div>
  );
}
