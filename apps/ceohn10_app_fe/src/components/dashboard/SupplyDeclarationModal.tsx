import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Send,
  Sparkles,
  Building2,
  Layers,
  X,
  AlertCircle,
  Gift,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";
import { VndCurrencyInput } from "@/components/dashboard/VndCurrencyInput";

export interface SupplyItem {
  id: string;
  targetType: "event" | "training";
  targetId: string;
  targetName: string;
  itemName: string;
  quantity: number;
  unit: string;
  sponsorId?: string | null;
  sponsorName?: string;
  isFromSponsor: boolean;
  status: "needed" | "requested" | "allocated" | "ready";
  estimatedCost: number;
  department: string;
  declaredByName: string;
  note: string;
  createdAt: string;
}

export interface SponsorInventoryItem {
  sponsorId: string;
  sponsorName: string;
  companyName: string;
  itemName: string;
  totalQuantity: number;
  unit: string;
  estimatedValue: number;
  allocatedQuantity: number;
  availableQuantity: number;
}

interface SupplyDeclarationModalProps {
  open: boolean;
  onClose: () => void;
  targetType: "event" | "training";
  targetId: string;
  targetName: string;
  department?: string;
}

export function SupplyDeclarationModal({
  open,
  onClose,
  targetType,
  targetId,
  targetName,
  department,
}: SupplyDeclarationModalProps) {
  const [items, setItems] = useState<SupplyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [sponsorInventory, setSponsorInventory] = useState<SponsorInventoryItem[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);

  // New item form
  const [isFromSponsor, setIsFromSponsor] = useState(false);
  const [selectedSponsorItem, setSelectedSponsorItem] = useState<string>("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("Cái");
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load declared items
  const loadSupplies = async () => {
    try {
      setLoading(true);
      const res = await fetchNestApi<SupplyItem[]>(
        `/supplies?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`,
      );
      setItems(Array.isArray(res) ? res : []);
    } catch {
      toast.error("Không thể tải danh sách vật tư hỗ trợ");
    } finally {
      setLoading(false);
    }
  };

  // Load available sponsor items
  const loadSponsorInventory = async () => {
    try {
      setLoadingInventory(true);
      const res = await fetchNestApi<SponsorInventoryItem[]>("/supplies/sponsor-inventory");
      setSponsorInventory(Array.isArray(res) ? res : []);
    } catch {
      console.warn("Không thể tải kho tài trợ hiện vật");
    } finally {
      setLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadSupplies();
      loadSponsorInventory();
    }
  }, [open, targetId, targetType]);

  const handleSelectSponsorItem = (key: string) => {
    setSelectedSponsorItem(key);
    const found = sponsorInventory.find(
      (s) => `${s.sponsorId}-${s.itemName}` === key,
    );
    if (found) {
      setItemName(found.itemName);
      setUnit(found.unit || "Cái");
      setEstimatedCost(0); // Lấy từ tài trợ thì không tốn chi phí mua sắm
      setNote(`Lấy từ gói tài trợ hiện vật của ${found.sponsorName} (${found.companyName})`);
    }
  };

  const handleAddSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName.trim()) {
      toast.error("Vui lòng nhập tên vật dụng cần khai báo");
      return;
    }

    try {
      setSubmitting(true);
      let spId: string | undefined = undefined;
      let spName: string | undefined = undefined;

      if (isFromSponsor && selectedSponsorItem) {
        const found = sponsorInventory.find(
          (s) => `${s.sponsorId}-${s.itemName}` === selectedSponsorItem,
        );
        if (found) {
          spId = found.sponsorId;
          spName = found.sponsorName;
        }
      }

      await fetchNestApi("/supplies", {
        method: "POST",
        body: JSON.stringify({
          targetType,
          targetId,
          targetName,
          itemName: itemName.trim(),
          quantity: parseInt(quantity, 10) || 1,
          unit: unit.trim() || "Cái",
          isFromSponsor,
          sponsorId: spId,
          sponsorName: spName,
          estimatedCost,
          department: department || (targetType === "training" ? "Ban Đào tạo & Sự kiện" : "Ban Sự kiện & Hậu cần"),
          note: note.trim(),
        }),
      });

      toast.success("Đã khai báo vật dụng hỗ trợ thành công!");
      setItemName("");
      setQuantity("1");
      setEstimatedCost(0);
      setNote("");
      setIsFromSponsor(false);
      setSelectedSponsorItem("");
      loadSupplies();
    } catch {
      toast.error("Không thể lưu vật dụng khai báo");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa vật dụng này khỏi danh sách?")) return;
    try {
      await fetchNestApi(`/supplies/${id}`, { method: "DELETE" });
      toast.success("Đã xóa vật dụng");
      loadSupplies();
    } catch {
      toast.error("Không thể xóa vật dụng");
    }
  };

  const handleSendExpenseProposal = async () => {
    if (items.length === 0) {
      toast.info("Chưa có vật dụng nào trong danh sách để gửi duyệt");
      return;
    }

    const cashItems = items.filter((i) => !i.isFromSponsor && i.estimatedCost > 0);
    const inKindItems = items.filter((i) => i.isFromSponsor);
    const totalCash = cashItems.reduce((acc, cur) => acc + cur.estimatedCost * cur.quantity, 0);

    let fundType = "general";
    if (cashItems.length > 0 && inKindItems.length > 0) fundType = "hybrid";
    else if (inKindItems.length > 0 && cashItems.length === 0) fundType = "sponsor_in_kind";

    try {
      await fetchNestApi("/admin/expense-requests", {
        method: "POST",
        body: JSON.stringify({
          title: `Đề xuất cấp kinh phí & xuất kho hiện vật: ${targetName}`,
          fundType,
          targetType,
          targetId,
          targetName,
          department: department || (targetType === "training" ? "Ban Học Tập" : "Ban Sự Kiện – Hậu Cần"),
          recipientName: "Trưởng Ban Hậu Cần",
          amount: totalCash,
          reason: `Ban Sự Kiện – Hậu Cần lập dự trù vật tư, thiết bị và xuất kho phục vụ ${targetType === "event" ? "sự kiện" : "buổi học"} "${targetName}"`,
          items: items.map((i) => ({
            itemName: i.itemName,
            quantity: i.quantity,
            unit: i.unit,
            cost: i.estimatedCost,
            isFromSponsor: i.isFromSponsor,
            sponsorId: i.sponsorId || null,
            sponsorName: i.sponsorName || "",
          })),
        }),
      });

      toast.success("Đã gửi yêu cầu duyệt kinh phí & xuất kho tới Ban Tài Chính – Tài Trợ thành công!");
    } catch {
      toast.error("Không thể gửi đề xuất duyệt chi lúc này");
    }
  };

  const handlePrintVoucherPdf = () => {
    if (items.length === 0) {
      toast.info("Chưa có dữ liệu vật phẩm để xuất chứng từ PDF");
      return;
    }

    const printWin = window.open("", "_blank");
    if (!printWin) return;

    const cashTotal = items.filter(i => !i.isFromSponsor).reduce((sum, i) => sum + i.estimatedCost * i.quantity, 0);
    const inKindTotal = items.filter(i => i.isFromSponsor).length;

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Phiếu Xuất Kho Hiện Vật & Chứng Từ Quyết Toán - CEO HN10</title>
        <style>
          body { font-family: 'Times New Roman', Times, serif; padding: 40px; color: #111; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #003B95; padding-bottom: 12px; margin-bottom: 24px; }
          .title { text-align: center; margin: 20px 0; }
          .title h1 { margin: 0; font-size: 20px; color: #003B95; text-transform: uppercase; }
          .title p { margin: 4px 0 0 0; font-size: 13px; font-style: italic; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
          th, td { border: 1px solid #333; padding: 8px 10px; text-align: left; }
          th { background: #f0f4f8; font-weight: bold; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .signatures { display: flex; justify-content: space-between; margin-top: 48px; text-align: center; font-size: 13px; }
          .signatures div { width: 30%; }
          .signatures p.name { margin-top: 60px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <strong>CEOHN10 DOANH NGHIỆP TRẺ HÀ NỘI (HANOIBA)</strong><br/>
            <strong>CLB DOANH NHÂN CEO HN10</strong><br/>
            <span>Ban Sự Kiện – Hậu Cần & Ban Tài Chính</span>
          </div>
          <div style="text-align: right;">
            <strong>Mẫu số: 02-VT/CEOHN10</strong><br/>
            <span>Mã chứng từ: CT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}</span><br/>
            <span>Ngày in: ${new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>

        <div class="title">
          <h1>BẢNG KÊ DỰ TRÙ VẬT TƯ & PHIẾU XUẤT KHO HIỆN VẬT TÀI TRỢ</h1>
          <p>Áp dụng cho: <strong>${targetName}</strong> (${targetType === 'event' ? 'Sự Kiện' : 'Buổi Học'})</p>
        </div>

        <table>
          <thead>
            <tr>
              <th class="text-center" style="width: 40px;">STT</th>
              <th>Tên vật dụng / Hiện vật</th>
              <th class="text-center" style="width: 90px;">Số lượng</th>
              <th>Nguồn cấp phát</th>
              <th class="text-right" style="width: 120px;">Dự toán chi phí</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((it, idx) => `
              <tr>
                <td class="text-center">${idx + 1}</td>
                <td><strong>${it.itemName}</strong></td>
                <td class="text-center">${it.quantity} ${it.unit}</td>
                <td>${it.isFromSponsor ? 'Kho Tài Trợ (NTT: ' + (it.sponsorName || 'Nhà tài trợ') + ')' : 'Ban Hậu cần mua mới'}</td>
                <td class="text-right">${it.estimatedCost ? (it.estimatedCost * it.quantity).toLocaleString('vi-VN') + ' đ' : '0 đ'}</td>
                <td>${it.note || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr style="font-weight: bold; background: #fafafa;">
              <td colspan="4" class="text-right">Tổng kinh phí mua mới dự kiến:</td>
              <td class="text-right">${cashTotal.toLocaleString('vi-VN')} đ</td>
              <td>${inKindTotal} hạng mục từ kho tài trợ</td>
            </tr>
          </tfoot>
        </table>

        <div class="signatures">
          <div>
            <strong>NGƯỜI LẬP BÁO CÁO</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em><br/>
            <p class="name">Ban Sự Kiện – Hậu Cần</p>
          </div>
          <div>
            <strong>TRƯỞNG BAN TÀI CHÍNH</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em><br/>
            <p class="name">Lê Thị Thủy</p>
          </div>
          <div>
            <strong>CHỦ TỊCH / LỚP TRƯỞNG</strong><br/>
            <em>(Ký, ghi rõ họ tên)</em><br/>
            <p class="name">Trần Xuân Thắng</p>
          </div>
        </div>

        <script>
          window.onload = function() { window.print(); }
        </script>
      </body>
      </html>
    `);
    printWin.document.close();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Khai Báo Vật Dụng Hỗ Trợ & Hậu Cần (Ban Sự kiện & Hậu cần)
              </h2>
              <p className="text-xs text-muted-foreground truncate max-w-lg">
                Áp dụng cho: <span className="font-semibold text-primary">{targetName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Form thêm mới */}
          <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Thêm vật dụng / thiết yếu phẩm cần chuẩn bị
              </span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-amber-600 dark:text-amber-400">
                <input
                  type="checkbox"
                  checked={isFromSponsor}
                  onChange={(e) => {
                    setIsFromSponsor(e.target.checked);
                    if (!e.target.checked) setSelectedSponsorItem("");
                  }}
                  className="rounded border-border text-primary focus:ring-primary/30"
                />
                <Gift className="h-3.5 w-3.5" /> Lấy từ kho hiện vật Nhà Tài Trợ
              </label>
            </div>

            <form onSubmit={handleAddSupply} className="space-y-3">
              {isFromSponsor && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                  <label className="mb-1 block text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Chọn vật phẩm trong kho tài trợ của Doanh nghiệp:
                  </label>
                  {sponsorInventory.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic">
                      Hiện chưa có hiện vật nào khả dụng từ các nhà tài trợ. Vui lòng khai báo mua mới hoặc liên hệ Ban Tài Trợ.
                    </p>
                  ) : (
                    <select
                      value={selectedSponsorItem}
                      onChange={(e) => handleSelectSponsorItem(e.target.value)}
                      className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                      <option value="">-- Chọn hiện vật có sẵn từ nhà tài trợ --</option>
                      {sponsorInventory.map((sp) => (
                        <option
                          key={`${sp.sponsorId}-${sp.itemName}`}
                          value={`${sp.sponsorId}-${sp.itemName}`}
                        >
                          {sp.itemName} (Còn {sp.availableQuantity} {sp.unit}) — Nhà tài trợ: {sp.sponsorName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                    Tên vật dụng / Trang thiết bị *
                  </label>
                  <input
                    type="text"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="VD: Máy chiếu, Loa mic, Nước uống, Banner..."
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                    Số lượng *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Cái, Bộ, Thùng..."
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                    Dự toán chi phí (nếu cần mua mới)
                  </label>
                  <VndCurrencyInput
                    value={estimatedCost}
                    onChange={(val) => setEstimatedCost(val)}
                    placeholder="0 đ"
                    className="h-9 text-xs"
                    disabled={isFromSponsor}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                    Ghi chú / Đơn vị cung cấp
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Vị trí lắp đặt, liên hệ ai..."
                    className="h-9 w-full rounded-xl border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" />
                  {submitting ? "Đang lưu..." : "Thêm vào danh sách"}
                </button>
              </div>
            </form>
          </div>

          {/* Danh sách vật dụng đã khai báo */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Danh sách vật tư đã khai báo ({items.length})
              </h3>
              {items.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSendExpenseProposal}
                    className="flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                  >
                    <Send className="h-3.5 w-3.5" /> Gửi Yêu Cầu Duyệt Chi
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintVoucherPdf}
                    className="flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition"
                  >
                    <FileText className="h-3.5 w-3.5" /> Xuất Chứng Từ PDF
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-muted-foreground">Đang tải danh sách...</div>
            ) : items.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <Package className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                <p className="text-xs text-muted-foreground">Chưa có vật dụng nào được khai báo cho hoạt động này.</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-2.5 px-3">Tên vật phẩm</th>
                      <th className="py-2.5 px-3">Số lượng</th>
                      <th className="py-2.5 px-3">Nguồn cung cấp</th>
                      <th className="py-2.5 px-3">Dự toán chi phí</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((it) => (
                      <tr key={it.id} className="hover:bg-muted/30">
                        <td className="py-2.5 px-3 font-medium text-foreground">
                          {it.itemName}
                          {it.note && <div className="text-[10px] text-muted-foreground truncate">{it.note}</div>}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {it.quantity} {it.unit}
                        </td>
                        <td className="py-2.5 px-3">
                          {it.isFromSponsor ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                              <Gift className="h-3 w-3" /> NTT: {it.sponsorName || "Hiện vật"}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              <Building2 className="h-3 w-3" /> Ban Hậu cần mua mới
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-foreground">
                          {it.estimatedCost > 0 ? `${(it.estimatedCost * it.quantity).toLocaleString("vi-VN")} đ` : "0 đ (Tài trợ)"}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-[#334155] border border-slate-200">
                            <CheckCircle2 className="h-3 w-3" /> {it.status === "ready" ? "Sẵn sàng" : "Đã duyệt cấp"}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(it.id)}
                            className="rounded-lg p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                            title="Xóa"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-border px-6 py-3 bg-muted/10">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
