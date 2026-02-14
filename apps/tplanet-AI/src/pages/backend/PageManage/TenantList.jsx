import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PROTECTED_TENANTS = new Set(["default", "multi-tenant"]);

const TenantList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_HOST_URL_TPLANET}/api/tenant/list`
      );
      if (!response.ok) throw new Error("Failed to load tenants");
      const data = await response.json();
      setTenants(data.tenants || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tenantId) => {
    if (PROTECTED_TENANTS.has(tenantId)) {
      alert(`站台 "${tenantId}" 為系統保留站台，無法刪除`);
      return;
    }
    if (!confirm(`確定要刪除站台 "${tenantId}" 嗎？`)) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_HOST_URL_TPLANET}/api/tenant/${tenantId}`,
        { method: "DELETE" }
      );
      if (response.ok) {
        loadTenants();
      } else {
        const result = await response.json().catch(() => ({}));
        alert(result.error || "刪除失敗");
      }
    } catch (e) {
      alert("刪除失敗: " + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">載入中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500">錯誤: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">站台管理</h1>
        <button
          onClick={() => navigate("/backend/tenant/create")}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <span>+</span>
          <span>新增站台</span>
        </button>
      </div>

      {tenants.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">尚無站台</p>
          <button
            onClick={() => navigate("/backend/tenant/create")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            建立第一個站台
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tenants.map((tenant) => (
            <div
              key={tenant.tenantId}
              className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {/* Color preview */}
                <div className="flex gap-1">
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: tenant.primaryColor }}
                    title="主色"
                  />
                  <div
                    className="w-8 h-8 rounded"
                    style={{ backgroundColor: tenant.secondaryColor }}
                    title="輔助色"
                  />
                </div>

                <div>
                  <h3 className="font-bold text-lg">{tenant.name}</h3>
                  <p className="text-gray-500 text-sm">ID: {tenant.tenantId}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    tenant.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {tenant.isActive ? "啟用" : "停用"}
                </span>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/backend/tenant/${tenant.tenantId}/edit`)}
                    className="px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                  >
                    編輯
                  </button>
                  <button
                    onClick={() => handleDelete(tenant.tenantId)}
                    disabled={PROTECTED_TENANTS.has(tenant.tenantId)}
                    title={
                      PROTECTED_TENANTS.has(tenant.tenantId)
                        ? "系統保留站台不可刪除"
                        : ""
                    }
                    className={`px-3 py-1 border rounded ${
                      PROTECTED_TENANTS.has(tenant.tenantId)
                        ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50"
                        : "border-red-600 text-red-600 hover:bg-red-50"
                    }`}
                  >
                    刪除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TenantList;
