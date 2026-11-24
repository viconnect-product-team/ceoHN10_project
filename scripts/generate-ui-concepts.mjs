import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const ARTIFACT_DIR = "C:/Users/vumik/.gemini/antigravity/brain/69ed2331-0463-4ee7-b5bb-e8370d63b97b";
const PUBLIC_DIR = "d:/download/VICONNECT/CEO_VIONE_PROJECT/ceoHN10_project/apps/ceohn10_app_fe/public/concepts";

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

function wrapPhoneFrame(contentHtml, screenBg) {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #0b0f19;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 24px;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .device-frame {
    width: 390px;
    height: 844px;
    background: ${screenBg};
    border-radius: 54px;
    border: 12px solid #27272a;
    box-shadow:
      0 0 0 2px #52525b,
      0 30px 80px -15px rgba(0, 0, 0, 0.7),
      inset 0 0 4px rgba(255, 255, 255, 0.2);
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
  .status-bar {
    height: 48px;
    padding: 10px 24px 0 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    font-weight: 700;
    color: #1c1917;
    z-index: 50;
    flex-shrink: 0;
  }
  .dynamic-island {
    width: 120px;
    height: 32px;
    background: #000000;
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-right: 10px;
    margin: 0 auto;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    top: 10px;
  }
  .camera-dot {
    width: 10px;
    height: 10px;
    background: #111827;
    border: 1.5px solid #1f2937;
    border-radius: 50%;
  }
  .status-icons {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .screen-content {
    flex: 1;
    overflow-y: hidden;
    padding: 10px 18px 20px 18px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
</style>
</head>
<body>
<div class="device-frame">
  <div class="status-bar">
    <span>09:41</span>
    <div class="dynamic-island"><div class="camera-dot"></div></div>
    <div class="status-icons">
      <span style="font-size: 11px; font-weight: 800; letter-spacing: 0.05em;">5G</span>
      <svg width="18" height="11" viewBox="0 0 18 11" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="14" height="10" rx="2.5" stroke="#1C1917" />
        <rect x="2" y="2" width="9.5" height="7" rx="1.5" fill="#1C1917" />
        <path d="M16 4V7" stroke="#1C1917" stroke-width="1.5" stroke-linecap="round" />
      </svg>
    </div>
  </div>
  ${contentHtml}
</div>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 1: Modern Luxury Ivory (Có Event Slide)
// ─────────────────────────────────────────────────────────────────────────────
const concept1Content = `
<style>
  .c1-header { display: flex; justify-content: space-between; align-items: center; }
  .c1-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; background: #F3EBDD; border: 1px solid #E2D3BE; border-radius: 20px; font-size: 10px; font-weight: 800; color: #9A7B38; text-transform: uppercase; }
  .c1-user { font-size: 20px; font-weight: 800; color: #262018; margin-top: 2px; }
  .c1-avatar { width: 44px; height: 44px; border-radius: 50%; background: linear-gradient(135deg, #C5A059 0%, #EBD59B 100%); padding: 2px; position: relative; }
  .c1-avatar-inner { width: 100%; height: 100%; border-radius: 50%; background: #FAF7F2; display: flex; align-items: center; justify-content: center; font-weight: 800; color: #9A7B38; }
  .c1-online { width: 10px; height: 10px; background: #10B981; border: 2px solid #FAF7F2; border-radius: 50%; position: absolute; bottom: 0; right: 0; }
  
  /* Slide Sự Kiện */
  .c1-slide-wrap { display: flex; gap: 10px; overflow: hidden; margin-top: 2px; }
  .c1-hero-slide { width: 310px; flex-shrink: 0; background: linear-gradient(135deg, #2E261E 0%, #1F1913 100%); border-radius: 22px; padding: 16px 18px; color: #FFF; border: 1.5px solid #C5A059; box-shadow: 0 12px 30px rgba(46,38,30,0.35); }
  .c1-peek-slide { width: 40px; flex-shrink: 0; background: linear-gradient(135deg, #3D3226 0%, #261F17 100%); border-radius: 22px 0 0 22px; border: 1.5px solid #8C734B; border-right: none; opacity: 0.8; }
  .c1-slide-dots { display: flex; justify-content: center; align-items: center; gap: 6px; margin: 4px 0; }
  .c1-dot { width: 6px; height: 6px; border-radius: 50%; background: #D8CFBF; }
  .c1-dot.active { width: 20px; height: 6px; border-radius: 3px; background: #C5A059; }

  .c1-actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .c1-act-card { background: #FFF; border: 1px solid #EBE4D8; border-radius: 18px; padding: 10px 4px; display: flex; flex-direction: column; align-items: center; gap: 6px; box-shadow: 0 3px 10px rgba(160,130,80,0.06); }
  .c1-act-icon { width: 40px; height: 40px; border-radius: 14px; background: #FAF4E8; border: 1px solid #E8DFD1; display: flex; align-items: center; justify-content: center; font-size: 18px; }
  
  .c1-agenda { background: #FFF; border: 1px solid #EBE4D8; border-radius: 20px; padding: 12px 16px; box-shadow: 0 3px 10px rgba(160,130,80,0.06); display: flex; flex-direction: column; gap: 8px; }
  .c1-date-box { width: 46px; height: 50px; background: #FAF4E8; border: 1px solid #D8C8AF; border-radius: 14px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; }
  .c1-nav { margin-top: auto; background: #FFF; border: 1px solid #E8DFD1; border-radius: 26px; height: 54px; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 8px 24px rgba(160,130,80,0.15); }
</style>
<div class="screen-content">
  <div class="c1-header">
    <div>
      <div class="c1-badge">● Hội Viên Doanh Nhân VIP</div>
      <div class="c1-user">Lê Thị Dung</div>
    </div>
    <div class="c1-avatar">
      <div class="c1-avatar-inner">LD</div>
      <div class="c1-online"></div>
    </div>
  </div>

  <!-- Sự Kiện Dạng Slide Vuốt Ngang -->
  <div class="c1-slide-wrap">
    <div class="c1-hero-slide">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 9px; font-weight: 800; padding: 2px 8px; background: rgba(197,160,89,0.3); border: 1px solid #C5A059; border-radius: 12px; color: #EBD59B;">SLIDE 1/3 • ĐẶC QUYỀN</span>
        <span style="font-size: 11px; color: #EBD59B; font-weight: 700;">15/12/2026</span>
      </div>
      <div style="font-size: 16px; font-weight: 800; margin: 8px 0 4px 0; line-height: 1.35;">Dạ Tiệc Tất Niên Year End Party 2026</div>
      <div style="font-size: 11px; color: #D8CFBF; margin-bottom: 8px;">Đêm hội kết nối & vinh danh 500+ Doanh nhân tiêu biểu</div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.15);">
        <span style="font-size: 11px; color: #EBD59B;">📍 Khách sạn Daewoo</span>
        <button style="padding: 5px 12px; background: linear-gradient(135deg, #C5A059 0%, #EBD59B 100%); color: #262018; border-radius: 16px; font-size: 11px; font-weight: 800; border: none;">Xem Vé VIP →</button>
      </div>
    </div>
    <div class="c1-peek-slide"></div>
  </div>

  <div class="c1-slide-dots">
    <div class="c1-dot active"></div>
    <div class="c1-dot"></div>
    <div class="c1-dot"></div>
  </div>

  <div>
    <div style="font-size: 11px; font-weight: 800; color: #8A7B68; text-transform: uppercase; margin-bottom: 6px;">Tác Vụ Nhanh</div>
    <div class="c1-actions">
      <div class="c1-act-card"><div class="c1-act-icon">🎟️</div><span style="font-size: 11px; font-weight: 700; color: #383025;">Check-in</span></div>
      <div class="c1-act-card"><div class="c1-act-icon">📅</div><span style="font-size: 11px; font-weight: 700; color: #383025;">Lịch học</span></div>
      <div class="c1-act-card"><div class="c1-act-icon">🤝</div><span style="font-size: 11px; font-weight: 700; color: #383025;">B2B Match</span></div>
      <div class="c1-act-card"><div class="c1-act-icon">📚</div><span style="font-size: 11px; font-weight: 700; color: #383025;">Tài liệu</span></div>
    </div>
  </div>

  <div class="c1-agenda">
    <div style="display: flex; justify-content: space-between; font-size: 11px; font-weight: 800; color: #8A7B68;">
      <span>LỊCH TRÌNH KHÓA HỌC</span>
      <span style="color: #9A7B38;">Xem tất cả (8)</span>
    </div>
    <div style="display: flex; gap: 10px; align-items: center;">
      <div class="c1-date-box"><span style="font-size: 9px; font-weight: 800; color: #9A7B38;">THỨ 7</span><span style="font-size: 17px; font-weight: 900; color: #262018;">28</span></div>
      <div style="flex: 1; min-width: 0;">
        <div style="font-size: 13px; font-weight: 800; color: #262018; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">Chiến Lược Tái Cấu Trúc Tài Chính & M&A</div>
        <div style="font-size: 11px; color: #786C5A;">08:30 - 11:30 • TS. Nguyễn Trọng Hải</div>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; padding-top: 6px; border-top: 1px solid #F3EDE3;">
      <span style="color: #059669; font-weight: 700;">✓ Đã xác nhận chỗ ngồi</span>
      <span style="font-weight: 800; color: #9A7B38;">Ghế VIP-08</span>
    </div>
  </div>

  <div class="c1-nav">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 800; color: #9A7B38;"><span>🏛️</span><span>Trang chủ</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 600; color: #8C7E6C;"><span>📅</span><span>Lớp học</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 600; color: #8C7E6C;"><span>👥</span><span>B2B Hub</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 600; color: #8C7E6C;"><span>⚙️</span><span>Cá nhân</span></div>
  </div>
</div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 2: Bento Grid (ĐÃ SỬA: KHÔNG DÙNG XANH, KHÔNG DÙNG TÍM, SỰ KIỆN DẠNG SLIDE)
// ─────────────────────────────────────────────────────────────────────────────
const concept2Content = `
<style>
  .c2-header { display: flex; justify-content: space-between; align-items: center; }
  .c2-hub-title { display: flex; align-items: center; gap: 8px; }
  .c2-logo-sq { width: 36px; height: 36px; background: linear-gradient(135deg, #C5A059 0%, #9A7B38 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #FFF; font-weight: 900; font-size: 14px; box-shadow: 0 4px 10px rgba(197,160,89,0.3); }
  .c2-hub-text { font-size: 15px; font-weight: 800; color: #1E1B18; }
  .c2-hub-sub { font-size: 11px; color: #78716C; }

  /* Slide Sự Kiện Bento (NO BLUE, NO PURPLE) */
  .c2-slide-container { display: flex; gap: 8px; overflow: hidden; margin-top: 2px; }
  .c2-slide-card { width: 310px; flex-shrink: 0; background: linear-gradient(135deg, #8B1E2F 0%, #58101C 100%); border-radius: 20px; padding: 14px 16px; color: #FFF; border: 1.5px solid #C5A059; box-shadow: 0 8px 24px rgba(139,30,47,0.35); }
  .c2-slide-peek { width: 40px; flex-shrink: 0; background: linear-gradient(135deg, #A16207 0%, #713F12 100%); border-radius: 20px 0 0 20px; border: 1.5px solid #EAB308; border-right: none; opacity: 0.85; }
  
  .c2-slide-pills { display: flex; justify-content: center; align-items: center; gap: 6px; margin: 4px 0; }
  .c2-spill { width: 6px; height: 6px; border-radius: 50%; background: #D6D3D1; }
  .c2-spill.active { width: 22px; height: 6px; border-radius: 3px; background: #C5A059; }

  /* Bento 2x2 Grid */
  .c2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .c2-bento-card { background: #FFF; border: 1px solid #E7E5E4; border-radius: 20px; padding: 12px 14px; box-shadow: 0 4px 12px rgba(28,25,23,0.04); }
  
  /* Meter Box (Gold, no blue) */
  .c2-meter-box { display: flex; flex-direction: column; align-items: center; justify-content: space-between; }
  .c2-meter-svg { width: 64px; height: 64px; position: relative; display: flex; align-items: center; justify-content: center; margin: 4px 0; }
  
  /* QR 1 Cham (Amber Gold) */
  .c2-qr-box { background: linear-gradient(135deg, #D97706 0%, #B45309 100%); border-radius: 20px; padding: 12px 14px; color: #FFF; display: flex; flex-direction: column; justify-content: space-between; box-shadow: 0 6px 18px rgba(217,119,6,0.3); }
  
  /* Radar B2B (2 Cols, Amber/Warm Bronze, no blue) */
  .c2-radar-full { grid-column: span 2; background: #FFF; border: 1px solid #E7E5E4; border-radius: 20px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 4px 12px rgba(28,25,23,0.04); }
  
  .c2-bottom-dock { margin-top: auto; background: #1C1917; border-radius: 24px; height: 54px; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; color: #A8A29E; }
  .c2-dock-btn.active { color: #F59E0B; font-weight: 800; }
</style>
<div class="screen-content">
  <div class="c2-header">
    <div class="c2-hub-title">
      <div class="c2-logo-sq">10</div>
      <div>
        <div class="c2-hub-text">CEO HN10 Bento Hub</div>
        <div class="c2-hub-sub">Tông Vàng Hoàng Gia & Hổ Phách</div>
      </div>
    </div>
    <div style="display: flex; gap: 8px;">
      <div style="width: 34px; height: 34px; border-radius: 50%; background: #FFF; border: 1px solid #E7E5E4; display: flex; align-items: center; justify-content: center; font-size: 14px;">🔔</div>
      <div style="width: 34px; height: 34px; border-radius: 50%; background: #9A7B38; color: #FFF; font-weight: 800; display: flex; align-items: center; justify-content: center; font-size: 12px;">LD</div>
    </div>
  </div>

  <!-- Bento Event Slide (Carousel) -->
  <div class="c2-slide-container">
    <div class="c2-slide-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 9px; font-weight: 800; padding: 2px 8px; background: rgba(255,255,255,0.2); border-radius: 12px;">SLIDE 1/2 • SẮP DIỄN RA</span>
        <span style="font-size: 11px; font-weight: 700; color: #FDE047;">14:00 - 17:30</span>
      </div>
      <div style="font-size: 15px; font-weight: 800; margin: 6px 0 2px 0;">Lễ Khai Giảng Khóa Học Doanh Trí CEO HN10</div>
      <div style="font-size: 11px; color: #FECDD3; margin-bottom: 8px;">📍 Hội trường Tầng 5 • <strong style="color: #FEF08A;">Ghế VIP A-04</strong></div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.2);">
        <span style="font-size: 10px; color: #BBF7D0; font-weight: 700;">● Sẵn sàng Check-in</span>
        <button style="padding: 4px 12px; background: #FFF; color: #8B1E2F; border-radius: 12px; font-size: 11px; font-weight: 800; border: none;">Mở Vé Cổng</button>
      </div>
    </div>
    <div class="c2-slide-peek"></div>
  </div>

  <div class="c2-slide-pills">
    <div class="c2-spill active"></div>
    <div class="c2-spill"></div>
  </div>

  <!-- Bento Grid (NO BLUE, NO PURPLE) -->
  <div class="c2-grid">
    <!-- Progress (Gold) -->
    <div class="c2-bento-card c2-meter-box">
      <div style="display: flex; justify-content: space-between; width: 100%; font-size: 10px; font-weight: 800; color: #78716C;">
        <span>TIẾN ĐỘ</span>
        <span style="color: #B45309;">8/10</span>
      </div>
      <div class="c2-meter-svg">
        <svg width="64" height="64" viewBox="0 0 36 36" style="transform: rotate(-90deg);">
          <path stroke="#F5F5F4" stroke-width="3.5" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
          <path stroke="#D97706" stroke-dasharray="82, 100" stroke-width="3.5" stroke-linecap="round" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
        </svg>
        <span style="position: absolute; font-size: 15px; font-weight: 900; color: #1C1917;">82%</span>
      </div>
      <div style="font-size: 10px; font-weight: 700; color: #78716C;">Đạt Tín Chỉ</div>
    </div>

    <!-- 1-Tap QR (Amber Gold) -->
    <div class="c2-qr-box">
      <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: 800; color: #FEF3C7;">
        <span>QR 1 CHẠM</span>
        <span style="width: 6px; height: 6px; border-radius: 50%; background: #FFF;"></span>
      </div>
      <div style="width: 46px; height: 46px; background: #FFF; border-radius: 14px; margin: 4px auto; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.15);">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="#B45309"><path d="M4 4h6v6H4zm2 2v2h2V6zm8-2h6v6h-6zm2 2v2h2V6zM4 14h6v6H4zm2 2v2h2v-2zm10 0h2v2h-2zm2-2h2v2h-2zm-2 4h2v2h-2zm2 2h2v2h-2zm-4-2h2v2h-2zm0-4h2v2h-2z"/></svg>
      </div>
      <div style="font-size: 10px; font-weight: 800; text-align: center; background: rgba(255,255,255,0.25); border-radius: 8px; padding: 3px 0;">Quét Ngay</div>
    </div>

    <!-- Radar B2B (Warm Charcoal & Gold, no blue) -->
    <div class="c2-radar-full">
      <div style="display: flex; align-items: center; gap: 10px;">
        <div style="width: 40px; height: 40px; border-radius: 12px; background: #FEF3C7; border: 1px solid #FDE68A; display: flex; align-items: center; justify-content: center; font-size: 18px;">🎯</div>
        <div>
          <div style="font-size: 12px; font-weight: 800; color: #1C1917;">Radar Đối Tác B2B</div>
          <div style="font-size: 10px; color: #78716C;">Tìm thấy <strong style="color: #B45309;">14 Doanh nghiệp</strong> quanh bạn</div>
        </div>
      </div>
      <button style="padding: 5px 12px; background: #1C1917; color: #FFF; border-radius: 10px; font-size: 10px; font-weight: 800; border: none;">Khám Phá</button>
    </div>

    <!-- 2 Mini Bento Cards -->
    <div class="c2-bento-card" style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 18px;">📁</span>
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #1C1917;">28 Tài Liệu</div>
        <div style="font-size: 9px; color: #78716C;">Giáo trình VIP</div>
      </div>
    </div>

    <div class="c2-bento-card" style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 18px;">💬</span>
      <div>
        <div style="font-size: 11px; font-weight: 800; color: #1C1917;">Diễn Đàn Lớp</div>
        <div style="font-size: 9px; color: #059669; font-weight: 700;">12 Thảo Luận Mới</div>
      </div>
    </div>
  </div>

  <div class="c2-bottom-dock">
    <div class="c2-dock-btn active" style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 9px;"><span>⊞</span><span>Bento</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 9px;"><span>📅</span><span>Lịch</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 9px;"><span>👥</span><span>B2B</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 9px;"><span>⚙️</span><span>Tôi</span></div>
  </div>
</div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 3: Editorial Story & Slide
// ─────────────────────────────────────────────────────────────────────────────
const concept3Content = `
<style>
  .c3-header { text-align: center; border-bottom: 1px solid #E8E5DD; padding-bottom: 6px; }
  .c3-kicker { font-size: 9px; font-weight: 900; color: #9A7B38; text-transform: uppercase; letter-spacing: 0.25em; }
  .c3-title { font-size: 20px; font-weight: 900; color: #1A1612; margin: 2px 0; }
  .c3-sub { font-size: 10px; color: #8C8275; font-style: italic; }

  .c3-story-bar { display: flex; justify-content: space-between; padding: 2px 0; }
  .c3-story-item { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .c3-story-ring { width: 50px; height: 50px; border-radius: 50%; background: linear-gradient(135deg, #9A7B38 0%, #EBD59B 100%); padding: 2px; }
  .c3-story-inner { width: 100%; height: 100%; border-radius: 50%; background: #FFF; display: flex; align-items: center; justify-content: center; font-size: 17px; }
  
  /* Slide sự kiện tạp chí */
  .c3-slide-container { display: flex; gap: 10px; overflow: hidden; }
  .c3-slide-item { width: 310px; flex-shrink: 0; background: #FFF; border: 1.5px solid #C5A059; border-radius: 18px; padding: 14px; box-shadow: 0 4px 14px rgba(40,30,20,0.06); }
  .c3-slide-peek { width: 40px; flex-shrink: 0; background: #F7F5F0; border: 1.5px solid #D8C8AF; border-radius: 18px 0 0 18px; border-right: none; }
  .c3-dots { display: flex; justify-content: center; gap: 5px; margin: 2px 0; }
  .c3-dot { width: 5px; height: 5px; border-radius: 50%; background: #D8CFBF; }
  .c3-dot.active { width: 18px; height: 5px; border-radius: 3px; background: #9A7B38; }

  .c3-bottom-nav { margin-top: auto; background: #1A1612; color: #D8CFBF; border-radius: 22px; height: 50px; padding: 0 24px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 700; }
</style>
<div class="screen-content">
  <div class="c3-header">
    <div class="c3-kicker">CLB DOANH NHÂN CEO HN10</div>
    <div class="c3-title">THE EXECUTIVE</div>
    <div class="c3-sub">Ấn phẩm đào tạo & kết nối lãnh đạo • Tháng 11/2026</div>
  </div>

  <div class="c3-story-bar">
    <div class="c3-story-item"><div class="c3-story-ring"><div class="c3-story-inner">👑</div></div><span style="font-size: 10px; font-weight: 700;">Chủ tịch</span></div>
    <div class="c3-story-item"><div class="c3-story-ring"><div class="c3-story-inner">🎓</div></div><span style="font-size: 10px; font-weight: 700;">Lớp học</span></div>
    <div class="c3-story-item"><div class="c3-story-ring"><div class="c3-story-inner">🍸</div></div><span style="font-size: 10px; font-weight: 700;">Gala 2026</span></div>
    <div class="c3-story-item"><div class="c3-story-ring" style="background:#E2E8F0;"><div class="c3-story-inner">🤝</div></div><span style="font-size: 10px; color:#64748B;">B2B VIP</span></div>
    <div class="c3-story-item"><div class="c3-story-ring" style="background:#E2E8F0;"><div class="c3-story-inner">📰</div></div><span style="font-size: 10px; color:#64748B;">Bản tin</span></div>
  </div>

  <!-- Slide Sự Kiện Bìa Tạp Chí -->
  <div class="c3-slide-container">
    <div class="c3-slide-item">
      <div style="display: flex; justify-content: space-between; font-size: 9px; font-weight: 800; color: #8C8275; margin-bottom: 6px;">
        <span>SLIDE 01 • SỰ KIỆN NỔI BẬT</span>
        <span>15 THÁNG 12, 2026</span>
      </div>
      <div style="font-size: 15px; font-weight: 800; color: #1A1612; margin-bottom: 4px;">Dạ Tiệc Tất Niên Year End Party: Khát Vọng Doanh Nhân Thủ Đô</div>
      <div style="font-size: 11px; color: #6E6354; border-left: 2px solid #C5A059; padding-left: 8px; margin: 6px 0; font-style: italic;">
        "Khát vọng vươn xa - Đồng hành vững bước cùng 500+ CEO HanoiBA"
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid #F3EFE8; font-size: 10px;">
        <span style="color: #059669; font-weight: 700;">● 180 CEO Đã Xác Nhận</span>
        <span style="font-weight: 800; color: #9A7B38;">Xem Sơ Đồ VIP →</span>
      </div>
    </div>
    <div class="c3-slide-peek"></div>
  </div>

  <div class="c3-dots">
    <div class="c3-dot active"></div>
    <div class="c3-dot"></div>
  </div>

  <div style="background: #FFF; border: 1px solid #E8E5DD; border-radius: 18px; padding: 12px 14px;">
    <div style="font-size: 9px; font-weight: 800; color: #8C8275; margin-bottom: 4px;">CHẶNG 01 • KHỞI TRÍ DOANH NGHIỆP</div>
    <div style="font-size: 13px; font-weight: 800; color: #1A1612;">Chiến Lược Tái Cấu Trúc Tài Chính & M&A</div>
    <div style="font-size: 10px; color: #78716C; margin-top: 2px;">Giảng viên: TS. Nguyễn Trọng Hải • Thứ 7, 28/11/2026</div>
  </div>

  <div class="c3-bottom-nav">
    <span style="color: #EBD59B;">Ấn phẩm</span>
    <span>Lịch trình</span>
    <span>Hội đồng</span>
    <span>Hồ sơ</span>
  </div>
</div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 4 (MẪU MỚI): Minimalist Platinum & Champagne Slider (KHÔNG XANH, KHÔNG TÍM)
// ─────────────────────────────────────────────────────────────────────────────
const concept4Content = `
<style>
  .c4-header { display: flex; justify-content: space-between; align-items: center; }
  .c4-title { font-size: 18px; font-weight: 900; color: #18181B; }
  .c4-sub { font-size: 11px; color: #71717A; }
  .c4-vip-badge { padding: 4px 10px; background: #F4E8D1; border: 1px solid #E2CCA6; border-radius: 20px; font-size: 10px; font-weight: 800; color: #8C6D2D; }

  /* Event Full Slide (Carousel Tràn Viền) */
  .c4-slide-wrap { display: flex; gap: 10px; overflow: hidden; margin-top: 4px; }
  .c4-slide-card {
    width: 310px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #18181B 0%, #27272A 100%);
    border-radius: 24px;
    padding: 16px 18px;
    color: #FFF;
    border: 1.5px solid #D4AF37;
    box-shadow: 0 10px 25px rgba(24,24,27,0.3);
  }
  .c4-slide-peek {
    width: 40px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #27272A 0%, #3F3F46 100%);
    border-radius: 24px 0 0 24px;
    border: 1.5px solid #A1A1AA;
    border-right: none;
    opacity: 0.7;
  }
  .c4-dots { display: flex; justify-content: center; gap: 6px; margin: 4px 0; }
  .c4-dot { width: 6px; height: 6px; border-radius: 50%; background: #D4D4D8; }
  .c4-dot.active { width: 22px; height: 6px; border-radius: 3px; background: #D4AF37; }

  /* 4 Tác Vụ Quick Dial Tròn (Platinum Style) */
  .c4-dial-row { display: flex; justify-content: space-between; margin-top: 4px; }
  .c4-dial-btn { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .c4-dial-circle {
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: #FFFFFF;
    border: 1px solid #E4E4E7;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.06);
  }
  .c4-dial-label { font-size: 11px; font-weight: 700; color: #27272A; }

  /* Academic Card (Platinum Gold) */
  .c4-academic-card {
    background: #FFFFFF;
    border: 1px solid #E4E4E7;
    border-radius: 20px;
    padding: 14px 16px;
    box-shadow: 0 4px 14px rgba(0,0,0,0.04);
  }
  .c4-progress-bar { height: 6px; border-radius: 3px; background: #F4F4F5; overflow: hidden; margin: 8px 0; }
  .c4-progress-fill { height: 100%; width: 75%; background: linear-gradient(90deg, #D4AF37 0%, #F59E0B 100%); }

  .c4-bottom-nav {
    margin-top: auto;
    background: #FFFFFF;
    border: 1px solid #E4E4E7;
    border-radius: 26px;
    height: 54px;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 10px 25px rgba(0,0,0,0.08);
  }
</style>
<div class="screen-content">
  <div class="c4-header">
    <div>
      <div class="c4-title">CEO HN10 Platinum</div>
      <div class="c4-sub">Hạng Bạch Kim &bull; Doanh Trí Khóa 10</div>
    </div>
    <div class="c4-vip-badge">👑 PLATINUM</div>
  </div>

  <!-- Event Slide (Panorama Carousel) -->
  <div class="c4-slide-wrap">
    <div class="c4-slide-card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 9px; font-weight: 800; padding: 2px 8px; background: rgba(212,175,55,0.25); border: 1px solid #D4AF37; border-radius: 12px; color: #FDE047;">SỰ KIỆN VIP • SLIDE 1/3</span>
        <span style="font-size: 11px; color: #D4AF37; font-weight: 700;">15/12/2026</span>
      </div>
      <div style="font-size: 16px; font-weight: 900; margin: 8px 0 2px 0;">Diễn Đàn Lãnh Đạo Đỉnh Cao 2026</div>
      <div style="font-size: 11px; color: #A1A1AA; margin-bottom: 8px;">Quy tụ 300+ Chủ tịch & CEO HanoiBA toàn quốc</div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.15);">
        <span style="font-size: 11px; color: #FDE047;">📍 Khách sạn Daewoo</span>
        <button style="padding: 5px 12px; background: #D4AF37; color: #18181B; border-radius: 14px; font-size: 11px; font-weight: 900; border: none;">Mở Thẻ Cổng</button>
      </div>
    </div>
    <div class="c4-slide-peek"></div>
  </div>

  <div class="c4-dots">
    <div class="c4-dot active"></div>
    <div class="c4-dot"></div>
    <div class="c4-dot"></div>
  </div>

  <!-- Quick Dial 4 Nút Tròn -->
  <div>
    <div style="font-size: 11px; font-weight: 800; color: #71717A; text-transform: uppercase; margin-bottom: 6px;">Trung Tâm Tác Vụ</div>
    <div class="c4-dial-row">
      <div class="c4-dial-btn"><div class="c4-dial-circle">🎫</div><span class="c4-dial-label">Vé QR</span></div>
      <div class="c4-dial-btn"><div class="c4-dial-circle">📅</div><span class="c4-dial-label">Lịch học</span></div>
      <div class="c4-dial-btn"><div class="c4-dial-circle">🤝</div><span class="c4-dial-label">Giao thương</span></div>
      <div class="c4-dial-btn"><div class="c4-dial-circle">📚</div><span class="c4-dial-label">Tài liệu</span></div>
    </div>
  </div>

  <!-- Tiến Độ Khóa Học Bạch Kim -->
  <div class="c4-academic-card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span style="font-size: 12px; font-weight: 800; color: #18181B;">Tiến Độ Khóa Học Doanh Trí</span>
      <span style="font-size: 12px; font-weight: 900; color: #D4AF37;">75% Hoàn Thành</span>
    </div>
    <div class="c4-progress-bar"><div class="c4-progress-fill"></div></div>
    <div style="display: flex; justify-content: space-between; font-size: 11px; color: #71717A;">
      <span>6/8 Chuyên đề đào tạo</span>
      <span style="font-weight: 700; color: #18181B;">Buổi kế tiếp: 28/11</span>
    </div>
  </div>

  <div class="c4-bottom-nav">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 800; color: #D4AF37;"><span>⚡</span><span>Khám phá</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 600; color: #71717A;"><span>📅</span><span>Lịch trình</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 600; color: #71717A;"><span>🌐</span><span>Mạng lưới</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 600; color: #71717A;"><span>👤</span><span>Hồ sơ</span></div>
  </div>
</div>
`;

// ─────────────────────────────────────────────────────────────────────────────
// CONCEPT 5 (MẪU MỚI): Royal Burgundy & Gold (KHÔNG XANH, KHÔNG TÍM)
// ─────────────────────────────────────────────────────────────────────────────
const concept5Content = `
<style>
  .c5-header { display: flex; justify-content: space-between; align-items: center; }
  .c5-emblem-wrap { display: flex; align-items: center; gap: 8px; }
  .c5-emblem { width: 38px; height: 38px; border-radius: 12px; background: linear-gradient(135deg, #7F1D1D 0%, #991B1B 100%); border: 1.5px solid #F59E0B; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 4px 10px rgba(127,29,29,0.3); }
  .c5-title { font-size: 16px; font-weight: 900; color: #450A0A; }
  .c5-sub { font-size: 11px; color: #92400E; }

  /* Event 3D Stack Slide */
  .c5-slide-wrap { display: flex; gap: 10px; overflow: hidden; margin-top: 4px; }
  .c5-slide-main {
    width: 310px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #7F1D1D 0%, #450A0A 100%);
    border-radius: 22px;
    padding: 16px 18px;
    color: #FFF;
    border: 2px solid #F59E0B;
    box-shadow: 0 12px 28px rgba(69,10,10,0.4);
  }
  .c5-slide-peek {
    width: 40px;
    flex-shrink: 0;
    background: linear-gradient(135deg, #991B1B 0%, #7F1D1D 100%);
    border-radius: 22px 0 0 22px;
    border: 1.5px solid #D97706;
    border-right: none;
    opacity: 0.8;
  }
  .c5-dots { display: flex; justify-content: center; gap: 6px; margin: 4px 0; }
  .c5-dot { width: 6px; height: 6px; border-radius: 50%; background: #FDE68A; }
  .c5-dot.active { width: 22px; height: 6px; border-radius: 3px; background: #B45309; }

  /* 3 Trạm Học Tập Dạng Roadmap */
  .c5-stations { background: #FFFFFF; border: 1px solid #FDE68A; border-radius: 20px; padding: 14px 16px; box-shadow: 0 4px 12px rgba(180,83,9,0.06); }
  .c5-station-row { display: flex; justify-content: space-between; position: relative; margin-top: 10px; }
  .c5-st-line { position: absolute; top: 12px; left: 24px; right: 24px; height: 2px; background: #FDE68A; z-index: 1; }
  .c5-st-item { display: flex; flex-direction: column; align-items: center; gap: 4px; z-index: 2; position: relative; }
  .c5-st-dot { width: 24px; height: 24px; border-radius: 50%; background: #FFF; border: 2px solid #F59E0B; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: #7F1D1D; }
  .c5-st-dot.done { background: #F59E0B; color: #FFF; }
  .c5-st-dot.active { background: #7F1D1D; color: #FFF; border-color: #7F1D1D; box-shadow: 0 0 0 3px rgba(127,29,29,0.2); }
  .c5-st-label { font-size: 10px; font-weight: 700; color: #78350F; text-align: center; }

  /* B2B Connect Bar */
  .c5-b2b-card {
    background: linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%);
    border: 1px solid #FCD34D;
    border-radius: 18px;
    padding: 12px 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .c5-bottom-nav {
    margin-top: auto;
    background: #450A0A;
    border: 1px solid #7F1D1D;
    border-radius: 24px;
    height: 54px;
    padding: 0 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    color: #FDE68A;
    box-shadow: 0 10px 25px rgba(69,10,10,0.3);
  }
</style>
<div class="screen-content">
  <div class="c5-header">
    <div class="c5-emblem-wrap">
      <div class="c5-emblem">🏛️</div>
      <div>
        <div class="c5-title">CEO HN10 Royal</div>
        <div class="c5-sub">Đỏ Rượu Vang & Vàng Kim Hoàng Gia</div>
      </div>
    </div>
    <div style="width: 36px; height: 36px; border-radius: 50%; background: #7F1D1D; color: #FDE68A; font-weight: 900; display: flex; align-items: center; justify-content: center; font-size: 13px; border: 1.5px solid #F59E0B;">LD</div>
  </div>

  <!-- Event 3D Stack Slide (Carousel) -->
  <div class="c5-slide-wrap">
    <div class="c5-slide-main">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 9px; font-weight: 800; padding: 2px 8px; background: rgba(245,158,11,0.3); border: 1px solid #F59E0B; border-radius: 12px; color: #FEF08A;">SLIDE 1/2 • ĐẠI TIỆC 2026</span>
        <span style="font-size: 11px; color: #FDE047; font-weight: 700;">15/12/2026</span>
      </div>
      <div style="font-size: 16px; font-weight: 900; margin: 8px 0 2px 0;">Đại Hội Kết Nối Giao Thương CEO HN10</div>
      <div style="font-size: 11px; color: #FECDD3; margin-bottom: 8px;">Đêm hội vinh danh Doanh nhân tiêu biểu Thủ đô</div>
      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.2);">
        <span style="font-size: 11px; color: #FEF08A;">⏳ Còn 02 ngày</span>
        <button style="padding: 5px 12px; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #450A0A; border-radius: 14px; font-size: 11px; font-weight: 900; border: none;">Đăng Ký Check-in</button>
      </div>
    </div>
    <div class="c5-slide-peek"></div>
  </div>

  <div class="c5-dots">
    <div class="c5-dot active"></div>
    <div class="c5-dot"></div>
  </div>

  <!-- 3 Trạm Hành Trình Đào Tạo -->
  <div class="c5-stations">
    <div style="font-size: 11px; font-weight: 800; color: #7F1D1D; text-transform: uppercase;">Lộ Trình Đào Tạo Doanh Trí</div>
    <div class="c5-station-row">
      <div class="c5-st-line"></div>
      <div class="c5-st-item">
        <div class="c5-st-dot done">✓</div>
        <span class="c5-st-label">Trạm 1: Khai Giảng</span>
      </div>
      <div class="c5-st-item">
        <div class="c5-st-dot active">●</div>
        <span class="c5-st-label" style="color: #7F1D1D; font-weight: 900;">Trạm 2: Tài Chính</span>
      </div>
      <div class="c5-st-item">
        <div class="c5-st-dot">3</div>
        <span class="c5-st-label">Trạm 3: M&A</span>
      </div>
    </div>
  </div>

  <!-- B2B Connect Banner -->
  <div class="c5-b2b-card">
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="font-size: 20px;">🤝</span>
      <div>
        <div style="font-size: 12px; font-weight: 800; color: #7F1D1D;">Giao Thương B2B CLB</div>
        <div style="font-size: 10px; color: #92400E;">180+ Doanh nghiệp sẵn sàng hợp tác</div>
      </div>
    </div>
    <button style="padding: 5px 10px; background: #7F1D1D; color: #FDE68A; border-radius: 10px; font-size: 10px; font-weight: 800; border: none;">Kết Nối</button>
  </div>

  <div class="c5-bottom-nav">
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 900; color: #FFF;"><span>🏛️</span><span>Tổng quan</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 700; color: #FDE68A;"><span>🎓</span><span>Lớp học</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 700; color: #FDE68A;"><span>🤝</span><span>B2B</span></div>
    <div style="display: flex; flex-direction: column; align-items: center; gap: 2px; font-size: 10px; font-weight: 700; color: #FDE68A;"><span>👤</span><span>Hồ sơ</span></div>
  </div>
</div>
`;

async function main() {
  console.log("Launching Chrome to render 5 concepts...");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const context = await browser.newContext({
    viewport: { width: 450, height: 910 },
    deviceScaleFactor: 2, // Retina 2x ultra crisp
  });

  const page = await context.newPage();

  // Concept 1
  await page.setContent(wrapPhoneFrame(concept1Content, "#FAF7F2"), { waitUntil: "load" });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "concept_1_luxury_ivory.png") });
  fs.copyFileSync(path.join(ARTIFACT_DIR, "concept_1_luxury_ivory.png"), path.join(PUBLIC_DIR, "concept_1_luxury_ivory.png"));
  console.log("1. Concept 1 (Modern Luxury Ivory - Event Slide) Done");

  // Concept 2 (SỬA LẠI: NO BLUE, NO PURPLE, EVENT SLIDE)
  await page.setContent(wrapPhoneFrame(concept2Content, "#F5F5F4"), { waitUntil: "load" });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "concept_2_bento_grid.png") });
  fs.copyFileSync(path.join(ARTIFACT_DIR, "concept_2_bento_grid.png"), path.join(PUBLIC_DIR, "concept_2_bento_grid.png"));
  console.log("2. Concept 2 (Bento Grid Refactored - No Blue/Purple, Event Slide) Done");

  // Concept 3
  await page.setContent(wrapPhoneFrame(concept3Content, "#FCFBF9"), { waitUntil: "load" });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "concept_3_editorial_story.png") });
  fs.copyFileSync(path.join(ARTIFACT_DIR, "concept_3_editorial_story.png"), path.join(PUBLIC_DIR, "concept_3_editorial_story.png"));
  console.log("3. Concept 3 (Editorial Story & Slide) Done");

  // Concept 4 (MẪU MỚI: Platinum Minimalist Slider)
  await page.setContent(wrapPhoneFrame(concept4Content, "#F9F9FB"), { waitUntil: "load" });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "concept_4_platinum_slider.png") });
  fs.copyFileSync(path.join(ARTIFACT_DIR, "concept_4_platinum_slider.png"), path.join(PUBLIC_DIR, "concept_4_platinum_slider.png"));
  console.log("4. Concept 4 (Minimalist Platinum & Champagne Slider) Done");

  // Concept 5 (MẪU MỚI: Royal Burgundy & Gold)
  await page.setContent(wrapPhoneFrame(concept5Content, "#FFFBEB"), { waitUntil: "load" });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "concept_5_royal_ruby_gold.png") });
  fs.copyFileSync(path.join(ARTIFACT_DIR, "concept_5_royal_ruby_gold.png"), path.join(PUBLIC_DIR, "concept_5_royal_ruby_gold.png"));
  console.log("5. Concept 5 (Royal Burgundy & Gold) Done");

  await browser.close();
  console.log("ALL 5 CONCEPTS RENDERED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("Render failed:", err);
  process.exit(1);
});
