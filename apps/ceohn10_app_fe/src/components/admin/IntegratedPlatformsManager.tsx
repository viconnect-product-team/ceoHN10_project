import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Activity,
  Zap,
  Globe,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Save,
  X,
  ExternalLink,
  ShieldCheck,
  KeyRound,
  Webhook,
  Sliders,
  Server,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchIntegratedPlatforms,
  saveIntegratedPlatform,
  deleteIntegratedPlatform,
  testPlatformConnection,
  type IntegratedPlatformItem,
} from "@/lib/master-admin.functions";

const CATEGORY_MAP: Record<string, string> = {
  erp: "Hệ Thống ERP",
  crm: "Nền Tảng CRM",
  miniapp: "Zalo Mini App",
  e_learning: "Cổng E-Learning",
  finance: "Kế Toán & Thuế",
  api_connector: "Cổng API Webhook",
  auth: "Xác Thực SSO",
  other: "Khác",
};

const ALL_MODULES = [
  { key: "members", label: "Hội viên & Doanh nghiệp" },
  { key: "events", label: "Sự kiện & Hội nghị" },
  { key: "trainings", label: "Khai giảng & Đào tạo" },
  { key: "finance", label: "Tài chính & Quỹ" },
  { key: "voting", label: "Biểu quyết & Bầu cử" },
  { key: "marketplace", label: "Giao thương B2B" },
  { key: "checkin", label: "Điểm danh QR Code" },
];

