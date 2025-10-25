import React from "react";
import { API_URL } from "../config/api";

export default function WarehouseItemCard({ item, onEdit, onDelete }) {
  return (
    <div className="border rounded-lg p-3 shadow-sm flex flex-col gap-2 bg-white hover:shadow-md transition">
      {item.photo && (
        <img
          src={`${API_URL}${item.photo}`}
          alt={item.name}
          className="w-full h-32 object-cover rounded-md"
        />
      )}
      <div className="font-semibold text-lg">{item.name}</div>
      <div className="text-sm text-gray-600">
        수량: {item.qty} {item.unit}
      </div>
      {item.desc && <div className="text-xs text-gray-500">{item.desc}</div>}

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => onEdit(item)}
          className="flex-1 bg-blue-500 text-white py-1 rounded hover:bg-blue-600"
        >
          수정
        </button>
        <button
          onClick={() => onDelete(item)}
          className="flex-1 bg-red-500 text-white py-1 rounded hover:bg-red-600"
        >
          삭제
        </button>
      </div>
    </div>
  );
}
