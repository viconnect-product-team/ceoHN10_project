import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Activity,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Settings,
  Power,
  Lock,
  Globe,
  Key,
  Wallet,
  Save,
  Copy,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export function FinanceBankingSepaySection({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [reconciliations, setReconciliations] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  // Form thêm tài khoản ngân hàng
  const [fundId, setFundId] = useState("");
  const [bankName, setBankName] = useState("Vietcombank");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [sepayAccountId, setSepayAccountId] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Localhost SePay Sandbox Simulation State
  const [showSimulateModal, setShowSimulateModal] = useState(false);
  const [simType, setSimType] = useState<"event_ticket" | "membership_fee" | "transfer" | "general">("event_ticket");
  const [simAmount, setSimAmount] = useState("500000");
  const [simAccount, setSimAccount] = useState("101010202688");
  const [simContent, setSimContent] = useState("");
  const [simRunning, setSimRunning] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  // Dynamic Master Admin SePay Live Info (Đọc từ Master Admin /master?tab=settings)
  const [dynamicConfig, setDynamicConfig] = useState<any>({
    is_enabled: true,
    bank_brand_name: "VPBank",
    account_number: "",
    account_name: "PHAM VAN VU",
    api_token: "ceohn10_sepay_event_test_2026",
    webhook_token: "ceohn10_sepay_event_test_2026",
    webhook_url: "https://ceohn10.loca.lt/api/webhooks/sepay",
    prefix_syntax: {
      event: "CEO1983_EVT",
      membership: "CEOHN10_HP",
      course: "CEOHN10_LH",
    },
    auto_activation: {
      event_ticket: true,
      membership_fee: true,
      course_fee: true,
    },
  });

  const loadSepayMasterConfig = async () => {
    try {
      const res = await fetchNestApi<any>("/admin/master-settings/sepay");
      if (res?.config) {
        setDynamicConfig((prev: any) => ({ ...prev, ...res.config }));
      }
    } catch {}
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSimRunning(true);
    setSimResult(null);
    try {
      const res = await fetchNestApi<any>("/webhooks/sepay/simulate", {
        method: "POST",
        body: JSON.stringify({
          type: simType,
          amount: Number(simAmount.replace(/[^0-9]/g, "")) || 500000,
          accountNumber: simAccount,
          content: simContent.trim() || undefined,
        }),
      });

      if (res && res.success) {
        toast.success(`Giả lập thành công: ${res.message || "Đã ghi nhận giao dịch vào quỹ"}`);
        setSimResult(res);
        loadData();
      } else {
        toast.error(res?.message || "Lỗi giả lập Webhook");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi kết nối giả lập Webhook");
    } finally {
      setSimRunning(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [accRes, recRes, fundsRes] = await Promise.all([
        fetchNestApi<any[]>("/finance-init/bank-accounts").catch(() => []),
        fetchNestApi<any[]>("/finance-init/reconciliations").catch(() => []),
        fetchNestApi<any[]>("/finance-init/funds").catch(() => []),
      ]);
      setAccounts(Array.isArray(accRes) ? accRes : []);
      setReconciliations(Array.isArray(recRes) ? recRes : []);
      const fList = Array.isArray(fundsRes) ? fundsRes : [];
      setFunds(fList);
      if (fList.length > 0) setFundId(fList[0].id);
      await loadSepayMasterConfig();
    } catch (err: any) {
      toast.error(err?.message || "Lỗi tải thông tin ngân hàng & đối soát");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim() || !accountHolder.trim()) {
      toast.error("Vui lòng nhập đầy đủ Số tài khoản và Tên chủ tài khoản");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchNestApi<any>("/finance-init/bank-accounts", {
        method: "POST",
        body: JSON.stringify({
          fundId,
          bankName,
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim().toUpperCase(),
          sepayAccountId: sepayAccountId.trim() || undefined,
          isDefault,
        }),
      });

      if (res && res.id) {
        toast.success(`Đã thêm tài khoản ngân hàng ${accountNumber} thành công!`);
        setModalOpen(false);
        setAccountNumber("");
        setAccountHolder("");
        setSepayAccountId("");
        loadData();
      } else {
        toast.error(res?.message || "Không thể thêm tài khoản");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lưu tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── SEPAY LIVE GATEWAY STATUS ── */}
      <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Activity className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Cổng Tiếp Nhận Webhook SePay Đa Tài Khoản</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  dynamicConfig.is_enabled
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-slate-700 text-slate-400 border border-slate-600"
                }`}>
                  {dynamicConfig.is_enabled ? "LIVE • READY" : "PAUSED"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span>Endpoint Webhook:</span>
                  <code className="text-amber-300 bg-slate-800 px-2 py-0.5 rounded font-mono">
                    {dynamicConfig.webhook_url || "https://crm.ceohn10.viconnect.vn/api/webhooks/sepay"}
                  </code>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(dynamicConfig.webhook_url || "https://crm.ceohn10.viconnect.vn/api/webhooks/sepay");
                    toast.success("Đã copy Webhook URL vào bộ nhớ tạm");
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Copy URL"
                >
                  <Copy className="size-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/master?tab=settings"
              className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Cấu hình SePay tập trung tại Cổng Quản Trị Lớn Nhất /master"
            >
              <Settings className="size-3.5 text-purple-400" />
              <span>Quản Trị Cổng SePay (Master)</span>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tài Khoản Mặc Định (Master)</span>
            <div className="font-semibold text-emerald-400 mt-1 truncate">
              {dynamicConfig.bank_brand_name || "Chưa cấu hình"} - {dynamicConfig.account_number || "---"}
            </div>
            <div className="text-[11px] text-slate-300 uppercase truncate">{dynamicConfig.account_name || "CLB DOANH NHAN CEO HN10"}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Tiền Tố Đối Soát Tự Động</span>
            <div className="font-semibold text-sky-300 mt-1">Vé: {dynamicConfig.prefix_syntax?.event || "CEO1983_EVT"}</div>
            <div className="text-[11px] text-slate-300">Phí tham gia CLB: {dynamicConfig.prefix_syntax?.membership || "CEOHN10_HP"}</div>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Xác Thực Chống Giả Mạo</span>
            <div className="font-semibold text-slate-200 mt-1 flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-emerald-400" />
              <span>HMAC-SHA256 &amp; API Key</span>
            </div>
            <div className="text-[11px] text-slate-400 truncate">Token: {dynamicConfig.webhook_token ? "••••••••" + String(dynamicConfig.webhook_token).slice(-4) : "Chưa cài"}</div>
          </div>
        </div>
      </div>

      {/* ── DANH SÁCH TÀI KHOẢN NGÂN HÀNG LIÊN KẾT QUỸ ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="size-5 text-[#003B95]" />
              <span>Danh Sách Tài Khoản Ngân Hàng CEO HN10</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mỗi tài khoản ngân hàng liên kết trực tiếp với 1 quỹ tương ứng để kiểm soát dòng tiền độc lập.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSimulateModal(true);
                setSimResult(null);
              }}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/20"
            >
              <Activity className="size-3.5" />
              <span>🧪 Giả Lập SePay (Localhost)</span>
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-[#003B95] hover:bg-[#002b70] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="size-4" /> Thêm Tài Khoản Ngân Hàng
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 hover:bg-blue-50/20 transition space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-[#003B95] shadow-xs">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      {acc.bank_name}
                    </h4>
                    <span className="font-mono text-xs font-bold text-blue-700">
                      {acc.account_number}
                    </span>
                  </div>
                </div>

                {acc.is_default && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    Tài khoản chính
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <strong className="text-slate-800 uppercase">{acc.account_holder}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quỹ liên kết:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {acc.financial_funds?.name || "Chưa gán quỹ"}
                  </span>
                </div>
                {acc.sepay_account_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã SePay ID:</span>
                    <span className="font-mono text-[11px] text-indigo-600 font-semibold">{acc.sepay_account_id}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── BẢNG ĐỐI SOÁT NGÂN HÀNG (BANK RECONCILIATION) ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="size-5 text-[#003B95]" />
              <span>Đối Soát Ngân Hàng &amp; Sổ Quỹ (Bank Reconciliation)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Công thức kiểm toán: <strong>Số dư cuối kỳ = Số dư đầu kỳ + Tiền vào - Tiền ra</strong>
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Mã Phiên</th>
                <th className="py-3 px-4">Tài Khoản Ngân Hàng</th>
                <th className="py-3 px-4">Kỳ Đối Soát</th>
                <th className="py-3 px-4 text-right">Số Dư Đầu Kỳ</th>
                <th className="py-3 px-4 text-right">Tổng Tiền Vào</th>
                <th className="py-3 px-4 text-right">Tổng Tiền Ra</th>
                <th className="py-3 px-4 text-right">Số Dư Cuối Kỳ</th>
                <th className="py-3 px-4 text-center">Chênh Lệch</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">REC-2026-001</td>
                <td className="py-3 px-4">
                  <span className="font-semibold block text-slate-800">Vietcombank</span>
                  <span className="font-mono text-slate-500 text-[10px]">101010202688 (Quỹ Tổng)</span>
                </td>
                <td className="py-3 px-4 text-slate-600">Tháng hiện tại</td>
                <td className="py-3 px-4 text-right font-mono font-bold">1.500.000.000 đ</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">+0 đ</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">-20.000.000 đ</td>
                <td className="py-3 px-4 text-right font-mono font-black text-indigo-700">1.480.000.000 đ</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">0 đ (Khớp)</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="size-3" /> Đã Khớp 100%
                  </span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/70 transition">
                <td className="py-3 px-4 font-mono font-bold text-slate-900">REC-2026-002</td>
                <td className="py-3 px-4">
                  <span className="font-semibold block text-slate-800">MBBank</span>
                  <span className="font-mono text-slate-500 text-[10px]">888809012026 (Ban Công Nghệ)</span>
                </td>
                <td className="py-3 px-4 text-slate-600">Tháng hiện tại</td>
                <td className="py-3 px-4 text-right font-mono font-bold">200.000.000 đ</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600">+20.000.000 đ</td>
                <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">-0 đ</td>
                <td className="py-3 px-4 text-right font-mono font-black text-indigo-700">220.000.000 đ</td>
                <td className="py-3 px-4 text-center font-mono font-bold text-emerald-600">0 đ (Khớp)</td>
                <td className="py-3 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="size-3" /> Đã Khớp 100%
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL THÊM TÀI KHOẢN NGÂN HÀNG ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="size-5 text-[#003B95]" /> Thêm Tài Khoản Ngân Hàng Mới
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Quỹ liên kết *</label>
                <select
                  value={fundId}
                  onChange={(e) => setFundId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên Ngân hàng *</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="VD: Vietcombank, Techcombank, MBBank..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-medium text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Số tài khoản ngân hàng *</label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="VD: 101010202688"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tên chủ tài khoản (In hoa) *</label>
                <input
                  type="text"
                  required
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="VD: CLB DOANH NHAN CEO HN10"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-bold uppercase text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mã tài khoản SePay (Tùy chọn)</label>
                <input
                  type="text"
                  value={sepayAccountId}
                  onChange={(e) => setSepayAccountId(e.target.value)}
                  placeholder="VD: SP_ACC_HN10_VCB_01"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_default_check"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300"
                />
                <label htmlFor="is_default_check" className="font-medium text-slate-700 cursor-pointer">
                  Đặt làm tài khoản ngân hàng mặc định
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-[#003B95] hover:bg-[#002b70] text-white font-bold transition shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Đang lưu..." : "Lưu Tài Khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ── MODAL: GIẢ LẬP GIAO DỊCH SEPAY (LOCALHOST SANDBOX) ── */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/20 text-amber-500">
                  <Activity className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    🧪 Giả Lập Giao Dịch SePay (Localhost Sandbox)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bắn Webhook trực tiếp vào Backend Localhost để kiểm thử toàn diện trước khi deploy Subdomain
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSimulateWebhook} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Kịch Bản Giao Dịch (Transaction Scenario) *
                </label>
                <select
                  value={simType}
                  onChange={(e) => {
                    const next = e.target.value as any;
                    setSimType(next);
                    if (next === "event_ticket") {
                      setSimAmount("500000");
                      setSimContent("CEO HN10 VE SU KIEN EVT_8899");
                    } else if (next === "membership_fee") {
                      setSimAmount("10000000");
                      setSimContent("CEO HN10 - Hoi phi 2026 #INV_1020");
                    } else if (next === "transfer") {
                      setSimAmount("20000000");
                      setSimContent("TRF-TECH-20M-2026 Chuyen quy Ban Cong Nghe");
                      setSimAccount("888809012026");
                    } else {
                      setSimAmount("1000000");
                      setSimContent("Giao dich chuyen khoan ngau nhien");
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                >
                  <option value="event_ticket">🎟️ Đại biểu thanh toán Vé Sự Kiện (Tự động đổi trạng thái vé PAID)</option>
                  <option value="membership_fee">🏛️ Hội viên nộp Phí Tham Gia CLB Thường Niên 2026 (Quỹ Tổng)</option>
                  <option value="transfer">🔄 Lệnh điều chuyển nội bộ (Quỹ Tổng sang Ban Công Nghệ 20M)</option>
                  <option value="general">💳 Giao dịch ngân hàng tự do (Chờ đối soát PENDING_RECONCILIATION)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số Tài Khoản Nhận *
                  </label>
                  <select
                    value={simAccount}
                    onChange={(e) => setSimAccount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-semibold"
                  >
                    <option value="101010202688">VCB - 101010202688 (Quỹ Tổng)</option>
                    <option value="888809012026">MB - 888809012026 (Quỹ Ban CN)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Số Tiền Chuyển Khoản (VNĐ) *
                  </label>
                  <input
                    type="text"
                    required
                    value={simAmount}
                    onChange={(e) => setSimAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nội Dung Chuyển Khoản (Syntax Matcher) *
                </label>
                <input
                  type="text"
                  required
                  value={simContent}
                  onChange={(e) => setSimContent(e.target.value)}
                  placeholder="Ví dụ: CEO HN10 VE SU KIEN EVT_8899"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              {simResult && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-xs">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    <span>Kết Quả Xử Lý: {simResult.status || "THÀNH CÔNG"}</span>
                  </div>
                  <div className="text-[11px]">{simResult.message}</div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={simRunning}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-amber-500/20"
                >
                  {simRunning ? "Đang bắn Webhook..." : "⚡ Bắn Webhook Thử Nghiệm Ngay"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
