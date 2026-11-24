import fs from "fs";
import path from "path";

const dir = "C:/Users/vumik/.gemini/antigravity/brain/69ed2331-0463-4ee7-b5bb-e8370d63b97b";
const b1 = fs.readFileSync(path.join(dir, "concept_1_luxury_ivory.png")).toString("base64");
const b2 = fs.readFileSync(path.join(dir, "concept_2_bento_grid.png")).toString("base64");
const b3 = fs.readFileSync(path.join(dir, "concept_3_editorial_story.png")).toString("base64");
const b4 = fs.readFileSync(path.join(dir, "concept_4_platinum_slider.png")).toString("base64");
const b5 = fs.readFileSync(path.join(dir, "concept_5_royal_ruby_gold.png")).toString("base64");

const html = `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>5 Bản Thiết Kế Đột Phá - App CEO HN10</title>
<style>
* { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #0f172a;
  color: #f8fafc;
  margin: 0;
  padding: 24px;
}
.header { text-align: center; margin-bottom: 24px; }
.header h1 { font-size: 26px; font-weight: 800; color: #ffffff; margin: 0 0 8px 0; }
.header p { color: #94a3b8; font-size: 14px; margin: 0; }
.rule-banner {
  max-width: 960px;
  margin: 0 auto 20px auto;
  background: rgba(217,119,6,0.12);
  border: 1px solid rgba(217,119,6,0.35);
  border-radius: 14px;
  padding: 10px 16px;
  font-size: 13px;
  color: #fde68a;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tabs { display: flex; justify-content: center; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; max-width: 1000px; margin-left: auto; margin-right: auto; }
.tab-btn {
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid #334155;
  background: #1e293b;
  color: #94a3b8;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.tab-btn:hover { background: #334155; color: #fff; }
.tab-btn.active {
  background: #D97706;
  color: #fff;
  border-color: #FBBF24;
  box-shadow: 0 4px 16px rgba(217,119,6,0.4);
}
.panel {
  display: none;
  max-width: 960px;
  margin: 0 auto;
  background: #1e293b;
  border-radius: 28px;
  padding: 30px;
  border: 1px solid #334155;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
}
.panel.active {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 32px;
  align-items: center;
}
@media (max-width: 820px) {
  .panel.active { grid-template-columns: 1fr; text-align: center; }
}
.phone-mockup { text-align: center; }
.phone-mockup img {
  width: 100%;
  max-width: 340px;
  border-radius: 36px;
  box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6);
  border: 4px solid #475569;
}
.badge {
  display: inline-block;
  padding: 5px 12px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.badge.gold { background: rgba(234,179,8,0.18); color: #facc15; border: 1px solid rgba(234,179,8,0.4); }
.badge.amber { background: rgba(245,158,11,0.2); color: #fbbf24; border: 1px solid rgba(245,158,11,0.5); }
.badge.red { background: rgba(220,38,38,0.2); color: #f87171; border: 1px solid rgba(220,38,38,0.4); }
.badge.plat { background: rgba(244,244,245,0.15); color: #ffffff; border: 1px solid rgba(244,244,245,0.3); }
.details h2 { font-size: 22px; font-weight: 800; margin: 0 0 14px 0; color: #ffffff; }
.details ul { padding-left: 20px; color: #cbd5e1; font-size: 13.5px; line-height: 1.8; margin: 0 0 20px 0; }
.details li { margin-bottom: 6px; }
.summary-card {
  background: rgba(15,23,42,0.6);
  border: 1px solid #334155;
  border-radius: 14px;
  padding: 14px 18px;
  font-size: 13px;
  color: #94a3b8;
}
.summary-card strong { color: #f8fafc; }
</style>
</head>
<body>

<div class="header">
  <h1>5 BẢN THIẾT KẾ ĐỘT PHÁ - APP CEO HN10</h1>
  <p>Triệt tiêu 100% màu đen u tối &bull; <strong>Không dùng màu xanh, không dùng màu tím</strong> &bull; Sự kiện dạng SLIDE lướt ngang</p>
</div>

<div class="rule-banner">
  <span>✨ <strong>Đã cập nhật theo yêu cầu:</strong> Mẫu 2 sửa thành tông Hổ Phách & Vàng Gold (gỡ bỏ hoàn toàn màu xanh/tím) + Thêm Mẫu 4 Platinum Slider & Mẫu 5 Royal Burgundy Slider.</span>
  <span style="font-weight: 700; color: #fbbf24;">5 Phương Án Lựa Chọn</span>
</div>

<div class="tabs">
  <button class="tab-btn active" onclick="showTab(1)">Bản 1: Luxury Ivory (Slide)</button>
  <button class="tab-btn" onclick="showTab(2)">Bản 2: Bento Grid (Đã Sửa - Không Xanh/Tím)</button>
  <button class="tab-btn" onclick="showTab(3)">Bản 3: Editorial Story & Slide</button>
  <button class="tab-btn" onclick="showTab(4)">Bản 4: Platinum Minimalist Slider (Mới)</button>
  <button class="tab-btn" onclick="showTab(5)">Bản 5: Royal Burgundy & Gold (Mới)</button>
</div>

<!-- Panel 1 -->
<div id="panel-1" class="panel active">
  <div class="phone-mockup">
    <img src="data:image/png;base64,${b1}" alt="Bản 1: Modern Luxury Ivory" />
  </div>
  <div class="details">
    <span class="badge gold">Hạng Thương Gia Tinh Giản</span>
    <h2>Bản 1: Modern Luxury Ivory (Slide Sự Kiện)</h2>
    <ul>
      <li><strong>Nền trắng ngà ấm ngọc trai (Alabaster Ivory):</strong> Không màu đen u tối, thoáng đãng như khoang First Class sân bay.</li>
      <li><strong>Giao diện Sự Kiện Dạng Slide:</strong> Thẻ sự kiện Dạ tiệc Tất niên 16:9 lướt ngang mượt mà, hé lộ mép thẻ tiếp theo kèm bộ chấm slide indicator.</li>
      <li><strong>4 Nút Tác Vụ Nhanh (Pills):</strong> Check-in QR, Lịch học, Kết nối B2B, Tài liệu VIP bo tròn mềm mại.</li>
      <li><strong>Lịch trình đào tạo:</strong> Card Thứ Bảy 28, Buổi 05 Doanh Trí và số ghế VIP-08 đã xác nhận.</li>
    </ul>
    <div class="summary-card"><strong>Đánh giá:</strong> Phong cách thanh lịch, nhẹ nhàng, đẳng cấp cao quý.</div>
  </div>
</div>

<!-- Panel 2 (Refactored) -->
<div id="panel-2" class="panel">
  <div class="phone-mockup">
    <img src="data:image/png;base64,${b2}" alt="Bản 2: Executive Bento Grid (Đã Sửa)" />
  </div>
  <div class="details">
    <span class="badge amber">Đã Sửa: Tông Hổ Phách & Vàng Gold - Không Xanh/Tím</span>
    <h2>Bản 2: Executive Bento Grid (Slide Sự Kiện)</h2>
    <ul>
      <li><strong>Sửa triệt để màu sắc:</strong> Gỡ bỏ 100% màu xanh và màu tím, chuyển toàn bộ sang Vàng Hoàng Gia (#C5A059), Đỏ Đô Thượng Lưu (#8B1E2F) và Hổ Phách Amber (#D97706).</li>
      <li><strong>Sự Kiện Dạng Slide:</strong> Thẻ Lễ Khai Giảng vuốt ngang có mép hé lộ thẻ Dạ Tiệc Tất Niên, kèm 2 chấm slide pill.</li>
      <li><strong>Đồng hồ đo tiến độ 82%:</strong> Vòng tròn đo màu Hổ Phách Amber sắc nét (8/10 Tín chỉ).</li>
      <li><strong>Nút QR 1 Chạm:</strong> Khối màu Hổ Phách ánh kim, chạm 1 lần quét ngay không cần mở menu.</li>
      <li><strong>Radar B2B Connect:</strong> Tông Than chì ấm & Vàng kim, hiển thị 14 doanh nghiệp cùng ngành quanh bạn.</li>
    </ul>
    <div class="summary-card"><strong>Đánh giá:</strong> Chuẩn bố cục Bento hiện đại của Apple nhưng dùng bảng màu Doanh nhân ấm áp, mạnh mẽ.</div>
  </div>
</div>

<!-- Panel 3 -->
<div id="panel-3" class="panel">
  <div class="phone-mockup">
    <img src="data:image/png;base64,${b3}" alt="Bản 3: Editorial Story & Slide" />
  </div>
  <div class="details">
    <span class="badge gold">Tạp Chí Doanh Nhân Forbes</span>
    <h2>Bản 3: Editorial Story & Slide</h2>
    <ul>
      <li><strong>Story Highlights tròn:</strong> 5 vòng tròn viền vàng (Chủ tịch, Lớp học, Gala 2026, B2B VIP, Bản tin) cập nhật tin nhanh.</li>
      <li><strong>Slide Bìa Sự Kiện:</strong> Thẻ Dạ Tiệc Tất Niên dạng tạp chí trượt ngang với trích dẫn danh ngôn lãnh đạo.</li>
      <li><strong>Chặng Hành Trình:</strong> Tôn vinh cột mốc phát triển bản thân của các CEO.</li>
    </ul>
    <div class="summary-card"><strong>Đánh giá:</strong> Đậm chất ngoại giao, truyền thông và vinh danh thương hiệu cá nhân lãnh đạo.</div>
  </div>
</div>

<!-- Panel 4 (Mới) -->
<div id="panel-4" class="panel">
  <div class="phone-mockup">
    <img src="data:image/png;base64,${b4}" alt="Bản 4: Minimalist Platinum Slider" />
  </div>
  <div class="details">
    <span class="badge plat">Mẫu Mới: Bạch Kim & Vàng Champagne (Không Xanh/Tím)</span>
    <h2>Bản 4: Minimalist Platinum Slider</h2>
    <ul>
      <li><strong>Nền Bạch Kim Platinum (#F9F9FB):</strong> Tối giản tuyệt đối, phong cách thương hiệu cao cấp như Porsche Design / Cartier.</li>
      <li><strong>Sự Kiện Panorama Slider:</strong> Thẻ trượt Diễn Đàn Lãnh Đạo Đỉnh Cao 2026 viền Vàng Champagne (#D4AF37) với 3 chấm slide tinh tế.</li>
      <li><strong>Trung Tâm Tác Vụ 4 Nút Tròn (Quick Dial):</strong> Vé QR, Lịch học, Giao thương, Tài liệu dạng đĩa tròn 3D bóng bẩy.</li>
      <li><strong>Thanh Tiến Độ Khóa Học Mạ Vàng:</strong> Đo trực quan 75% hoàn thành (6/8 Chuyên đề).</li>
    </ul>
    <div class="summary-card"><strong>Đánh giá:</strong> Cực kỳ tối giản, tinh tế, sang trọng và không gây rối mắt.</div>
  </div>
</div>

<!-- Panel 5 (Mới) -->
<div id="panel-5" class="panel">
  <div class="phone-mockup">
    <img src="data:image/png;base64,${b5}" alt="Bản 5: Royal Burgundy & Gold" />
  </div>
  <div class="details">
    <span class="badge red">Mẫu Mới: Đỏ Rượu Vang & Vàng Kim Hoàng Gia</span>
    <h2>Bản 5: Royal Burgundy & Gold (Roadmap Trạm)</h2>
    <ul>
      <li><strong>Nhận diện truyền thống cao quý:</strong> Đỏ Rượu Vang Burgundy (#7F1D1D) phối Vàng Kim Thượng Lưu (#F59E0B), nền kem ngà ấm (#FFFBEB). Tuyệt đối không xanh, không tím.</li>
      <li><strong>Slide 3D Stack Sự Kiện:</strong> Thẻ Đại Hội Kết Nối Giao Thương CEO HN10 viền vàng kép, đồng hồ đếm ngược Còn 02 ngày.</li>
      <li><strong>Lộ Trình Đào Tạo Dạng 3 Trạm (Milestone Roadmap):</strong> Trạm 1 Khai Giảng (Đã qua) &bull; Trạm 2 Tài Chính (Đang học) &bull; Trạm 3 M&A (Sắp tới).</li>
      <li><strong>Banner Giao Thương B2B:</strong> 180+ Doanh nghiệp sẵn sàng hợp tác.</li>
    </ul>
    <div class="summary-card"><strong>Đánh giá:</strong> Bản sắc HanoiBA quyền lực, trang trọng, đậm chất sự kiện quy mô lớn.</div>
  </div>
</div>

<script>
function showTab(num) {
  document.querySelectorAll('.tab-btn').forEach((btn, idx) => {
    btn.classList.toggle('active', idx + 1 === num);
  });
  document.querySelectorAll('.panel').forEach((panel, idx) => {
    panel.classList.toggle('active', idx + 1 === num);
  });
}
</script>
</body>
</html>`;

fs.writeFileSync(path.join(dir, "app_ui_concepts.html"), html);
console.log("5-CONCEPT HTML PREVIEW GENERATED SUCCESSFULLY!");
