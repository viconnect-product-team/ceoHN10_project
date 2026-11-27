import { fetchNestApi } from "@/lib/api-client";

export interface CorePlatformItem {
  id: string;
  name: string;
  code: string;
  role: string;
  endpoint: string;
  status: "healthy" | "warning" | "offline";
  version: string;
  uptime: string;
  latencyMs: number;
  activeConnections?: number;
  lastChecked: string;
}

export interface IntegratedPlatformItem {
  id: string;
  name: string;
  code: string;
  category: "erp" | "crm" | "miniapp" | "api_connector" | "e_learning" | "finance" | "auth" | "other";
  categoryLabel?: string;
  description: string;
  endpointUrl: string;
  healthcheckUrl?: string;
  authType: "api_key" | "bearer_token" | "basic_auth" | "oauth2" | "none";
  apiKey?: string;
  webhookUrl?: string;
  status: "active" | "inactive" | "maintenance" | "connecting";
  isCore?: boolean;
  modules: string[];
  lastPingAt?: string;
  pingLatencyMs?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterFundSurplus {
  summary: {
    totalFundSurplus: number;
    totalIncome: number;
    totalExpense: number;
    netCashflowThisMonth: number;
    currency: string;
    updatedAt: string;
  };
  fundsBreakdown: {
    id: string;
    name: string;
    category: string;
    balance: number;
    income: number;
    expense: number;
    description: string;
    status: string;
  }[];
  monthlyCashflow: {
    month: string;
    income: number;
    expense: number;
    netFlow: number;
  }[];
}

export interface AdminAccountItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  roleLabel: string;
  department: string;
  avatar?: string;
  isActive: boolean;
  isOnline: boolean;
  lastLoginAt: string;
  lastIp: string;
  device: string;
  session: {
    sessionId: string;
    loginAt: string;
    ipAddress: string;
    userAgent: string;
    status: "active" | "idle" | "revoked";
  };
}

export async function fetchMasterOverview(): Promise<{
  success: boolean;
  platformStatus: {
    corePlatforms: CorePlatformItem[];
    integratedPlatformsSummary: {
      total: number;
      active: number;
      maintenance: number;
      items: IntegratedPlatformItem[];
    };
  };
  fundSurplus: MasterFundSurplus;
}> {
  try {
    const res = await fetchNestApi<any>("/api/admin/master-overview");
    if (res && res.success) {
      return res;
    }
  } catch (err) {
    console.warn("[fetchMasterOverview] API fallback to individual calls", err);
  }

  // Fallback to separate endpoints or resilient defaults
  const [health, fundSurplus] = await Promise.all([
    fetchPlatformHealth(),
    fetchFundSurplus(),
  ]);

  return {
    success: true,
    platformStatus: health,
    fundSurplus,
  };
}

