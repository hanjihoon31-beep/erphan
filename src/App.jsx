import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { InventoryProvider } from "./context/InventoryContext";

// ✅ 새 페이지들
import ApprovalPage from "./pages/ApprovalPage";
import ManagePage from "./pages/ManagePage";
import InventoryPage from "./pages/InventoryPage";

// 📄 기존 ERP 페이지들
import LoginPage from "./pages/LoginPage";
import Erphan from "./pages/Erphan";
import WarehouseInbound from "./pages/WarehouseInbound";
import WarehouseOutbound from "./pages/WarehouseOutbound";
import WarehouseReturn from "./pages/WarehouseReturn";
import WarehouseDispose from "./pages/WarehouseDispose";
import WarehouseInventory from "./pages/WarehouseInventory";
import AdminApproval from "./pages/AdminApproval";
import AdminLogManager from "./pages/AdminLogManager";
import AdminRoleManager from "./pages/AdminRoleManager";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import DailyCashManagement from "./pages/DailyCashManagement";
import VoucherManagement from "./pages/VoucherManagement";
import DailyInventoryForm from "./pages/DailyInventoryForm";
import DailyInventoryTemplate from "./pages/DailyInventoryTemplate";
import AttendanceCheck from "./pages/AttendanceCheck";
import AttendanceModification from "./pages/AttendanceModification";
import AttendanceSettings from "./pages/AttendanceSettings";
import PayrollManagement from "./pages/PayrollManagement";
import EquipmentManagement from "./pages/EquipmentManagement";
import ProductDisposalManagement from "./pages/ProductDisposalManagement";
import Sidebar from "./components/Sidebar";

// ✅ 보호 라우트
function PrivateRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user.role)) {
    if (user.role === "employee") return <Navigate to="/erp/employee/dashboard" replace />;
    return <Navigate to="/erp/admin/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <InventoryProvider>
          {/* 상단 네비게이션 */}
          <div className="flex gap-2 p-3 border-b mb-4 bg-white shadow-sm">
            <Link to="/approval" className="px-3 py-2 rounded hover:underline">승인</Link>
            <Link to="/manage" className="px-3 py-2 rounded hover:underline">관리</Link>
            <Link to="/inventory" className="px-3 py-2 rounded hover:underline">재고</Link>
          </div>

          <Routes>
            {/* 로그인 */}
            <Route path="/" element={<LoginPage />} />

            {/* ERP 메인 */}
            <Route
              path="/erp"
              element={
                <PrivateRoute roles={["employee", "admin", "superadmin"]}>
                  <Erphan />
                </PrivateRoute>
              }
            />

            {/* 관리자 페이지 */}
            <Route
              path="/erp/admin/*"
              element={
                <PrivateRoute roles={["admin", "superadmin"]}>
                  <div className="flex min-h-screen">
                    <Sidebar />
                    <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
                      <Routes>
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="approval" element={<AdminApproval />} />
                        <Route path="roles" element={<AdminRoleManager />} />
                        <Route path="logs" element={<AdminLogManager />} />
                        <Route path="daily-cash" element={<DailyCashManagement />} />
                        <Route path="vouchers" element={<VoucherManagement />} />
                        <Route path="daily-inventory" element={<DailyInventoryForm />} />
                        <Route path="daily-inventory-template" element={<DailyInventoryTemplate />} />
                        <Route path="attendance-check" element={<AttendanceCheck />} />
                        <Route path="attendance-modification" element={<AttendanceModification />} />
                        <Route path="attendance-settings" element={<AttendanceSettings />} />
                        <Route path="payroll" element={<PayrollManagement />} />
                        <Route path="equipment" element={<EquipmentManagement />} />
                        <Route path="disposal" element={<ProductDisposalManagement />} />
                        <Route path="*" element={<Navigate to="dashboard" replace />} />
                      </Routes>
                    </div>
                  </div>
                </PrivateRoute>
              }
            />

            {/* 직원 페이지 */}
            <Route
              path="/erp/employee/dashboard"
              element={
                <PrivateRoute roles={["employee"]}>
                  <EmployeeDashboard />
                </PrivateRoute>
              }
            />

            {/* 창고 관련 */}
            <Route
              path="/erp/warehouse/inbound"
              element={<PrivateRoute roles={["employee", "admin", "superadmin"]}><WarehouseInbound /></PrivateRoute>}
            />
            <Route
              path="/erp/warehouse/outbound"
              element={<PrivateRoute roles={["employee", "admin", "superadmin"]}><WarehouseOutbound /></PrivateRoute>}
            />
            <Route
              path="/erp/warehouse/return"
              element={<PrivateRoute roles={["employee", "admin", "superadmin"]}><WarehouseReturn /></PrivateRoute>}
            />
            <Route
              path="/erp/warehouse/dispose"
              element={<PrivateRoute roles={["employee", "admin", "superadmin"]}><WarehouseDispose /></PrivateRoute>}
            />
            <Route
              path="/erp/warehouse/inventory"
              element={<PrivateRoute roles={["employee", "admin", "superadmin"]}><WarehouseInventory /></PrivateRoute>}
            />

            {/* 새로 추가된 3개 페이지 */}
            <Route path="/approval" element={<ApprovalPage />} />
            <Route path="/manage" element={<ManagePage />} />
            <Route path="/inventory" element={<InventoryPage />} />

            {/* 존재하지 않는 경로 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </InventoryProvider>
      </AuthProvider>
    </Router>
  );
}
