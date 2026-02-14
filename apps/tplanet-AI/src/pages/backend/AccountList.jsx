import { useState, useEffect, useMemo } from "react";
import View from "../../assets/view_icon.svg";
import Edit from "../../assets/edit_icon.svg";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import UserRegistrationStatistics from "./components/UserRegistrationModal";
import EditAccountModal from "../../utils/components/EditAccountModal";
import ActivateIcon from "../../assets/activate_icon.svg";
import DeleteIcon from "../../assets/delete_icon.svg";

import {
  deleteAccount,
  removeMember,
  getAccountStatus,
  setAccountActiveStatus,
} from "../../utils/Accounts";
import { apiGet } from "../../utils/api";
import { useHosters } from "../../utils/multi-tenant";
import { useTranslation } from "react-i18next";
import i18n from "../../utils/i18n";

const API_BASE = import.meta.env.VITE_HOST_URL_TPLANET;

// 瀏覽人次統計 Modal 組件
const VisitorStatisticsModal = ({ show, onHide }) => {
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  const fetchVisitorStatistics = async () => {
    setLoading(true);
    setError("");
    
    try {
      const url = `${API_BASE}/api/dashboard/visitors`;
      console.log("Fetching visitor statistics from:", url);
      
      const res = await fetch(url, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      
      console.log("Response status:", res.status);
      console.log("Response ok:", res.ok);
      
      const data = await res.json().catch((jsonError) => {
        console.error("JSON parse error:", jsonError);
        return {};
      });
      console.log("API Response data:", data);
      
      if (!res.ok) {
        throw new Error(`讀取失敗（HTTP ${res.status}）`);
      }

      const visitorList = data.visitors || [];
      console.log("Visitor list:", visitorList);
      
      // 計算總數
      const total = visitorList.reduce((sum, visitor) => sum + (visitor.count || 0), 0);
      
      setVisitors(visitorList);
      setTotalCount(total);
      
    } catch (e) {
      console.error("Fetch error:", e);
      setError(e.message || "讀取瀏覽人次統計失敗");
      setVisitors([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchVisitorStatistics();
    }
  }, [show]);

  // 格式化日期顯示
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>{i18n.t("accountList.visitor_title")}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {loading ? (
          <div className="text-center py-4">
            <div className="mb-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">{i18n.t("common.loading")}</span>
              </div>
            </div>
            <div>{i18n.t("common.loading")}</div>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="alert alert-danger mb-3">{error}</div>
            <Button variant="outline-primary" size="sm" onClick={fetchVisitorStatistics}>
              {i18n.t("common.reload")}
            </Button>
          </div>
        ) : visitors.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <div className="mb-2">{i18n.t("accountList.no_visitor")}</div>
            <div className="small">{i18n.t("accountList.no_visitor_data")}</div>
          </div>
        ) : (
          <div>
            {/* 總計卡片 */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card bg-primary text-white">
                  <div className="card-body text-center">
                    <h5 className="card-title">{i18n.t("accountList.total_visitors")}</h5>
                    <h2 className="display-4">{totalCount.toLocaleString()}</h2>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card bg-info text-white">
                  <div className="card-body text-center">
                    <h5 className="card-title">{i18n.t("accountList.statistics_days")}</h5>
                    <h2 className="display-4">{visitors.length}</h2>
                  </div>
                </div>
              </div>
            </div>

            {/* 詳細數據表格 */}
            <div className="card">
              <div className="card-header bg-light">
                <h6 className="card-title mb-0">{i18n.t("accountList.daily_statistics")}</h6>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive" style={{ maxHeight: '400px' }}>
                  <table className="table table-striped table-hover mb-0">
                    <thead className="table-dark sticky-top">
                      <tr>
                        <th className="text-center">#</th>
                        <th className="text-center">{i18n.t("accountList.date")}</th>
                        <th className="text-center">{i18n.t("accountList.visitor_count")}</th>
                        <th className="text-center">{i18n.t("accountList.percentage")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitors.map((visitor, index) => {
                        const percentage = totalCount > 0 ? ((visitor.count / totalCount) * 100).toFixed(1) : 0;
                        return (
                          <tr key={index}>
                            <td className="text-center">{index + 1}</td>
                            <td className="text-center font-monospace">
                              {formatDate(visitor.date)}
                            </td>
                            <td className="text-center">
                              <span className="badge bg-primary fs-6">
                                {visitor.count.toLocaleString()}
                              </span>
                            </td>
                            <td className="text-center">
                              <div className="d-flex align-items-center">
                                <div className="progress flex-grow-1 me-2" style={{ height: '20px' }}>
                                  <div 
                                    className="progress-bar bg-success" 
                                    role="progressbar" 
                                    style={{ width: `${percentage}%` }}
                                    aria-valuenow={percentage} 
                                    aria-valuemin="0" 
                                    aria-valuemax="100"
                                  >
                                  </div>
                                </div>
                                <small className="text-muted" style={{ minWidth: '45px' }}>
                                  {percentage}%
                                </small>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 統計摘要 */}
            <div className="row mt-3">
              <div className="col-md-4">
                <div className="card border-success">
                  <div className="card-body text-center">
                    <div className="text-muted small">{i18n.t("accountList.average")}</div>
                    <div className="h5 text-success">
                      {visitors.length > 0 ? Math.round(totalCount / visitors.length).toLocaleString() : 0}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-warning">
                  <div className="card-body text-center">
                    <div className="text-muted small">{i18n.t("accountList.highest_single_day")}</div>
                    <div className="h5 text-warning">
                      {visitors.length > 0 ? Math.max(...visitors.map(v => v.count)).toLocaleString() : 0}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-info">
                  <div className="card-body text-center">
                    <div className="text-muted small">{i18n.t("accountList.lowest_single_day")}</div>
                    <div className="h5 text-info">
                      {visitors.length > 0 ? Math.min(...visitors.map(v => v.count)).toLocaleString() : 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between align-items-center w-100">
          <div className="text-muted small">
            {visitors.length > 0 && `${i18n.t("accountList.latest_update")} : ${new Date().toLocaleString('zh-TW')}`}
          </div>
          <div>
            {visitors.length > 0 && (
              <Button variant="outline-primary" size="sm" onClick={fetchVisitorStatistics} className="me-2">
                {i18n.t("common.refresh")}
              </Button>
            )}
            <Button variant="secondary" onClick={onHide}>
              {i18n.t("common.close")}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

// 後端 → 前端欄位標準化
function normalize(u) {
  const roleStd =
    (u.role || "").trim() === "系統管理員" ? "系統管理者" : u.role || "";

  return {
    id: u.id,
    email: u.email || "",
    host: u.hoster || "",            // 承辦窗口
    organization: u.undertake || "", // 地方團隊
    role: roleStd,
    // 先不決定狀態，等一下用 get_user_info 的 active 來補
    status: null,
    lastLogin: u.last_login_at ?? "-", // 已是台北時間字串或 "-"
    loginCount: u.login_count ?? "-",  // 整數或 "-"
  };
}

// 登入記錄 Modal 組件
const LoginRecordsModal = ({ show, onHide, userEmail }) => {
  const [loginRecords, setLoginRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  const fetchLoginRecords = async () => {
    if (!userEmail) return;

    setLoading(true);
    setError("");
    setDebugInfo("");

    try {
      const encodedEmail = encodeURIComponent(userEmail);
      const url = `/accounts/get_user_login_records?email=${encodedEmail}`;

      console.log("userEmail:", userEmail);
      setDebugInfo(`請求: ${userEmail}`);

      const response = await apiGet(url);

      console.log("API Response:", response);

      if (!response.success) {
        const errorMsg = response.error?.message || "讀取失敗";
        throw new Error(errorMsg);
      }

      const records = response.data?.login_records || [];
      console.log("Extracted login records:", records);

      setLoginRecords(records);
      setDebugInfo(`成功取得 ${records.length} 筆記錄`);
      
    } catch (e) {
      console.error("Fetch error:", e);
      setError(e.message || "讀取登入記錄失敗");
      setLoginRecords([]);
      setDebugInfo(`錯誤: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (show && userEmail) {
      fetchLoginRecords();
    }
  }, [show, userEmail]);

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>登入記錄 - {userEmail}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
        {/* 除錯資訊 */}
        {debugInfo && (
          <div className="mb-3 p-2 bg-gray-100 text-xs text-gray-600 rounded">
            除錯資訊: {debugInfo}
          </div>
        )}

        {loading ? (
          <div className="text-center py-4">{i18n.t("common.loading")}</div>
        ) : error ? (
          <div className="text-center py-4">
            <div className="text-red-600 mb-2">{error}</div>
            <button 
              className="text-blue-600 underline text-sm"
              onClick={fetchLoginRecords}
            >
              {i18n.t("common.reload")}
            </button>
          </div>
        ) : loginRecords.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            <div className="mb-2">{i18n.t("accountList.no_record")}</div>
            <div className="text-xs">{i18n.t("accountList.no_record_hint")}</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm text-gray-600 mb-3">
              {/* 共 {loginRecords.length} 筆登入記錄 */}
              {i18n.t("accountList.record", { loginRecords: loginRecords.length })}
            </div>
            {loginRecords.map((record, index) => (
              <div key={index} className="border-b pb-3 last:border-b-0">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">
                      {record.login_time}
                    </div>
                    <div className="space-y-1">
                      {record.ip_address && record.ip_address !== 'unknown' && (
                        <div className="text-sm text-gray-600 flex items-center">
                          IP: <span className="ml-1 font-mono">{record.ip_address}</span>
                        </div>
                      )}
                      {record.user_agent && record.user_agent !== 'unknown' && (
                        <div className="text-xs text-gray-500 break-all">
                          {record.user_agent}
                        </div>
                      )}
                      {(!record.ip_address || record.ip_address === 'unknown') && 
                       (!record.user_agent || record.user_agent === 'unknown') && (
                        <div className="text-xs text-gray-400 italic">
                          {i18n.t("accountList.system_record")}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-3 flex-shrink-0">
                    #{index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <div className="flex justify-between items-center w-100">
          <div className="text-xs text-gray-500">
            {loginRecords.length > 0 && `${i18n.t("accountList.latest_update")}: ${new Date().toLocaleString('zh-TW')}`}
          </div>
          <div className="space-x-2">
            {loginRecords.length > 0 && (
              <Button variant="outline-primary" size="sm" onClick={fetchLoginRecords}>
                {i18n.t("common.refresh")}
              </Button>
            )}
            <Button variant="secondary" onClick={onHide}>
              {i18n.t("common.close")}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

const AccountList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("所有狀態");
  const [modalShow, setModalShow] = useState(false);
  const [visitorModalShow, setVisitorModalShow] = useState(false);
  const [loginRecordsModal, setLoginRecordsModal] = useState({ show: false, userEmail: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAccounts, setSelectedAccounts] = useState([]);
  const [editModal, setEditModal] = useState({ show: false, account: null });
  const itemsPerPage = 20;
  const { t } = useTranslation();
  const allHosters = useHosters();

  const handleEditAccount = (account) => {
    console.log("Opening edit modal for:", account);
    setEditModal({ show: true, account });
  };

  const handleAccountUpdated = () => {
    fetchUsers(); // 重新載入使用者列表
  };

  const fetchUsers = async () => {
    setLoading(true);
    setErrMsg("");

    try {
      const response = await apiGet('/accounts/get_user_list');

      if (!response.success) {
        throw new Error(response.error?.message || "讀取失敗");
      }

      const list = Array.isArray(response.data?.users) ? response.data.users : [];
      const baseItems = list.map(normalize);

      // 只顯示當前 tenant 的 hosters（含 index 0 站長），避免誤顯示全站帳號
      const hosterEmails = allHosters.map((e) => e.toLowerCase());
      const memberItems = hosterEmails.length > 0
        ? baseItems.filter((acc) => hosterEmails.includes(acc.email.toLowerCase()))
        : [];

      // 逐一用 get_user_info 查 active，補上 status = 啟用 / 停用
      const itemsWithStatus = await Promise.all(
        memberItems.map(async (acc) => {
          try {
            const statusRes = await getAccountStatus(acc.email);
            if (statusRes.success && typeof statusRes.active === "boolean") {
              return {
                ...acc,
                status: statusRes.active ? "啟用" : "停用",
              };
            }
            return acc;
          } catch (e) {
            console.error("取得帳號狀態失敗:", acc.email, e);
            return acc;
          }
        })
      );

      setItems(itemsWithStatus);
    } catch (e) {
      setErrMsg(e.message || "讀取失敗");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (email) => {
    if (!window.confirm(`${t("accountList.check_remove_member")}？\n${email}`)) return;

    try {
      const res = await removeMember(email);
      if (res.success) {
        alert(t("accountList.remove_member_success"));
        fetchUsers();
      } else {
        alert(`${t("accountList.remove_member_fail")}：${res.message}`);
      }
    } catch (err) {
      console.error("移除會員失敗：", err);
      alert(t("accountList.remove_member_error"));
    }
  };

  const handleDeleteAccount = async (email) => {
    if (!window.confirm(`${t("accountList.check_delete")}？\n${email}`)) return;

    try {
      const res = await deleteAccount(email);
      if (res.success) {
        alert(t("accountList.delete_success"));
        fetchUsers();
      } else {
        alert(`${t("accountList.delete_fail")}：${res.message}`);
      }
    } catch (err) {
      console.error("刪除帳號失敗：", err);
      alert(t("accountList.delete_error"));
    }
  };



  useEffect(() => {
    if (allHosters.length > 0) fetchUsers();
  }, [allHosters]);

  // 本地篩選
  const filteredAccounts = useMemo(() => {
    return items.filter((account) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        account.email.toLowerCase().includes(q) ||
        account.host.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "所有狀態" || account.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  // 分頁
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAccounts, currentPage]);

  const totalPages = Math.ceil(filteredAccounts.length / itemsPerPage);

  useEffect(() => setCurrentPage(1), [filteredAccounts]);

  // 勾選邏輯
  const handleSelectAll = (checked) => {
    const currentPageIds = paginatedData.map((a) => a.id);
    if (checked) {
      setSelectedAccounts((prev) => [...new Set([...prev, ...currentPageIds])]);
    } else {
      setSelectedAccounts((prev) => prev.filter((id) => !currentPageIds.includes(id)));
    }
  };
  const handleSelectAccount = (id, checked) =>
    setSelectedAccounts((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)));

  const isCurrentPageAllSelected = useMemo(
    () => paginatedData.length > 0 && paginatedData.every((a) => selectedAccounts.includes(a.id)),
    [paginatedData, selectedAccounts]
  );
  const isCurrentPageIndeterminate = useMemo(() => {
    const n = paginatedData.filter((a) => selectedAccounts.includes(a.id)).length;
    return n > 0 && n < paginatedData.length;
  }, [paginatedData, selectedAccounts]);

  const handlePageChange = (p) => setCurrentPage(p);

  // 處理查看登入記錄 - 只傳 userEmail
  const handleViewLoginRecords = (userEmail) => {
    console.log("Opening login records for:", userEmail);
    setLoginRecordsModal({ show: true, userEmail });
  };

  // 切換帳號啟用 / 停用狀態
  const handleToggleActiveStatus = async (account) => {
    const email = account.email;
    try {
      // 1️⃣ 取得目前狀態
      const statusRes = await getAccountStatus(email);
      if (!statusRes.success) {
        alert(`${t("accountList.unknown_status")}: ${statusRes.message}`);
        return;
      }

      const currentStatus = statusRes.active;
      const targetStatus = !currentStatus; // 反轉

      // 2️⃣ 確認動作
      const confirmText = targetStatus ? t("accountList.confirm_enable") : t("accountList.confirm_disable");
      if (!window.confirm(confirmText)) return;

      // 3️⃣ 更新狀態
      const updateRes = await setAccountActiveStatus(email, targetStatus);
      if (updateRes.success) {
        alert(`✅ ${t("accountList.account")} ${targetStatus ? t("accountList.enable") : t("accountList.disable")}`);
        fetchUsers(); // 重新整理列表
      } else {
        alert(`❌ ${t("accountList.update_fail")}：${updateRes.message}`);
      }
    } catch (err) {
      console.error("handleToggleActiveStatus error:", err);
      alert(t("accountList.update_error"));
    }
  };

  const renderPaginationButtons = () => {
    const btns = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);

    btns.push(
      <button key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
        className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
        {t("accountList.prev_page")}
      </button>
    );
    if (start > 1) {
      btns.push(
        <button key={1} onClick={() => handlePageChange(1)} className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50">1</button>
      );
      if (start > 2) btns.push(<span key="e1" className="px-2">...</span>);
    }
    for (let p = start; p <= end; p++) {
      btns.push(
        <button key={p} onClick={() => handlePageChange(p)}
          className={`px-3 py-1 mx-1 border rounded ${currentPage === p ? "bg-blue-500 text-white border-blue-500" : "border-gray-300 hover:bg-gray-50"}`}>
          {p}
        </button>
      );
    }
    if (end < totalPages) {
      if (end < totalPages - 1) btns.push(<span key="e2" className="px-2">...</span>);
      btns.push(
        <button key={totalPages} onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50">
          {totalPages}
        </button>
      );
    }
    btns.push(
      <button key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
        className="px-3 py-1 mx-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
        {t("accountList.next_page")}
      </button>
    );
    return btns;
  };

  return (
    <div className="w-[90%] mx-auto h-full flex flex-col py-3">
      <div className="bg-[#317EE0] text-white px-6 h-16 flex-shrink-0 flex items-center justify-between">
        <span className="text-xl font-semibold">{t("accountList.accountList")}</span>
        <div className="text-sm">{loading ? "載入中…" : errMsg ? <span className="text-red-200">{errMsg}</span> : null}</div>
      </div>

      <div className="p-4 flex-shrink-0">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-64">
            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" />
            </svg>
            <input
              type="text"
              placeholder={t("accountList.search_placeholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="w-40">
            <Form.Select aria-label="選擇狀態" className="bg-transparent" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option>{t("accountList.all_status")}</option>
              <option value="啟用">{t("accountList.enable")}</option>
              <option value="停用">{t("accountList.disable")}</option>
            </Form.Select>
          </div>

          <Button variant="dark" onClick={() => setModalShow(true)}>{t("accountList.user_registration_statistics")}</Button>
          <Button variant="dark" onClick={() => setVisitorModalShow(true)}>{t("accountList.visitor_title")}</Button>
          <UserRegistrationStatistics show={modalShow} onHide={() => setModalShow(false)} />
          <VisitorStatisticsModal show={visitorModalShow} onHide={() => setVisitorModalShow(false)} />
          <Button variant="dark" href="/backend/account-list/add-account">{t("accountList.add_member")}</Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#4472C4] text-white sticky top-0">
              <tr>
                <th className="p-3 text-center">
                  <Form.Check
                    aria-label="選擇當前頁面全部帳號"
                    checked={isCurrentPageAllSelected}
                    ref={(el) => { if (el) el.indeterminate = isCurrentPageIndeterminate; }}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
                <th className="p-3 text-center">{t("accountList.email")}</th>
                <th className="p-3 text-center">{t("accountList.contact_person")}</th>
                <th className="p-3 text-center">{t("accountList.project_team")}</th>
                <th className="p-3 text-center">{t("accountList.status")}</th>
                <th className="p-3 text-center">{t("accountList.last_login")}</th>
                <th className="p-3 text-center">{t("accountList.login_statistics")}</th>
                <th className="p-3 text-center">{t("accountList.actions")}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-8 text-gray-500">
                    {loading ? t("common.loading") : t("accountList.no_accounts_found")}
                  </td>
                </tr>
              ) : (
                paginatedData.map((account, index) => (
                  <tr
                    key={account.id}
                    className={((currentPage - 1) * itemsPerPage + index) % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-4">
                      <Form.Check
                        aria-label="選擇帳號"
                        checked={selectedAccounts.includes(account.id)}
                        onChange={(e) => handleSelectAccount(account.id, e.target.checked)}
                      />
                    </td>
                    <td className="p-4">{account.email}</td>
                    <td className="p-4">{account.host}</td>
                    <td className="p-4">{account.organization}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${account.status === "啟用" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {/* {account.status} */}
                        {account.status === "啟用" ? t("accountList.enable_status") : t("accountList.disable_status")}
                      </span>
                    </td>
                    <td className="p-4 text-sm">{account.lastLogin}</td>
                    <td className="p-4">{account.loginCount}</td>
                    <td className="p-4">
                      <div className="flex gap-2">

                        {/* 編輯帳號 */}
                        <button
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title={t("edit.edit")}
                          onClick={() => handleEditAccount(account)}
                        >
                          <img src={Edit} alt={t("edit.edit")} className="w-4 h-4" />
                        </button>

                        {/* 查看登入記錄 */}
                        <button
                          className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                          title={t("accountList.view_login_records")}
                          onClick={() => handleViewLoginRecords(account.email)}
                        >
                          <img src={View} alt={t("accountList.view_login_records")} className="w-4 h-4" />
                        </button>

                        {/* 啟用 / 停用帳號 */}
                        <button
                          className={`p-1 rounded ${
                            account.status === "啟用"
                              ? "bg-green-100 hover:bg-green-200"
                              : "bg-red-100 hover:bg-red-200"
                          }`}
                          title={account.status === "啟用" ? t("accountList.disable_account") : t("accountList.enable_account")}
                          onClick={() => handleToggleActiveStatus(account)}
                        >
                          {/* 使用 hardcode 的綠底圖示 */}
                          <img
                            src={ActivateIcon}
                            alt={account.status === "啟用" ? t("accountList.disable_account") : t("accountList.enable_account")}
                            className="w-4 h-4"
                          />
                        </button>

                        {/* 移除會員（只從 hosters 移除） */}
                        <button
                          className="p-1 text-orange-600 hover:bg-orange-50 rounded"
                          title={t("accountList.remove_member")}
                          onClick={() => handleRemoveMember(account.email)}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                          </svg>
                        </button>

                        {/* 刪除帳號（徹底刪除） */}
                        <button
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title={t("accountList.delete_account")}
                          onClick={() => handleDeleteAccount(account.email)}
                        >
                          <img src={DeleteIcon} alt={t("accountList.delete_account")} className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {filteredAccounts.length > 0 && (
            <div className="mt-4 flex items-center justify-between px-4">
              <div className="text-sm text-gray-700">
                {t("accountList.showing")} {(currentPage - 1) * itemsPerPage + 1} {t("accountList.to")} {Math.min(currentPage * itemsPerPage, filteredAccounts.length)} {t("accountList.of")} {filteredAccounts.length} {t("accountList.items")}
              </div>
              {totalPages > 1 && <div className="flex items-center">{renderPaginationButtons()}</div>}
            </div>
          )}
        </div>
      </div>

      {/* 編輯帳號 Modal */}
      <EditAccountModal
        show={editModal.show}
        onHide={() => setEditModal({ show: false, account: null })}
        account={editModal.account}
        onAccountUpdated={handleAccountUpdated}
      />

      {/* 登入記錄 Modal */}
      <LoginRecordsModal
        show={loginRecordsModal.show}
        onHide={() => setLoginRecordsModal({ show: false, userEmail: "" })}
        userEmail={loginRecordsModal.userEmail}
      />
    </div>
  );
};

export default AccountList;