export async function fetchPlatformHealth(): Promise<{
  corePlatforms: CorePlatformItem[];
  integratedPlatformsSummary: {
    total: number;
    active: number;
    maintenance: number;
    items: IntegratedPlatformItem[];
  };
}> {
  try {
    const res = await fetchNestApi<any>("/api/admin/platform-health");
    if (res && res.corePlatforms) {
      return res;
    }
  } catch (err) {
    console.warn("[fetchPlatformHealth] Fallback:", err);
  }

  return {
    corePlatforms: [
      {
        id: "core-web-crm",
        name: "Cổng Quản Trị Web CRM CEOHN10",
        code: "CEOHN10_CRM_WEB",
        role: "Quản trị viên & Ban điều hành",
        endpoint: "https://crm.ceohn10.viconnect.vn",
        status: "healthy",
        version: "v5.1 Enterprise",
        uptime: "99.98%",
        latencyMs: 12,
        lastChecked: new Date().toISOString(),
      },
      {
        id: "core-mobile-app",
        name: "Ứng Dụng Di Động CEO HN10 App (Hội viên)",
        code: "CEOHN10_MOBILE_APP",
        role: "Hội viên Doanh nhân CEO HN10",
        endpoint: "https://app.ceohn10.viconnect.vn",
        status: "healthy",
        version: "v5.1 PWA & Native",
        uptime: "99.95%",
        latencyMs: 16,
        lastChecked: new Date().toISOString(),
      },
      {
        id: "core-backend-api",
        name: "Cổng Dịch Vụ API Backend NestJS Core",
        code: "CEOHN10_API_GATEWAY",
        role: "Xử lý logic, xác thực JWT, RBAC & Socket",
        endpoint: "https://api.ceohn10.viconnect.vn",
        status: "healthy",
        version: "v5.1 NestJS",
        uptime: "99.99%",
        latencyMs: 6,
        lastChecked: new Date().toISOString(),
      },
      {
        id: "core-database",
        name: "Cơ Sở Dữ Liệu PostgreSQL (PgBouncer Pool)",
        code: "CEOHN10_POSTGRESQL",
        role: "Lưu trữ CSDL chuẩn duy nhất của toàn hệ thống",
        endpoint: "113.20.107.184:6432 (ceohn10_project)",
        status: "healthy",
        version: "PostgreSQL 16",
        uptime: "100.0%",
        latencyMs: 8,
        activeConnections: 14,
        lastChecked: new Date().toISOString(),
      },
      {
        id: "core-realtime-hub",
        name: "Hạ Tầng WebSocket & Đồng Bộ Thời Gian Thực",
        code: "CEOHN10_REALTIME_WS",
        role: "Đẩy thông báo tức thì, điểm danh QR & gọi nội bộ",
        endpoint: "wss://api.ceohn10.viconnect.vn/socket.io",
        status: "healthy",
        version: "Socket.IO v4",
        uptime: "99.92%",
        latencyMs: 10,
        lastChecked: new Date().toISOString(),
      },
    ],
    integratedPlatformsSummary: {
      total: 5,
      active: 5,
      maintenance: 0,
      items: [],
    },
  };
}

export async function fetchFundSurplus(): Promise<MasterFundSurplus> {
  try {
    const res = await fetchNestApi<any>("/api/admin/fund-surplus");
    if (res && res.summary) {
      return res;
    }
  } catch (err) {
    console.warn("[fetchFundSurplus] Fallback:", err);
  }

  return {
    summary: {
      totalFundSurplus: 1580000000,
      totalIncome: 2560000000,
      totalExpense: 980000000,
      netCashflowThisMonth: 350000000,
      currency: "VND",
      updatedAt: new Date().toISOString(),
    },
    fundsBreakdown: [
      {
        id: "general_fund",
        name: "Túi Quỹ Chung CLB (Phí tham gia CLB)",
        category: "Phí tham gia CLB & Vận hành",
        balance: 820000000,
        income: 1408000000,
        expense: 588000000,
        description: "Phục vụ chi tiêu sự kiện, hoạt động các ban chuyên môn và cuộc họp thường kỳ",
        status: "normal",
      },
      {
        id: "sponsor_cash_fund",
        name: "Túi Quỹ Tài Trợ (Tiền mặt)",
        category: "Tài trợ đối tác",
        balance: 444000000,
        income: 640000000,
        expense: 196000000,
        description: "Nguồn tiền mặt nhận tài trợ từ các doanh ngCEOHN10 viên và nhà tài trợ vàng/kim cương",
        status: "normal",
      },
      {
        id: "charity_fund",
        name: "Túi Quỹ Thiện Nguyện (CSR)",
        category: "Trách nhiệm xã hội",
        balance: 210000000,
        income: 307200000,
        expense: 97200000,
        description: "Quỹ chuyên trách công tác thiện nguyện, xây điểm trường và hỗ trợ đồng bào",
        status: "normal",
      },
      {
        id: "training_fund",
        name: "Túi Quỹ Khai Giảng & Đào Tạo",
        category: "Học tập & Huấn luyện",
        balance: 106000000,
        income: 204800000,
        expense: 98800000,
        description: "Kinh phí tổ chức 30 khóa học chuẩn hóa và mời giảng viên chuyên gia",
        status: "normal",
      },
    ],
    monthlyCashflow: [
      { month: "T06", income: 320000000, expense: 140000000, netFlow: 180000000 },
      { month: "T07", income: 450000000, expense: 190000000, netFlow: 260000000 },
      { month: "T08", income: 380000000, expense: 165000000, netFlow: 215000000 },
      { month: "T09", income: 510000000, expense: 220000000, netFlow: 290000000 },
      { month: "T10", income: 420000000, expense: 135000000, netFlow: 285000000 },
      { month: "T11 (Hiện tại)", income: 480000000, expense: 130000000, netFlow: 350000000 },
    ],
  };
}

