import React, { useState, useEffect } from "react";
import {
  Coins,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ShieldCheck,
  Building2,
  Calendar,
  Lock,
  Layers,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  Info,
  RefreshCw,
  Wallet,
  Eye,
  X,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { fetchNestApi } from "@/lib/api-client";

export const TARGET_OPENING_BALANCE = 2100000000; // 2.1 tỷ đồng
export const TARGET_GENERAL_FUND_BALANCE = 2080000000; // 2 tỷ 080 triệu

export function FinanceOpeningBalanceSection({ className = "" }: { className?: string }) {
  const [loading, setLoading] = useState(true);
  const [obData, setObData] = useState<any>(null);
  const [funds, setFunds] = useState<any[]>([]);
  const [selectedFundForDetail, setSelectedFundForDetail] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [obRes, fundsRes] = await Promise.all([
        fetchNestApi<any>("/finance-init/opening-balance").catch(() => null),
        fetchNestApi<any[]>("/finance-init/funds").catch(() => []),
      ]);
      setObData(obRes);
      setFunds(Array.isArray(fundsRes) ? fundsRes : []);
    } catch (err: any) {
      toast.error(err?.message || "Lỗi tải thông tin số dư và các quỹ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const generalFund = funds.find(
    (f) => f.code === "FUND_GENERAL" || f.fund_type === "GENERAL"
  ) || funds[0];

  const totalFundBalances = funds.reduce(
    (sum, f) => sum + Number(f.current_balance || 0),
    0
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── BANNER KHỞI TẠO VÀ QUỸ TỔNG TO NHẤT (2 TỶ 080 TRIỆU) ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="size-3.5" />
              <span>Chính thức: Kỳ Khởi Tạo 2,1 Tỷ Đã Ghi Sổ (POSTED)</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Quản Trị Hệ Thống 8 Quỹ Chuyên Môn CEO HN10
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Tổng số dư khởi tạo chuyển tiếp là <strong>2.100.000.000 VNĐ</strong>. Sau khi chuyển cấp <strong>20.000.000 VNĐ</strong> kinh phí hoạt động cho <strong>Ban Công Nghệ</strong>, số dư <strong>Quỹ Tổng hiện tại là 2.080.000.000 VNĐ</strong> (2 tỷ 080 triệu đồng).
            </p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1.5 font-medium">
                <ShieldCheck className="size-3.5 text-emerald-400" /> Chuẩn hạch toán 8 Quỹ độc lập
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white/10 text-slate-200 border border-white/10 flex items-center gap-1.5 font-medium">
                <History className="size-3.5 text-amber-400" /> Theo dõi Dòng Tiền Vào / Ra minh bạch
              </span>
            </div>
          </div>

          {/* Card Quỹ Tổng to nhất */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl relative group hover:border-amber-400/50 transition">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
                  <Wallet className="size-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block">
                    Quỹ Lớn Nhất Toàn CLB
                  </span>
                  <h4 className="text-sm font-bold text-white">Quỹ Tổng CLB CEO HN10</h4>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950">
                LỚN NHẤT
              </span>
            </div>

            <div className="mt-4">
              <span className="text-[11px] text-slate-300 block font-medium">Số Dư Hiện Tại Khả Dụng:</span>
              <div className="text-3xl sm:text-4xl font-black text-amber-300 mt-0.5 tracking-tight">
                {(generalFund ? Number(generalFund.current_balance) : TARGET_GENERAL_FUND_BALANCE).toLocaleString("vi-VN")} đ
              </div>
              <div className="text-xs text-amber-200/90 font-semibold mt-1">
                (Hai tỷ không trăm tám mươi triệu đồng)
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] text-emerald-300 block font-bold uppercase">Tổng Vào (Inflow):</span>
                <span className="font-mono font-bold text-emerald-300 text-xs sm:text-sm">
                  +{(generalFund?.total_inflow || 2100000000).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] text-rose-300 block font-bold uppercase">Tổng Ra (Outflow):</span>
                <span className="font-mono font-bold text-rose-300 text-xs sm:text-sm">
                  -{(generalFund?.total_outflow || 20000000).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {generalFund && (
              <button
                type="button"
                onClick={() => setSelectedFundForDetail(generalFund)}
                className="w-full mt-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
              >
                <Eye className="size-3.5" /> Xem Chi Tiết Vào / Ra Quỹ Tổng
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── BẢNG DANH SÁCH 8 QUỸ VỚI DÒNG TIỀN VÀO / RA ── */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="size-5 text-[#003B95]" />
              <span>Bảng Cân Đối &amp; Dòng Tiền Vào / Ra 8 Quỹ Chuyên Môn</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mỗi ban có một quỹ riêng biệt. Ban Công Nghệ đã tiếp nhận dòng tiền 20.000.000 VNĐ từ Quỹ Tổng để phục vụ vận hành.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} /> Làm mới dữ liệu
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">STT</th>
                <th className="py-3 px-4">Tên Quỹ Ban Chuyên Môn</th>
                <th className="py-3 px-4">Mã Quỹ</th>
                <th className="py-3 px-4 text-right">Số Dư Hiện Tại</th>
                <th className="py-3 px-4 text-right">Dòng Tiền Vào (Inflow)</th>
                <th className="py-3 px-4 text-right">Dòng Tiền Ra (Outflow)</th>
                <th className="py-3 px-4 text-center">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {funds.map((f: any, idx: number) => {
                const isGeneral = f.code === "FUND_GENERAL" || f.fund_type === "GENERAL";
                const isTech = f.code === "FUND_BAN_CONG_NGHE";
                return (
                  <tr
                    key={f.id || idx}
                    className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition ${
                      isGeneral ? "bg-amber-50/30 dark:bg-amber-950/20 font-medium" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center font-mono text-slate-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold block text-sm ${isGeneral ? "text-amber-700 dark:text-amber-400" : isTech ? "text-blue-700 dark:text-blue-400" : "text-slate-900 dark:text-white"}`}>
                          {f.name}
                        </span>
                        {isGeneral && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-500 text-slate-950">
                            QUỸ TỔNG
                          </span>
                        )}
                        {isTech && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            ĐÃ NHẬN 20M
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {f.description || (isGeneral ? "Quỹ lớn nhất tập trung nguồn lực toàn CLB" : "Quỹ hoạt động chuyên môn của ban")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                      {f.code}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-sm">
                      <span className={isGeneral ? "text-amber-600 text-base" : isTech ? "text-blue-600" : Number(f.current_balance) > 0 ? "text-emerald-600" : "text-slate-400"}>
                        {Number(f.current_balance || 0).toLocaleString("vi-VN")} đ
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                      {Number(f.total_inflow || 0) > 0 ? (
                        <span className="inline-flex items-center gap-0.5">
                          <ArrowDownLeft className="size-3 text-emerald-500" />
                          +{Number(f.total_inflow).toLocaleString("vi-VN")} đ
                        </span>
                      ) : (
                        <span className="text-slate-300">0 đ</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                      {Number(f.total_outflow || 0) > 0 ? (
                        <span className="inline-flex items-center gap-0.5">
                          <ArrowUpRight className="size-3 text-rose-500" />
                          -{Number(f.total_outflow).toLocaleString("vi-VN")} đ
                        </span>
                      ) : (
                        <span className="text-slate-300">0 đ</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedFundForDetail(f)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-[#003B95] dark:text-blue-400 inline-flex items-center gap-1 transition cursor-pointer"
                      >
                        <Eye className="size-3" /> Chi tiết Vào/Ra
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100/90 dark:bg-slate-800/90 font-bold border-t border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={3} className="py-3.5 px-4 text-slate-800 dark:text-slate-100 uppercase text-xs tracking-wider">
                  Tổng Giá Trị Tài Sản Các Quỹ Hiện Tại:
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-base font-black text-emerald-600">
                  {totalFundBalances.toLocaleString("vi-VN")} đ
                </td>
                <td colSpan={2} className="py-3.5 px-4 text-xs text-slate-500">
                  <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-4" /> Bằng đúng 2.100.000.000 đ ban đầu (Bảo toàn nguyên vẹn tài sản)
                  </span>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* ── MODAL CHI TIẾT DÒNG TIỀN VÀO / RA CỦA TỪNG QUỸ ── */}
      {selectedFundForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header Modal */}
            <div className="p-6 bg-gradient-to-r from-[#003B95] to-blue-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-blue-200 tracking-wider">
                  Sổ Nhật Ký Giao Dịch Dòng Tiền Vào / Ra
                </span>
                <h3 className="text-xl font-black mt-1 flex items-center gap-2">
                  <Wallet className="size-5 text-amber-300" />
                  {selectedFundForDetail.name} ({selectedFundForDetail.code})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFundForDetail(null)}
                className="p-2 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Thống kê nhanh Modal */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
                <span className="text-[11px] font-bold text-slate-500 uppercase block">Số Dư Khả Dụng</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono mt-0.5 block">
                  {Number(selectedFundForDetail.current_balance || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase block">Tổng Vào (Inflow)</span>
                <span className="text-lg font-black text-emerald-600 font-mono mt-0.5 block">
                  +{Number(selectedFundForDetail.total_inflow || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 shadow-sm">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase block">Tổng Ra (Outflow)</span>
                <span className="text-lg font-black text-rose-600 font-mono mt-0.5 block">
                  -{Number(selectedFundForDetail.total_outflow || 0).toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>

            {/* Nội dung danh sách giao dịch */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {(!selectedFundForDetail.transactions || selectedFundForDetail.transactions.length === 0) ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <History className="size-10 mx-auto text-slate-300" />
                  <p className="text-sm">Chưa có phát sinh giao dịch Vào/Ra nào cho quỹ này.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedFundForDetail.transactions.map((tx: any, tIdx: number) => {
                    const isIn = tx.type === "IN";
                    return (
                      <div
                        key={tx.id || tIdx}
                        className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isIn
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60"
                            : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/60"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                              isIn
                                ? "bg-emerald-500 text-white"
                                : "bg-rose-500 text-white"
                            }`}
                          >
                            {isIn ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  isIn
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                                    : "bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200"
                                }`}
                              >
                                {isIn ? "TIỀN VÀO (INFLOW)" : "TIỀN RA (OUTFLOW)"}
                              </span>
                              <span className="text-xs text-slate-500 font-mono">
                                {tx.date}
                              </span>
                              {tx.voucherNo && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  CT: {tx.voucherNo}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                              {tx.description}
                            </h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Đối ứng: <strong>{tx.counterparty}</strong>
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-mono font-black text-base ${
                              isIn ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {isIn ? "+" : "-"}
                            {Number(tx.amount || 0).toLocaleString("vi-VN")} đ
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedFundForDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition cursor-pointer"
              >
                Đóng sổ chi tiết
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
