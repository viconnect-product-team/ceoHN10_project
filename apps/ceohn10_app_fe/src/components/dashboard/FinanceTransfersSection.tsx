import React, { useState, useEffect } from "react";
import {
  ArrowLeftRight,
  Plus,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  FileText,
  ShieldCheck,
  RefreshCw,
  Info,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export function FinanceTransfersSection({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [funds, setFunds] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [sourceFundId, setSourceFundId] = useState("");
  const [destFundId, setDestFundId] = useState("");
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [trfRes, fundsRes] = await Promise.all([
        fetchNestApi<any[]>("/finance-init/transfers").catch(() => []),
        fetchNestApi<any[]>("/finance-init/funds").catch(() => []),
      ]);
      setTransfers(Array.isArray(trfRes) ? trfRes : []);
      const fList = Array.isArray(fundsRes) ? fundsRes : [];
      setFunds(fList);
      if (fList.length >= 2) {
        setSourceFundId(fList[0].id);
        setDestFundId(fList[1].id);
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi tải thông tin điều chuyển nội bộ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceFundId || !destFundId) {
      toast.error("Vui lòng chọn đầy đủ Quỹ nguồn và Quỹ đích");
      return;
    }
    if (sourceFundId === destFundId) {
      toast.error("Quỹ nguồn và Quỹ đích không được trùng nhau");
      return;
    }
    if (amount <= 0) {
      toast.error("Số tiền điều chuyển phải lớn hơn 0");
      return;
    }
    if (!description.trim()) {
      toast.error("Vui lòng nhập lý do/diễn giải điều chuyển");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetchNestApi<any>("/finance-init/transfers", {
        method: "POST",
        body: JSON.stringify({
          sourceFundId,
          destFundId,
          amount,
          description: description.trim(),
        }),
      });

      if (res && res.id) {
        toast.success(`Đã thực hiện lệnh điều chuyển ${amount.toLocaleString("vi-VN")} đ thành công!`);
        setModalOpen(false);
        setAmount(0);
        setDescription("");
        loadData();
      } else {
        toast.error(res?.message || "Không thể thực hiện điều chuyển");
      }
    } catch (err: any) {
      toast.error(err?.message || "Lỗi khi lập lệnh điều chuyển");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER & CALLOUT NGUYÊN TẮC ĐIỀU CHUYỂN ── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
                <ArrowLeftRight className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Sổ Điều Chuyển Nội Bộ Giữa Các Quỹ (Internal Transfers)
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Quản lý các lệnh cấp phát kinh phí, tạm ứng và hoàn ứng giữa Quỹ Tổng và các Quỹ Ban Chuyên Môn CEO HN10.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới
            </button>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#003B95] hover:bg-[#002b70] text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Plus className="size-4" /> Lập Lệnh Điều Chuyển Mới
            </button>
          </div>
        </div>

        {/* ── ĐIỀU CHUYỂN NỔI BẬT: 20 TRIỆU CHO BAN CÔNG NGHỆ ── */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white uppercase tracking-wider inline-flex items-center gap-1">
              <ShieldCheck className="size-3" /> Nghiệp Vụ Đã Xác Nhận
            </span>
            <h4 className="text-sm font-bold text-indigo-950">
              Khoản Cấp Kinh Phí 20.000.000 VNĐ Cho Ban Công Nghệ
            </h4>
            <p className="text-xs text-indigo-800 max-w-2xl leading-relaxed">
              Khoản tiền 20 triệu cấp cho Ban Công nghệ là giao dịch <strong>TRANSFER</strong> (điều chuyển nội bộ) từ Quỹ Tổng sang Quỹ Ban Công nghệ, bao gồm 2 bút toán đối ứng <code>TRANSFER_OUT</code> và <code>TRANSFER_IN</code> trong cùng database transaction.
            </p>
          </div>

          <div className="shrink-0 p-3.5 rounded-xl bg-white border border-indigo-200 text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Số Tiền Điều Chuyển</span>
            <div className="text-xl font-black text-indigo-700">20.000.000 đ</div>
            <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">✓ Không sinh doanh thu ảo</span>
          </div>
        </div>
      </div>

      {/* ── BẢNG DANH SÁCH LỆNH ĐIỀU CHUYỂN ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Mã Lệnh Chuyển</th>
                <th className="py-3 px-4">Ngày Chuyển</th>
                <th className="py-3 px-4">Quỹ Nguồn (Xuất)</th>
                <th className="py-3 px-4">Quỹ Đích (Nhận)</th>
                <th className="py-3 px-4 text-right">Số Tiền (VNĐ)</th>
                <th className="py-3 px-4">Số Phiếu Chi / Thu</th>
                <th className="py-3 px-4">Nội Dung / Diễn Giải</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {transfers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Chưa có lệnh điều chuyển nội bộ nào.
                  </td>
                </tr>
              ) : (
                transfers.map((trf, idx) => (
                  <tr key={trf.id || idx} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {trf.transfer_id}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      {trf.transfer_date ? String(trf.transfer_date).slice(0, 10) : "Hôm nay"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        {trf.source_fund?.name || trf.source_fund_id}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {trf.destination_fund?.name || trf.destination_fund_id}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-indigo-700 text-sm">
                      {trf.amount.toLocaleString("vi-VN")} đ
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      <div>{trf.source_voucher_no || "PC-TRF"}</div>
                      <div>{trf.dest_voucher_no || "PT-TRF"}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-xs truncate" title={trf.description}>
                      {trf.description}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="size-3" /> Hoàn tất
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL LẬP LỆNH ĐIỀU CHUYỂN MỚI ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ArrowLeftRight className="size-5 text-[#003B95]" /> Lập Lệnh Điều Chuyển Quỹ Nội Bộ
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Quỹ nguồn (Xuất tiền) *</label>
                <select
                  value={sourceFundId}
                  onChange={(e) => setSourceFundId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-medium text-slate-800 outline-none"
                >
                  {funds.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} (Số dư: {Number(f.current_balance || 0).toLocaleString("vi-VN")} đ)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Quỹ đích (Nhận tiền) *</label>
                <select
                  value={destFundId}
                  onChange={(e) => setDestFundId(e.target.value)}
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
                <label className="font-bold text-slate-700 block mb-1">Số tiền điều chuyển (VNĐ) *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="VD: 20000000"
                  className="w-full h-10 px-3 rounded-xl border border-slate-300 font-mono font-bold text-sm text-slate-900 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nội dung / Căn cứ điều chuyển *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="VD: Cấp kinh phí hoạt động Ban Công Nghệ theo quyết định phê duyệt..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs text-slate-800 outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[11px] leading-relaxed">
                ℹ️ <strong>Lưu ý:</strong> Hệ thống tự động tạo 2 bút toán TRANSFER_OUT và TRANSFER_IN trong cùng 1 transaction. Giao dịch này bảo toàn tổng tài sản và không tạo doanh thu hay chi phí giả.
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
                  {submitting ? "Đang xử lý..." : "Xác Nhận Điều Chuyển"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
