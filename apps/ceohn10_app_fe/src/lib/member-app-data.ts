// Type definitions and helper functions for member app
// Dữ liệu thực tế được quản lý và truy xuất 100% qua RESTful API kết nối PostgreSQL 113.20.107.184:6432

export const member = {
  name: "",
  company: "",
  status: "",
  code: "",
  validUntil: "",
  verified: false,
  type: "company" as "company" | "individual",
  title: "",
  email: "",
  phone: "",
  taxCode: "",
  industry: "",
  region: "",
  address: "",
  website: "",
  joinedAt: "",
};

export type Opportunity = {
  id: string;
  tag: string;
  title: string;
  company: string;
  time: string;
  color: string;
};

export const opportunities: Opportunity[] = [];

export const opportunityTabs = [
  "Tất cả",
  "Hợp tác kinh doanh",
  "Đầu tư",
  "Phân phối",
  "Tuyển dụng",
];

export type Product = {
  id: string;
  name: string;
  company: string;
  category: string;
  likes: number;
  views: number;
  time: string;
};

export const products: Product[] = [];

export const productTabs = ["Sản phẩm", "Dịch vụ", "Video", "Danh mục"];

export type AppEvent = {
  id: string;
  day: string;
  month: string;
  title: string;
  time: string;
  place: string;
};

export const events: AppEvent[] = [];

export const eventTabs = ["Sắp diễn ra", "Đang diễn ra", "Đã diễn ra"];

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  type: "event" | "fee" | "opportunity" | "system";
};

export const notifications: AppNotification[] = [];

export type Conversation = {
  id: string;
  name: string;
  last: string;
  time: string;
  unread: number;
};

export const conversations: Conversation[] = [];

export const memberBenefits = [
  { title: "Tham dự sự kiện", desc: "miễn phí & ưu đãi" },
  { title: "Kết nối hơn", desc: "1000+ doanh nghiệp" },
  { title: "Quảng bá thương hiệu", desc: "trên kênh Hiệp hội" },
];

// ---- Event check-in (QR/NFC) ----
export type CheckinEvent = {
  id: string;
  code: string; // QR/NFC payload expected
  title: string;
  date: string;
  time: string;
  place: string;
};

export const checkinEvents: CheckinEvent[] = [];

export type CheckinStatus = "success" | "already" | "invalid";

export type SyncState = "pending" | "synced";

export type CheckinRecord = {
  id: string;
  eventId: string | null;
  eventTitle: string;
  status: CheckinStatus;
  method: "qr" | "nfc";
  at: string; // ISO timestamp
  sync: SyncState;
};

const CHECKIN_KEY = "ceohn10_member_checkins";

export function loadCheckins(): CheckinRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CHECKIN_KEY) ?? "[]") as CheckinRecord[];
  } catch {
    return [];
  }
}

export function saveCheckins(list: CheckinRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CHECKIN_KEY, JSON.stringify(list));
}

/** Simulate scanning a payload and resolving the check-in result. */
export function resolveCheckin(
  payload: string,
  method: "qr" | "nfc",
  history: CheckinRecord[],
): CheckinRecord {
  const event = checkinEvents.find((e: any) => e.code === payload);
  let status: CheckinStatus;
  if (!event) {
    status = "invalid";
  } else if (history.some((r) => r.eventId === event.id && r.status !== "invalid")) {
    status = "already";
  } else {
    status = "success";
  }
  return {
    id: `chk-${Date.now()}`,
    eventId: event?.id ?? null,
    eventTitle: event?.title ?? "Mã không hợp lệ",
    status,
    method,
    at: new Date().toISOString(),
    sync: "pending",
  };
}

/** Records still waiting to be pushed to the server. */
export function pendingCheckins(list: CheckinRecord[]): CheckinRecord[] {
  return list.filter((r) => r.sync === "pending");
}

export const profileMenu = [
  "Thông tin cá nhân",
  "Thông tin doanh nghiệp",
  "Quản lý thành viên",
  "Lịch sử hoạt động",
  "Bài viết đã đăng",
  "Sản phẩm đã đăng",
  "Cơ hội đã đăng",
  "Thông báo của tôi",
  "Cài đặt",
];
