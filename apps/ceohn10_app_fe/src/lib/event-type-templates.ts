export type EventTypeKey =
  | "khai_giang"
  | "year_end_party"
  | "teambuilding"
  | "be_giang"
  | "charity"
  | "forum"
  | "workshop"
  | "networking"
  | "training";

export interface EventTypeTemplate {
  key: EventTypeKey;
  label: string;
  name: string;
  badge: string;
  tagline: string;
  themeGradient: string;
  badgeBg: string;
  badgeText: string;
  textColor: string;
  accentColor: string;
  bgImage: string;
  defaultLocation: string;
  defaultCapacity: string;
  description: string;
  defaultTicketName: string;
  defaultTicketPrice: string;
}

export const EVENT_TYPE_TEMPLATES: Record<EventTypeKey, EventTypeTemplate> = {
  khai_giang: {
    key: "khai_giang",
    label: "Khai giảng khóa học",
    name: "LỄ KHAI GIẢNG LỚP DOANH TRÍ CEO HN10: HÀNH TRÌNH TRI THỨC & GIAO THƯƠNG",
    badge: "🏛️ LỄ KHAI GIẢNG KHÓA HỌC",
    tagline: "Chào đón 60+ Doanh nhân học viên chính thức gia nhập Lớp CEO HN10 (HanoiBA)",
    themeGradient: "linear-gradient(135deg, #071322 0%, #003B95 55%, #0A2540 100%)",
    badgeBg: "rgba(245, 158, 11, 0.2)",
    badgeText: "#F59E0B",
    textColor: "#FFFFFF",
    accentColor: "#F59E0B",
    bgImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Trung tâm Hội nghị Quốc gia (NCC), Mễ Trì, Nam Từ Liêm, Hà Nội",
    defaultCapacity: "150",
    description: "Lễ Khai giảng chính thức Khóa học Doanh trí Thực chiến 30 Chuyên đề CLB Doanh Nhân CEO HN10 (HanoiBA). Phát bằng chứng nhận học viên, giới thiệu ban cán sự lâm thời và phát động quỹ lớp 20 triệu đồng.",
    defaultTicketName: "Vé Khai Giảng Học Viên (Bao gồm Tea-break & Bộ Giáo trình)",
    defaultTicketPrice: "0",
  },
  year_end_party: {
    key: "year_end_party",
    label: "Year End Party (YEP)",
    name: "DẠ TIỆC TẤT NIÊN YEAR END PARTY 2026: ĐÊM HỘI GẮN KẾT & VINH DANH DOANH NHÂN",
    badge: "🥂 DẠ TIỆC TẤT NIÊN YEAR END PARTY",
    tagline: "Tổng kết chặng đường bứt phá, vinh danh học viên tiêu biểu & Chào xuân 2027",
    themeGradient: "linear-gradient(135deg, #3A1005 0%, #B45309 55%, #78350F 100%)",
    badgeBg: "rgba(251, 191, 36, 0.25)",
    badgeText: "#FBBF24",
    textColor: "#FFFFFF",
    accentColor: "#FBBF24",
    bgImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Khách sạn InterContinental Hanoi Landmark72, Phạm Hùng, Hà Nội",
    defaultCapacity: "200",
    description: "Đêm tiệc Gala Year End Party ấm cúng, sang trọng kết hợp chương trình Vòng quay may mắn (Lucky Draw), đấu giá gây quỹ và vinh danh các doanh nhân xuất sắc.",
    defaultTicketName: "Vé Gala Dinner YEP (Tiệc tối & Rượu vang cao cấp)",
    defaultTicketPrice: "500000",
  },
  teambuilding: {
    key: "teambuilding",
    label: "Teambuilding & Dã ngoại",
    name: "CHƯƠNG TRÌNH TEAMBUILDING CEO HN10: VƯỢT THỬ THÁCH - BỨT PHÁ GIỚI HẠN",
    badge: "🏕️ TEAMBUILDING GẮN KẾT HỌC VIÊN",
    tagline: "Gắn kết tình đồng đội, rèn luyện thể lực & tái tạo năng lượng kinh doanh",
    themeGradient: "linear-gradient(135deg, #042F2E 0%, #0D9488 55%, #115E59 100%)",
    badgeBg: "rgba(52, 211, 153, 0.2)",
    badgeText: "#34D399",
    textColor: "#FFFFFF",
    accentColor: "#34D399",
    bgImage: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Khu Du Lịch Sinh Thái Flamingo Đại Lải Resort, Vĩnh Phúc",
    defaultCapacity: "120",
    description: "Chương trình dã ngoại kết hợp trò chơi liên hoàn, đốt lửa trại giao lưu và thi đấu thể thao giữa các team học viên.",
    defaultTicketName: "Vé Teambuilding (Xe đưa đón, ăn uống & áo đồng phục)",
    defaultTicketPrice: "1000000",
  },
  be_giang: {
    key: "be_giang",
    label: "Lễ Bế giảng & Trao bằng",
    name: "LỄ BẾ GIẢNG KHÓA HỌC & GALA TRAO BẰNG TỐT NGHIỆP CEO HN10",
    badge: "🎖️ LỄ BẾ GIẢNG & GALA TỐT NGHIỆP",
    tagline: "Vinh danh chặng đường 30 chuyên đề doanh trí, trao chứng chỉ & Ra mắt mạng lưới cựu học viên",
    themeGradient: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 55%, #312E81 100%)",
    badgeBg: "rgba(167, 139, 250, 0.25)",
    badgeText: "#A78BFA",
    textColor: "#FFFFFF",
    accentColor: "#A78BFA",
    bgImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Hội trường Grand Ballroom, Khách sạn Daewoo Hà Nội",
    defaultCapacity: "200",
    description: "Lễ Bế giảng trang trọng kết thúc 30 chuyên đề đào tạo thực chiến, trao bằng tốt nghiệp, vinh danh học viên xuất sắc và công bố ban điều hành mạng lưới cựu học viên.",
    defaultTicketName: "Vé Bế Giảng & Gala Dinner (Bao gồm Kỷ niệm chương & Tiệc mừng)",
    defaultTicketPrice: "0",
  },
  charity: {
    key: "charity",
    label: "Sự kiện Thiện Nguyện (CSR)",
    name: "HÀNH TRÌNH TƯƠNG THÂN TƯƠNG ÁI: ĐOÀN KẾT VÌ CỘNG ĐỒNG - CEO HN10",
    badge: "❤️ CHƯƠNG TRÌNH THIỆN NGUYỆN CSR",
    tagline: "Lan tỏa yêu thương, trách nhiệm xã hội & sứ mệnh cộng đồng của Doanh nhân",
    themeGradient: "linear-gradient(135deg, #042F2E 0%, #0D9488 55%, #065F46 100%)",
    badgeBg: "rgba(20, 184, 166, 0.25)",
    badgeText: "#14B8A6",
    textColor: "#FFFFFF",
    accentColor: "#14B8A6",
    bgImage: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Điểm trường vùng cao / Trung tâm bảo trợ xã hội Hà Nội",
    defaultCapacity: "100",
    description: "Chương trình thiện nguyện do Ban Thiện Nguyện CLB Doanh Nhân CEO HN10 tổ chức nhằm xây điểm trường, tặng quà các gia đình chính sách và học sinh nghèo vượt khó.",
    defaultTicketName: "Vé Đăng ký Đoàn Thiện Nguyện (Miễn phí)",
    defaultTicketPrice: "0",
  },

  // Aliases tương thích ngược
  forum: {
    key: "khai_giang",
    label: "Khai giảng khóa học",
    name: "LỄ KHAI GIẢNG LỚP DOANH TRÍ CEO HN10: HÀNH TRÌNH TRI THỨC & GIAO THƯƠNG",
    badge: "🏛️ LỄ KHAI GIẢNG KHÓA HỌC",
    tagline: "Chào đón 60+ Doanh nhân học viên chính thức gia nhập Lớp CEO HN10 (HanoiBA)",
    themeGradient: "linear-gradient(135deg, #071322 0%, #003B95 55%, #0A2540 100%)",
    badgeBg: "rgba(245, 158, 11, 0.2)",
    badgeText: "#F59E0B",
    textColor: "#FFFFFF",
    accentColor: "#F59E0B",
    bgImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Trung tâm Hội nghị Quốc gia (NCC), Mễ Trì, Nam Từ Liêm, Hà Nội",
    defaultCapacity: "150",
    description: "Lễ Khai giảng chính thức Khóa học Doanh trí Thực chiến 30 Chuyên đề CLB Doanh Nhân CEO HN10 (HanoiBA). Phát bằng chứng nhận học viên, giới thiệu ban cán sự lâm thời và phát động quỹ lớp 20 triệu đồng.",
    defaultTicketName: "Vé Khai Giảng Học Viên (Bao gồm Tea-break & Bộ Giáo trình)",
    defaultTicketPrice: "0",
  },
  workshop: {
    key: "teambuilding",
    label: "Teambuilding & Dã ngoại",
    name: "CHƯƠNG TRÌNH TEAMBUILDING CEO HN10: VƯỢT THỬ THÁCH - BỨT PHÁ GIỚI HẠN",
    badge: "🏕️ TEAMBUILDING GẮN KẾT HỌC VIÊN",
    tagline: "Gắn kết tình đồng đội, rèn luyện thể lực & tái tạo năng lượng kinh doanh",
    themeGradient: "linear-gradient(135deg, #042F2E 0%, #0D9488 55%, #115E59 100%)",
    badgeBg: "rgba(52, 211, 153, 0.2)",
    badgeText: "#34D399",
    textColor: "#FFFFFF",
    accentColor: "#34D399",
    bgImage: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Khu Du Lịch Sinh Thái Flamingo Đại Lải Resort, Vĩnh Phúc",
    defaultCapacity: "120",
    description: "Chương trình dã ngoại kết hợp trò chơi liên hoàn, đốt lửa trại giao lưu và thi đấu thể thao giữa các team học viên.",
    defaultTicketName: "Vé Teambuilding (Xe đưa đón, ăn uống & áo đồng phục)",
    defaultTicketPrice: "1000000",
  },
  networking: {
    key: "year_end_party",
    label: "Year End Party (YEP)",
    name: "DẠ TIỆC TẤT NIÊN YEAR END PARTY 2026: ĐÊM HỘI GẮN KẾT & VINH DANH DOANH NHÂN",
    badge: "🥂 DẠ TIỆC TẤT NIÊN YEAR END PARTY",
    tagline: "Tổng kết chặng đường bứt phá, vinh danh học viên tiêu biểu & Chào xuân 2027",
    themeGradient: "linear-gradient(135deg, #3A1005 0%, #B45309 55%, #78350F 100%)",
    badgeBg: "rgba(251, 191, 36, 0.25)",
    badgeText: "#FBBF24",
    textColor: "#FFFFFF",
    accentColor: "#FBBF24",
    bgImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Khách sạn InterContinental Hanoi Landmark72, Phạm Hùng, Hà Nội",
    defaultCapacity: "200",
    description: "Đêm tiệc Gala Year End Party ấm cúng, sang trọng kết hợp chương trình Vòng quay may mắn (Lucky Draw), đấu giá gây quỹ và vinh danh các doanh nhân xuất sắc.",
    defaultTicketName: "Vé VIP Gala Dinner (Bao gồm Tiệc tối & Rượu vang)",
    defaultTicketPrice: "500000",
  },
  training: {
    key: "be_giang",
    label: "Lễ Bế giảng & Trao bằng",
    name: "LỄ BẾ GIẢNG KHÓA HỌC & GALA TRAO BẰNG TỐT NGHIỆP CEO HN10",
    badge: "🎖️ LỄ BẾ GIẢNG & GALA TỐT NGHIỆP",
    tagline: "Vinh danh chặng đường 30 chuyên đề doanh trí, trao chứng chỉ & Ra mắt mạng lưới cựu học viên",
    themeGradient: "linear-gradient(135deg, #1E1B4B 0%, #4338CA 55%, #312E81 100%)",
    badgeBg: "rgba(167, 139, 250, 0.25)",
    badgeText: "#A78BFA",
    textColor: "#FFFFFF",
    accentColor: "#A78BFA",
    bgImage: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&auto=format&fit=crop&q=80",
    defaultLocation: "Hội trường Grand Ballroom, Khách sạn Daewoo Hà Nội",
    defaultCapacity: "200",
    description: "Lễ Bế giảng trang trọng kết thúc 30 chuyên đề đào tạo thực chiến, trao bằng tốt nghiệp, vinh danh học viên xuất sắc và công bố ban điều hành mạng lưới cựu học viên.",
    defaultTicketName: "Vé Bế Giảng & Gala Dinner (Bao gồm Kỷ niệm chương & Tiệc mừng)",
    defaultTicketPrice: "0",
  },
};
