/**
 * System-wide Permission & Role Constants
 * CEO HN10 & ViOne Connect CRM
 */

export const SRS_ROLES = {
  PLATFORM_ADMIN: "platform_admin",
  ADMIN: "admin",
  LOP_TRUONG: "lop_truong",
  LOP_PHO: "lop_pho",
  TRUONG_TEAM: "truong_team",
  PHO_TEAM: "pho_team",
  TRUONG_BAN_CHUYEN_TRACH: "truong_ban_chuyen_trach",
  GIANG_VIEN: "giang_vien",
  MEMBER: "member",
  // Backward compatibility aliases
  QUAN_TRI: "platform_admin",
  CHU_TICH: "lop_truong",
  PHO_CHU_TICH: "lop_pho",
  BAN_DIEU_HANH: "lop_pho",
  TONG_THU_KY: "truong_ban_chuyen_trach",
  BAN_THU_KY: "truong_ban_chuyen_trach",
  TRUONG_BAN_TRUYEN_THONG: "truong_ban_chuyen_trach",
  TRUONG_BAN_THANH_VIEN: "truong_ban_chuyen_trach",
  TRUONG_BAN_XUC_TIEN: "truong_ban_chuyen_trach",
  TRUONG_BAN_TAI_CHINH: "truong_ban_chuyen_trach",
  TRUONG_BAN_THIEN_NGUYEN: "truong_ban_chuyen_trach",
  TRUONG_BAN_DIEU_HANH: "lop_pho",
  ADM: "admin",
  BQT: "lop_pho",
  BTK: "truong_ban_chuyen_trach",
  BTT: "truong_ban_chuyen_trach",
  BXT: "truong_ban_chuyen_trach",
  BTV: "truong_ban_chuyen_trach",
  BTN: "truong_ban_chuyen_trach",
  BTC: "truong_ban_chuyen_trach",
  HVT: "member",
} as const;

export const STANDARD_ROLES = [
  "Platform Admin",
  "Admin",
  "Lớp trưởng",
  "Lớp phó",
  "Trưởng team",
  "Phó team",
  "Trưởng ban chuyên trách",
  "Giảng viên",
  "Học viên",
] as const;

export const STANDARD_5_ROLES = STANDARD_ROLES;

export const STANDARD_7_COMMITTEES = [
  "Ban Công nghệ",
  "Ban Truyền thông",
  "Ban Tài chính",
  "Ban Sự kiện & Hậu cần",
  "Ban Đối ngoại & Giao thương",
  "Ban Gắn kết & Đời sống",
  "Ban Thiện nguyện",
] as const;

export type SrsRole =
  | "platform_admin"
  | "admin"
  | "lop_truong"
  | "lop_pho"
  | "truong_team"
  | "pho_team"
  | "truong_ban_chuyen_trach"
  | "giang_vien"
  | "member"
  // Legacy aliases for typing compatibility
  | "chu_tich"
  | "quan_tri"
  | "ban_dieu_hanh"
  | "tong_thu_ky"
  | "ban_thu_ky"
  | "truong_ban_truyen_thong"
  | "truong_ban_thanh_vien"
  | "truong_ban_xuc_tien"
  | "truong_ban_tai_chinh"
  | "truong_ban_thien_nguyen"
  | "truong_ban_dieu_hanh"
  | "ADM"
  | "BQT"
  | "BTK"
  | "BTT"
  | "BXT"
  | "BTV"
  | "BTN"
  | "BTC"
  | "HVT";

