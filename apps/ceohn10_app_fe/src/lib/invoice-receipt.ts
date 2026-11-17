import type { Transaction } from "./finance.functions";

export function formatVND(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

export function generateInvoiceVoucherHtml(tx: Transaction): string {
  const isThu = tx.type === "income";
  const title = isThu ? "PHIẾU THU TIỀN" : "PHIẾU CHI TIỀN (BÁO CÁO CHI)";
  const voucherCode = tx.id;
  const dateStr = tx.date || new Date().toISOString().slice(0, 10);
  const methodLabel =
    tx.method === "cash"
      ? "Tiền mặt"
      : tx.method === "bank"
        ? "Chuyển khoản ngân hàng"
        : "Thẻ ngân hàng";

  const netAmount =
    tx.type === "expense" && (tx.advanceAmount || 0) > 0
      ? (tx.advanceAmount || 0) - (tx.refundAmount || 0)
      : tx.amount;

  const fundLabel =
    tx.fundType === "sponsorship_cash" || tx.fundType === "sponsorship"
      ? "Túi Quỹ Tài Trợ CEO HN10 (Nguồn Đối Tác / NTT)"
      : "Túi Quỹ Chung CLB (Nguồn Hội Phí Học viên)";

  const deptLabel = tx.targetDepartment || tx.department || "Ban Điều Hành / Chung CLB";
  const eventLabel = tx.targetEventName || tx.eventName || (tx.targetEventId ? `Mã sự kiện: ${tx.targetEventId}` : "Hoạt động & Chi tiêu định kỳ");

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <title>${title} - ${voucherCode}</title>
  <style>
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
    body { background: #f8fafc; padding: 40px 20px; color: #1e293b; margin: 0; }
    .voucher-card {
      max-width: 760px; margin: 0 auto; background: #ffffff; border-radius: 16px;
      padding: 40px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;
    }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #cbd5e1; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 20px; font-weight: 800; color: #334155; letter-spacing: -0.5px; }
    .sub-brand { font-size: 12px; color: #64748b; margin-top: 4px; }
    .voucher-meta { text-align: right; }
    .voucher-no { font-size: 16px; font-weight: 700; color: ${isThu ? "#059669" : "#dc2626"}; font-family: monospace; }
    .voucher-date { font-size: 12px; color: #64748b; margin-top: 4px; }
    .title { text-align: center; font-size: 22px; font-weight: 800; color: #0f172a; margin: 20px 0 25px; letter-spacing: 0.5px; text-transform: uppercase; }
    .fund-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; background: #F1F5F9; color: #334155; font-size: 12px; font-weight: 700; border: 1px solid #E2E8F0; margin-bottom: 15px; }
    .detail-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .detail-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; }
    .detail-table td.label { width: 34%; font-weight: 600; color: #475569; background: #f8fafc; }
    .detail-table td.val { font-weight: 500; color: #0f172a; }
    .highlight-amount { font-size: 19px; font-weight: 800; color: ${isThu ? "#059669" : "#dc2626"}; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
    .sig-title { font-size: 13px; font-weight: 700; color: #334155; }
    .sig-hint { font-size: 11px; color: #94a3b8; margin-top: 4px; }
    .sig-space { height: 75px; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 35px; border-top: 1px dashed #e2e8f0; padding-top: 16px; }
    @media print {
      body { background: transparent; padding: 0; }
      .voucher-card { box-shadow: none; border: none; padding: 20px; max-width: 100%; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="voucher-card">
    <div class="header">
      <div>
        <div class="brand">CLB DOANH NHÂN CEO HN10</div>
        <div class="sub-brand">Hệ thống Quản trị Tài chính & 2 Túi Quỹ (Hội Phí & Tài Trợ)</div>
      </div>
      <div class="voucher-meta">
        <div class="voucher-no">Số: ${voucherCode}</div>
        <div class="voucher-date">Ngày lập: ${dateStr}</div>
      </div>
    </div>

    <div style="text-align: center;">
      <div class="fund-badge">${fundLabel}</div>
    </div>
    <div class="title">${title}</div>

    <table class="detail-table">
      <tr>
        <td class="label">Nguồn xuất chi / Túi quỹ:</td>
        <td class="val"><strong style="color: #334155;">${fundLabel}</strong></td>
      </tr>
      <tr>
        <td class="label">Ban phụ trách / Đề xuất:</td>
        <td class="val"><strong>${deptLabel}</strong> (Ví dụ: Ban Đời Sống / Ban Hậu Cần / Ban Sự Kiện)</td>
      </tr>
      <tr>
        <td class="label">Sự kiện / Cuộc họp chi:</td>
        <td class="val"><strong>${eventLabel}</strong></td>
      </tr>
      <tr>
        <td class="label">${isThu ? "Người nộp tiền:" : "Người nhận tiền / Đơn vị thụ hưởng:"}</td>
        <td class="val"><strong style="color: #0284c7;">${tx.recipient || (isThu ? "Học viên / Khách hàng" : "Cán bộ / Đơn vị thụ hưởng")}</strong></td>
      </tr>
      <tr>
        <td class="label">Nội dung ${isThu ? "thu:" : "chi:"}</td>
        <td class="val">${tx.description}</td>
      </tr>
      <tr>
        <td class="label">Danh mục hạch toán:</td>
        <td class="val"><span style="display:inline-block; padding:3px 8px; border-radius:6px; background:#e2e8f0; font-size:12px; font-weight:600;">${tx.category}</span></td>
      </tr>
      <tr>
        <td class="label">Hình thức thanh toán:</td>
        <td class="val"><strong>${methodLabel}</strong></td>
      </tr>
      ${tx.type === "expense" && (tx.advanceAmount || 0) > 0
      ? `<tr>
              <td class="label">Số tiền tạm ứng ban đầu:</td>
              <td class="val">${formatVND(tx.advanceAmount || 0)}</td>
            </tr>
            <tr>
              <td class="label">Số tiền hoàn ứng thừa:</td>
              <td class="val" style="color:#059669;">- ${formatVND(tx.refundAmount || 0)}</td>
            </tr>
            <tr>
              <td class="label">Số tiền thực chi ròng:</td>
              <td class="val highlight-amount">${formatVND(netAmount)}</td>
            </tr>`
      : `<tr>
              <td class="label">Tổng số tiền:</td>
              <td class="val highlight-amount">${formatVND(tx.amount)}</td>
            </tr>`
    }
      <tr>
        <td class="label">Trạng thái giao dịch:</td>
        <td class="val" style="color: ${tx.status === "completed" ? "#059669" : "#d97706"}; font-weight: 700;">
          ${tx.status === "completed" ? "ĐÃ HOÀN TẤT & PHÊ DUYỆT (HỢP LỆ)" : "CHỜ DUYỆT / TẠM THỜI"}
        </td>
      </tr>
    </table>

    <div class="signatures">
      <div>
        <div class="sig-title">Người lập đề xuất chi</div>
        <div class="sig-hint">(Ban Hậu cần / Ban chuyên môn)</div>
        <div class="sig-space"></div>
        <div style="font-size:12px; font-weight:600;">${tx.recipient || "Ban chuyên môn"}</div>
      </div>
      <div>
        <div class="sig-title">Trưởng Ban Tài Chính</div>
        <div class="sig-hint">(Kiểm soát & phê duyệt cấp quỹ)</div>
        <div class="sig-space"></div>
        <div style="font-size:12px; font-weight:600;">Ban Tài Chính CEO HN10</div>
      </div>
      <div>
        <div class="sig-title">Chủ Tịch CLB CEO HN10</div>
        <div class="sig-hint">(Ký duyệt xuất chi chính thức)</div>
        <div class="sig-space"></div>
        <div style="font-size:12px; font-weight:600;">Chủ Tịch Duyệt</div>
      </div>
    </div>

    <div class="footer">
      Chứng từ điện tử báo cáo chi tiêu được khởi tạo tự động từ hệ thống CEO HN10 CRM. Mã tra cứu: ${voucherCode}
    </div>
  </div>
  <div class="no-print" style="text-align: center; margin-top: 20px;">
    <button onclick="window.print()" style="padding: 10px 24px; background: #334155; color: #fff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 13px;">In Báo Cáo hoặc Lưu Thành File PDF</button>
  </div>
</body>
</html>`;
}

export function printOrExportExpensePdf(tx: Transaction) {
  if (typeof window === "undefined") return;
  const htmlContent = generateInvoiceVoucherHtml(tx);
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      try {
        printWindow.print();
      } catch { }
    }, 400);
  } else {
    downloadInvoiceVoucher(tx);
  }
}

export function downloadInvoiceVoucher(tx: Transaction) {
  const voucherCode = tx.id;
  const htmlContent = generateInvoiceVoucherHtml(tx);
  const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BAO_CAO_CHI_${voucherCode}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