export function IntegratedPlatformsManager() {
  const [platforms, setPlatforms] = useState<IntegratedPlatformItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Partial<IntegratedPlatformItem> | null>(null);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const loadPlatforms = async () => {
    setLoading(true);
    try {
      const list = await fetchIntegratedPlatforms();
      setPlatforms(list);
    } catch (err: any) {
      toast.error("Không thể tải danh sách phần mềm tích hợp: " + err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatforms();
  }, []);

  const handleOpenAdd = () => {
    setEditingPlatform({
      name: "",
      code: "",
      category: "erp",
      description: "",
      endpointUrl: "https://",
      healthcheckUrl: "",
      authType: "api_key",
      apiKey: "",
      webhookUrl: "",
      status: "active",
      modules: ["members", "events"],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: IntegratedPlatformItem) => {
    setEditingPlatform({ ...p });
    setIsModalOpen(true);
  };

  const handleDelete = async (p: IntegratedPlatformItem) => {
    if (p.isCore) {
      toast.error("Không thể xóa phần mềm nền tảng cốt lõi của hệ thống!");
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa phần mềm nền tảng "${p.name}"?`)) {
      return;
    }

    try {
      await deleteIntegratedPlatform(p.id);
      toast.success(`Đã xóa phần mềm ${p.name} thành công`);
      loadPlatforms();
    } catch (err: any) {
      toast.error("Lỗi khi xóa: " + err?.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlatform?.name || !editingPlatform?.endpointUrl) {
      toast.error("Vui lòng điền đầy đủ Tên phần mềm và URL kết nối!");
      return;
    }

    setSaving(true);
    try {
      await saveIntegratedPlatform(editingPlatform);
      toast.success(editingPlatform.id ? "Đã cập nhật cấu hình phần mềm thành công" : "Đã thêm mới phần mềm nền tảng thành công");
      setIsModalOpen(false);
      setEditingPlatform(null);
      loadPlatforms();
    } catch (err: any) {
      toast.error("Lỗi khi lưu cấu hình: " + err?.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async (p: IntegratedPlatformItem) => {
    setTestingId(p.id);
    try {
      const res = await testPlatformConnection(p.id, p.endpointUrl);
      if (res.success) {
        toast.success(`Kết nối tới ${p.name} thành công (${res.latencyMs}ms)`);
      } else {
        toast.error(`Kết nối thất bại: ${res.message}`);
      }
    } catch (err: any) {
      toast.error("Lỗi kiểm tra kết nối: " + err?.message);
    } finally {
      setTestingId(null);
    }
  };

  const handleToggleStatus = async (p: IntegratedPlatformItem) => {
    const newStatus = p.status === "active" ? "inactive" : "active";
    try {
      await saveIntegratedPlatform({ ...p, status: newStatus });
      toast.success(`Đã chuyển trạng thái phần mềm ${p.name} sang: ${newStatus === "active" ? "Hoạt động" : "Tạm dừng"}`);
      loadPlatforms();
    } catch (err: any) {
      toast.error("Lỗi cập nhật trạng thái: " + err?.message);
    }
  };

  const filtered = platforms.filter((p) => {
    const matchSearch =
      searchTerm === "" ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.endpointUrl.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner & Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">
              [3. NHÓM PHẦN MỀM] Cấu Hình &amp; Quản Lý Các Phần Mềm Nền Tảng Khác
            </h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              {platforms.length} phần mềm
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Hỗ trợ cấu hình tích hợp động các phần mềm A, B, C, Zalo Mini App, hệ thống ERP doanh nghiệp và API kết nối
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadPlatforms}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 transition cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Tải lại</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Thêm Phần Mềm Nền Tảng Mới</span>
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-2xs">
        <div className="flex flex-1 items-center gap-2 min-w-[240px]">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm theo tên phần mềm, mã định danh, endpoint..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-foreground outline-none"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="miniapp">Zalo Mini App</option>
            <option value="erp">ERP Doanh Nghiệp</option>
            <option value="e_learning">E-Learning Đào Tạo</option>
            <option value="finance">Kế Toán &amp; Hóa Đơn</option>
            <option value="auth">Xác Thực SSO</option>
            <option value="api_connector">API Connector</option>
          </select>
        </div>
      </div>

      {/* Grid danh sách các phần mềm tích hợp */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const isPinging = testingId === p.id;
          const isActive = p.status === "active";

          return (
            <div
              key={p.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:border-primary/40 hover:shadow-sm"
            >
              <div className="space-y-3">
                {/* Header card */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground line-clamp-1" title={p.name}>
                        {p.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.2 rounded">
                          {p.code}
                        </span>
                        <span className="text-[10.5px] font-semibold text-primary">
                          {CATEGORY_MAP[p.category] || p.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold border ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      }`}
                    />
                    {isActive ? "Hoạt động" : "Tạm dừng"}
                  </span>
                </div>

                {/* Mô tả */}
                <p className="text-[11.5px] text-muted-foreground line-clamp-2 min-h-[34px]">
                  {p.description || "Phần mềm tích hợp phục vụ kết nối dữ liệu trong hệ sinh thái CEO HN10"}
                </p>

                {/* Endpoint & Auth */}
                <div className="space-y-1.5 rounded-xl bg-muted/40 p-2.5 text-[11px] border border-border/50">
                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Endpoint:</span>
                    <a
                      href={p.endpointUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono text-primary hover:underline flex items-center gap-1 truncate max-w-[180px]"
                    >
                      <span>{p.endpointUrl}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between text-muted-foreground">
                    <span>Xác thực:</span>
                    <span className="font-semibold text-foreground uppercase text-[10px]">
                      {p.authType}
                    </span>
                  </div>

                  {p.lastPingAt && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Độ trễ:</span>
                      <span className="font-mono font-bold text-emerald-600 flex items-center gap-1">
                        <Zap className="h-3 w-3 text-amber-500" />
                        {p.pingLatencyMs || 15}ms
                      </span>
                    </div>
                  )}
                </div>

                {/* Modules được cấp quyền */}
                <div>
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Modules Tích Hợp:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(p.modules || []).map((m) => (
                      <span
                        key={m}
                        className="rounded bg-background px-1.5 py-0.5 text-[10px] font-semibold text-foreground border border-border"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 border-t border-border/60 pt-3 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  onClick={() => handleTestConnection(p)}
                  disabled={isPinging}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition cursor-pointer disabled:opacity-50"
                >
                  <Activity className={`h-3 w-3 ${isPinging ? "animate-spin" : ""}`} />
                  <span>{isPinging ? "Kiểm tra..." : "Test Ping"}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(p)}
                    className="rounded-lg border border-border bg-background px-2 py-1 text-[11px] font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                    title={isActive ? "Tạm dừng kết nối" : "Kích hoạt kết nối"}
                  >
                    {isActive ? "Tạm dừng" : "Bật lại"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition cursor-pointer"
                    title="Chỉnh sửa cấu hình"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>

                  {!p.isCore && (
                    <button
                      type="button"
                      onClick={() => handleDelete(p)}
                      className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                      title="Xóa phần mềm"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Thêm Mới / Chỉnh Sửa Phần Mềm Nền Tảng */}
      {isModalOpen && editingPlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Sliders className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {editingPlatform.id ? "Chỉnh Sửa Cấu Hình Phần Mềm Nền Tảng" : "Thêm Phần Mềm Nền Tảng Mới"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-muted-foreground hover:bg-muted cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Tên Phần Mềm *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Phần Mềm ERP Doanh Nghiệp A"
                    value={editingPlatform.name || ""}
                    onChange={(e) => setEditingPlatform({ ...editingPlatform, name: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Mã Định Danh (Code) *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: APP_ERP_A"
                    value={editingPlatform.code || ""}
                    onChange={(e) => setEditingPlatform({ ...editingPlatform, code: e.target.value.toUpperCase() })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Phân Loại Nền Tảng</label>
                  <select
                    value={editingPlatform.category || "erp"}
                    onChange={(e) => setEditingPlatform({ ...editingPlatform, category: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary font-semibold"
                  >
                    <option value="miniapp">Zalo Mini App</option>
                    <option value="erp">Hệ Thống ERP Doanh Nghiệp</option>
                    <option value="e_learning">Cổng Đào Tạo E-Learning</option>
                    <option value="finance">Phần Mềm Kế Toán &amp; Hóa Đơn</option>
                    <option value="crm">Phần Mềm CRM Đối Tác</option>
                    <option value="auth">Cổng Xác Thực SSO</option>
                    <option value="api_connector">API Webhook Connector</option>
                    <option value="other">Khác</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">Trạng Thái Hoạt Động</label>
                  <select
                    value={editingPlatform.status || "active"}
                    onChange={(e) => setEditingPlatform({ ...editingPlatform, status: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary font-semibold"
                  >
                    <option value="active">Hoạt động (Active)</option>
                    <option value="inactive">Tạm dừng (Inactive)</option>
                    <option value="maintenance">Đang bảo trì (Maintenance)</option>
                    <option value="connecting">Đang kết nối thử nghiệm</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Endpoint URL Kết Nối *</label>
                <input
                  type="url"
                  required
                  placeholder="https://erp-a.viconnect.vn/api/v1"
                  value={editingPlatform.endpointUrl || ""}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, endpointUrl: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-foreground">Phương Thức Xác Thực</label>
                  <select
                    value={editingPlatform.authType || "api_key"}
                    onChange={(e) => setEditingPlatform({ ...editingPlatform, authType: e.target.value as any })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary font-semibold"
                  >
                    <option value="api_key">API Key / Secret Token</option>
                    <option value="bearer_token">Bearer Token (JWT)</option>
                    <option value="oauth2">OAuth2 Client Credentials</option>
                    <option value="basic_auth">Basic Auth (User/Pass)</option>
                    <option value="none">Không xác thực</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-foreground">API Key / Secret Key</label>
                  <input
                    type="password"
                    placeholder="Mã khóa kết nối bảo mật"
                    value={editingPlatform.apiKey || ""}
                    onChange={(e) => setEditingPlatform({ ...editingPlatform, apiKey: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Webhook URL Nhận Đồng Bộ Dữ Liệu</label>
                <input
                  type="url"
                  placeholder="https://crm.ceohn10.viconnect.vn/api/webhooks/..."
                  value={editingPlatform.webhookUrl || ""}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, webhookUrl: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-mono outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Mô Tả Chức Năng</label>
                <textarea
                  rows={2}
                  placeholder="Mục đích kết nối, chức năng đồng bộ..."
                  value={editingPlatform.description || ""}
                  onChange={(e) => setEditingPlatform({ ...editingPlatform, description: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Phân Quyền Modules Cho Phép</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_MODULES.map((m) => {
                    const isChecked = (editingPlatform.modules || []).includes(m.key);
                    return (
                      <label
                        key={m.key}
                        className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer transition ${
                          isChecked ? "border-primary bg-primary/5 text-primary" : "border-border text-muted-foreground"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const cur = editingPlatform.modules || [];
                            const next = e.target.checked
                              ? [...cur, m.key]
                              : cur.filter((k) => k !== m.key);
                            setEditingPlatform({ ...editingPlatform, modules: next });
                          }}
                          className="rounded text-primary"
                        />
                        <span className="text-[11px] font-semibold">{m.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs hover:bg-primary/90 transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Đang lưu..." : "Lưu Cấu Hình"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