export const PERMISSIONS = {
  // Events
  EVENT_VIEW: "event:view",
  EVENT_CREATE: "event:create",
  EVENT_EDIT: "event:edit",
  EVENT_DELETE: "event:delete",
  EVENT_CANCEL: "event:cancel",
  EVENT_CHECKIN_MANAGE: "event:checkin_manage",

  // Sponsors & Packages
  SPONSOR_VIEW: "sponsor:view",
  SPONSOR_CREATE: "sponsor:create",
  SPONSOR_EDIT: "sponsor:edit",
  SPONSOR_DELETE: "sponsor:delete",
  SPONSOR_MANAGE: "sponsor:edit",
  SPONSOR_PACKAGE_MANAGE: "sponsor:package_manage",
  SPONSOR_ASSIGN_EVENT: "sponsor:assign_event",

  // Members
  MEMBER_VIEW: "member:view",
  MEMBER_CREATE: "member:create",
  MEMBER_EDIT: "member:edit",
  MEMBER_DELETE: "member:delete",
  MEMBER_APPROVE: "member:approve",
  MEMBER_RENEW: "member:renew",

  // Marketplace & Trade Promotion (B2B Opportunities)
  OPPORTUNITY_VIEW: "opportunity:view",
  OPPORTUNITY_MANAGE: "opportunity:manage",
  MARKETPLACE_MANAGE: "marketplace:manage",

  // Charity & Social Welfare
  CHARITY_VIEW: "charity:view",
  CHARITY_MANAGE: "charity:manage",

  // Meetings & Documents (Secretariat)
  MEETING_VIEW: "meeting:view",
  MEETING_MANAGE: "meeting:manage",
  DOCUMENT_MANAGE: "document:manage",

  // Finance & Invoices
  FINANCE_VIEW: "finance:view",
  FINANCE_MANAGE: "finance:manage",
  FINANCE_APPROVE: "finance:approve",

  // Media & Communications
  MEDIA_VIEW: "media:view",
  MEDIA_MANAGE: "media:manage",

  // System & Platform Administration
  SYSTEM_MANAGE: "system:manage",
  AUDIT_LOG_VIEW: "system:audit_view",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/**
 * Granular RBAC Role to Permission Mapping for 6 Official Departments
 */
export const ROLE_PERMISSIONS: Record<string, readonly Permission[]> = {
  chu_tich: Object.values(PERMISSIONS),
  quan_tri: Object.values(PERMISSIONS),
  admin: Object.values(PERMISSIONS),
  ban_dieu_hanh: Object.values(PERMISSIONS),
  truong_ban_dieu_hanh: Object.values(PERMISSIONS),
  tong_thu_ky: [
    PERMISSIONS.MEETING_VIEW,
    PERMISSIONS.MEETING_MANAGE,
    PERMISSIONS.DOCUMENT_MANAGE,
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.EVENT_CHECKIN_MANAGE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
  ],
  truong_ban_truyen_thong: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.EVENT_CHECKIN_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_ASSIGN_EVENT,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.MEMBER_VIEW,
  ],
  truong_ban_thanh_vien: [
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_CREATE,
    PERMISSIONS.MEMBER_EDIT,
    PERMISSIONS.MEMBER_APPROVE,
    PERMISSIONS.MEMBER_RENEW,
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CHECKIN_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.MEDIA_VIEW,
  ],
  truong_ban_xuc_tien: [
    PERMISSIONS.OPPORTUNITY_VIEW,
    PERMISSIONS.OPPORTUNITY_MANAGE,
    PERMISSIONS.MARKETPLACE_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_CREATE,
    PERMISSIONS.SPONSOR_EDIT,
    PERMISSIONS.SPONSOR_PACKAGE_MANAGE,
    PERMISSIONS.SPONSOR_ASSIGN_EVENT,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.EVENT_VIEW,
  ],
  truong_ban_tai_chinh: [
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.FINANCE_APPROVE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_CREATE,
    PERMISSIONS.SPONSOR_EDIT,
    PERMISSIONS.SPONSOR_PACKAGE_MANAGE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.EVENT_VIEW,
  ],
  truong_ban_thien_nguyen: [
    PERMISSIONS.CHARITY_VIEW,
    PERMISSIONS.CHARITY_MANAGE,
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_CHECKIN_MANAGE,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_CREATE,
    PERMISSIONS.MEMBER_VIEW,
  ],
  BTC: [
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.FINANCE_MANAGE,
    PERMISSIONS.FINANCE_APPROVE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_CREATE,
    PERMISSIONS.SPONSOR_EDIT,
    PERMISSIONS.SPONSOR_PACKAGE_MANAGE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.EVENT_VIEW,
  ],
  ban_thu_ky: [
    PERMISSIONS.MEETING_VIEW,
    PERMISSIONS.MEETING_MANAGE,
    PERMISSIONS.DOCUMENT_MANAGE,
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.EVENT_CHECKIN_MANAGE,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.MEMBER_VIEW,
  ],
  member: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.OPPORTUNITY_VIEW,
    PERMISSIONS.CHARITY_VIEW,
    PERMISSIONS.MEETING_VIEW,
  ],
  // Legacy aliases
  ADM: Object.values(PERMISSIONS),
  BQT: Object.values(PERMISSIONS),
  BTK: [
    PERMISSIONS.MEETING_VIEW,
    PERMISSIONS.MEETING_MANAGE,
    PERMISSIONS.DOCUMENT_MANAGE,
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.EVENT_CHECKIN_MANAGE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.AUDIT_LOG_VIEW,
  ],
  BTT: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_EDIT,
    PERMISSIONS.EVENT_CHECKIN_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_ASSIGN_EVENT,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.MEMBER_VIEW,
  ],
  BXT: [
    PERMISSIONS.OPPORTUNITY_VIEW,
    PERMISSIONS.OPPORTUNITY_MANAGE,
    PERMISSIONS.MARKETPLACE_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_CREATE,
    PERMISSIONS.SPONSOR_EDIT,
    PERMISSIONS.SPONSOR_PACKAGE_MANAGE,
    PERMISSIONS.SPONSOR_ASSIGN_EVENT,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.EVENT_VIEW,
  ],
  BTV: [
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEMBER_CREATE,
    PERMISSIONS.MEMBER_EDIT,
    PERMISSIONS.MEMBER_APPROVE,
    PERMISSIONS.MEMBER_RENEW,
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CHECKIN_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.MEDIA_VIEW,
  ],
  BTN: [
    PERMISSIONS.CHARITY_VIEW,
    PERMISSIONS.CHARITY_MANAGE,
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.EVENT_CREATE,
    PERMISSIONS.EVENT_CHECKIN_MANAGE,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.MEDIA_MANAGE,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.SPONSOR_CREATE,
    PERMISSIONS.MEMBER_VIEW,
  ],
  HVT: [
    PERMISSIONS.EVENT_VIEW,
    PERMISSIONS.SPONSOR_VIEW,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.MEDIA_VIEW,
    PERMISSIONS.OPPORTUNITY_VIEW,
    PERMISSIONS.CHARITY_VIEW,
    PERMISSIONS.MEETING_VIEW,
  ],
};