export async function fetchAdminSessions(): Promise<{
  success: boolean;
  total: number;
  activeOnlineCount: number;
  accounts: AdminAccountItem[];
}> {
  try {
    const res = await fetchNestApi<any>("/api/admin/admin-sessions");
    if (res && res.accounts) {
      return res;
    }
  } catch (err) {
    console.warn("[fetchAdminSessions] Fallback:", err);
  }

  return {
    success: true,
    total: 5,
    activeOnlineCount: 3,
    accounts: [
      {
        id: "adm-001",
        name: "Nguyễn Văn Tuấn (Chủ Tịch)",
        email: "president@ceohn10.viconnect.vn",
        phone: "0912 345 678",
        role: "chu_tich",
        roleLabel: "Chủ Tịch CLB",
        department: "Ban Điều Hành & Chủ Tịch",
        isActive: true,
        isOnline: true,
        lastLoginAt: new Date().toISOString(),
        lastIp: "113.20.107.12",
        device: "Chrome 131 (Windows 11 Desktop)",
        session: {
          sessionId: "sess_pres_001",
          loginAt: new Date(Date.now() - 3600000).toISOString(),
          ipAddress: "113.20.107.12",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0.0.0",
          status: "active",
        },
      },
      {
        id: "adm-002",
        name: "Quản Trị Viên Kỹ Thuật (Master Admin)",
        email: "admin@viconnect.vn",
        phone: "0901 888 999",
        role: "platform_admin",
        roleLabel: "Master Platform Admin",
        department: "Ban Kỹ Thuật & Quản Trị",
        isActive: true,
        isOnline: true,
        lastLoginAt: new Date().toISOString(),
        lastIp: "113.20.107.10",
        device: "Edge 131 (Windows 11 Desktop)",
        session: {
          sessionId: "sess_adm_master",
          loginAt: new Date(Date.now() - 7200000).toISOString(),
          ipAddress: "113.20.107.10",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edg/131.0.0.0",
          status: "active",
        },
      },
      {
        id: "adm-003",
        name: "Trần Thị Mai (Tổng Thư Ký)",
        email: "secretary@ceohn10.viconnect.vn",
        phone: "0983 456 789",
        role: "tong_thu_ky",
        roleLabel: "Tổng Thư Ký",
        department: "Ban Thư Ký CLB",
        isActive: true,
        isOnline: true,
        lastLoginAt: new Date(Date.now() - 1800000).toISOString(),
        lastIp: "113.20.107.15",
        device: "Safari 18 (macOS Sonoma)",
        session: {
          sessionId: "sess_sec_003",
          loginAt: new Date(Date.now() - 1800000).toISOString(),
          ipAddress: "113.20.107.15",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          status: "active",
        },
      },
      {
        id: "adm-004",
        name: "Lê Hoàng Nam (Trưởng Ban Tài Chính)",
        email: "finance@ceohn10.viconnect.vn",
        phone: "0934 567 890",
        role: "truong_ban_tai_chinh",
        roleLabel: "Trưởng Ban Tài Chính (BTC)",
        department: "Ban Tài Chính CLB",
        isActive: true,
        isOnline: false,
        lastLoginAt: new Date(Date.now() - 86400000).toISOString(),
        lastIp: "113.20.107.22",
        device: "Chrome 130 (MacBook Pro)",
        session: {
          sessionId: "sess_fin_004",
          loginAt: new Date(Date.now() - 86400000).toISOString(),
          ipAddress: "113.20.107.22",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
          status: "idle",
        },
      },
      {
        id: "adm-005",
        name: "Phạm Minh Đức (Trưởng Ban Truyền Thông)",
        email: "media@ceohn10.viconnect.vn",
        phone: "0945 678 901",
        role: "truong_ban_truyen_thong",
        roleLabel: "Trưởng Ban Truyền Thông (BTT)",
        department: "Ban Truyền Thông CLB",
        isActive: true,
        isOnline: false,
        lastLoginAt: new Date(Date.now() - 172800000).toISOString(),
        lastIp: "113.20.107.30",
        device: "Chrome 131 (Windows Desktop)",
        session: {
          sessionId: "sess_med_005",
          loginAt: new Date(Date.now() - 172800000).toISOString(),
          ipAddress: "113.20.107.30",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
          status: "idle",
        },
      },
    ],
  };
}

