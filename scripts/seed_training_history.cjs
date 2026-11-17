const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://app1:5%5ES0CEpvYwC1%28%23YN1UoJ@113.20.107.184:6432/ceohn10_project?sslmode=disable'
});

async function main() {
  await client.connect();
  console.log('Connected to database to update training sessions history...');

  // 1. Cập nhật buổi 1 completed
  await client.query(`
    UPDATE trainings 
    SET title = 'Buổi 01: Văn hóa Doanh nhân & Chiến lược Điều hành CEO HN10',
        tagline = 'Khởi động chuỗi 30 buổi đào tạo thứ Bảy hàng tuần',
        status = 'completed',
        start_time = '2026-11-08 09:00:00',
        end_time = '2026-11-08 11:30:00',
        instructor_name = 'Chuyên gia Đặng Thanh Vân',
        instructor_title = 'Chuyên gia Chiến lược Thương hiệu',
        location = 'Hội trường Tầng 3 - Trụ sở CLB CEO HN10',
        attendee_count = 92,
        max_attendees = 100,
        category = 'Kỹ năng lãnh đạo'
    WHERE id = 'e259d001-d988-4181-be6a-2891e16993f7'
  `);

  // 2. Cập nhật buổi 2 completed
  await client.query(`
    UPDATE trainings 
    SET title = 'Buổi 02: Xây dựng Hệ thống Quản trị Mục tiêu OKRs & KPI Thực chiến',
        tagline = 'Tối ưu hóa hiệu suất làm việc và phân bổ nguồn lực doanh nghiệp',
        status = 'completed',
        start_time = '2026-11-15 09:00:00',
        end_time = '2026-11-15 11:30:00',
        instructor_name = 'ThS. Nguyễn Hữu Long',
        instructor_title = 'Chuyên gia Quản trị Nhân sự & Hiệu suất',
        location = 'Phòng Đào tạo A1 - Trung tâm Tri thức Doanh nhân',
        attendee_count = 88,
        max_attendees = 100,
        category = 'Quản trị vận hành'
    WHERE id = 'e3370ae1-9cde-4654-8cb2-e791d1b35d88'
  `);

  console.log('✅ Đã cập nhật 2 buổi học hoàn thành vào CSDL phục vụ chức năng Nhật ký khóa học!');
  await client.end();
}

main().catch(console.error);