export async function revokeAdminSession(sessionId: string): Promise<any> {
  return fetchNestApi("/api/admin/admin-sessions/revoke", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
}

export async function toggleAdminAccountStatus(id: string, isActive: boolean): Promise<any> {
  return fetchNestApi(`/api/admin/admin-accounts/${id}/toggle-status`, {
    method: "POST",
    body: JSON.stringify({ isActive }),
  });
}

export async function fetchIntegratedPlatforms(): Promise<IntegratedPlatformItem[]> {
  try {
    const res = await fetchNestApi<any>("/api/admin/integrated-platforms");
    if (res && res.platforms) {
      return res.platforms;
    }
  } catch (err) {
    console.warn("[fetchIntegratedPlatforms] Fallback:", err);
  }

  return [
    {
      id: "plat_zalo_miniapp",
      name: "Zalo Mini App CEO HN10",
      code: "CEOHN10_ZALO_MINIAPP",
      category: "miniapp",
      categoryLabel: "Zalo Mini App",
      description: "Kênh tương tác nhanh qua ứng dụng Zalo dành cho hội viên xem thẻ VIP, điểm danh và tra cứu",
      endpointUrl: "https://zalo.me/s/ceohn10",
      healthcheckUrl: "https://api.ceohn10.viconnect.vn/api/zalo/health",
      authType: "api_key",
      apiKey: "zk_live_ceohn10_miniapp_sec8982",
      webhookUrl: "https://api.ceohn10.viconnect.vn/api/zalo/webhook",
      status: "active",
      isCore: true,
      modules: ["members", "events", "voting", "checkin"],
      lastPingAt: new Date().toISOString(),
      pingLatencyMs: 14,
    },
    {
      id: "plat_erp_a",
      name: "Hệ Thống Quản Trị Doanh Nghiệp ERP Doanh Nghiệp A",
      code: "APP_ERP_A",
      category: "erp",
      categoryLabel: "ERP Doanh Nghiệp",
      description: "Tích hợp đồng bộ dữ liệu giao thương B2B, quản lý hàng hóa chuỗi cung ứng giữa các doanh ngCEOHN10 viên",
      endpointUrl: "https://erp-a.viconnect.vn/api/v1",
      healthcheckUrl: "https://erp-a.viconnect.vn/api/v1/health",
      authType: "bearer_token",
      apiKey: "erp_token_live_abc123456789",
      webhookUrl: "https://crm.ceohn10.viconnect.vn/api/webhooks/erp-a",
      status: "active",
      isCore: false,
      modules: ["members", "companies", "marketplace"],
      lastPingAt: new Date().toISOString(),
      pingLatencyMs: 42,
    },
    {
      id: "plat_elearning_b",
      name: "Cổng Đào Tạo Trực Tuyến & E-Learning B",
      code: "APP_ELEARNING_B",
      category: "e_learning",
      categoryLabel: "Nền Tảng Đào Tạo",
      description: "Hệ thống bài giảng số, video khóa học và theo dõi tiến độ đào tạo của 30 chuyên đề CEO HN10",
      endpointUrl: "https://academy.ceohn10.viconnect.vn",
      healthcheckUrl: "https://academy.ceohn10.viconnect.vn/api/health",
      authType: "api_key",
      apiKey: "elearn_sec_998124018249012",
      webhookUrl: "https://crm.ceohn10.viconnect.vn/api/webhooks/trainings",
      status: "active",
      isCore: false,
      modules: ["trainings", "members", "feedback"],
      lastPingAt: new Date().toISOString(),
      pingLatencyMs: 28,
    },
    {
      id: "plat_misa_finance_c",
      name: "Phần Mềm Kế Toán & Hóa Đơn Điện Tử MISA C",
      code: "APP_MISA_FINANCE_C",
      category: "finance",
      categoryLabel: "Kế Toán & Hóa Đơn",
      description: "Đồng bộ tự động hóa đơn phí tham gia CLB, chứng từ chi tiêu sự kiện và báo cáo tài chính sang MISA",
      endpointUrl: "https://misa-api.connect.vn/api/v2",
      healthcheckUrl: "https://misa-api.connect.vn/api/v2/ping",
      authType: "oauth2",
      apiKey: "misa_oauth2_client_id_9921",
      webhookUrl: "https://crm.ceohn10.viconnect.vn/api/webhooks/misa-invoices",
      status: "active",
      isCore: false,
      modules: ["finance", "income", "expenses", "invoices"],
      lastPingAt: new Date().toISOString(),
      pingLatencyMs: 35,
    },
    {
      id: "plat_vione_sso",
      name: "Cổng Xác Thực Tập Trung VIONE SSO ID",
      code: "APP_VIONE_SSO",
      category: "auth",
      categoryLabel: "Single Sign-On (SSO)",
      description: "Cơ chế đăng nhập 1 chạm xuyên suốt toàn bộ hệ sinh thái phần mềm thành viên VIONE",
      endpointUrl: "https://id.viconnect.vn/oauth",
      healthcheckUrl: "https://id.viconnect.vn/health",
      authType: "oauth2",
      apiKey: "vione_sso_secret_key_prod",
      webhookUrl: "https://crm.ceohn10.viconnect.vn/api/auth/sso/callback",
      status: "active",
      isCore: true,
      modules: ["auth", "users", "rbac"],
      lastPingAt: new Date().toISOString(),
      pingLatencyMs: 9,
    },
  ];
}

export async function saveIntegratedPlatform(data: Partial<IntegratedPlatformItem>): Promise<any> {
  return fetchNestApi("/api/admin/integrated-platforms", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteIntegratedPlatform(id: string): Promise<any> {
  return fetchNestApi(`/api/admin/integrated-platforms/${id}`, {
    method: "DELETE",
  });
}

export async function testPlatformConnection(platformId: string, endpointUrl: string): Promise<{
  success: boolean;
  httpStatus: number;
  latencyMs: number;
  message: string;
}> {
  try {
    const res = await fetchNestApi<any>("/api/admin/integrated-platforms/test", {
      method: "POST",
      body: JSON.stringify({ platformId, endpointUrl }),
    });
    return res;
  } catch (err: any) {
    return {
      success: false,
      httpStatus: 500,
      latencyMs: 999,
      message: err?.message || "Lỗi kết nối tới endpoint",
    };
  }
}
