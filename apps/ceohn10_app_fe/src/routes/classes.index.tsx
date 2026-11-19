import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap,
  Users,
  QrCode,
  BookOpen,
  UserCheck,
  Plus,
  Search,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Filter,
  Download,
  Share2,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/dashboard/AppShell";
import { fetchNestApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/classes/")({
  ssr: false,
  validateSearch: (search: Record<string, unknown>): { tab?: string } => ({
    tab: typeof search.tab === "string" ? search.tab : "courses",
  }),
  component: ClassesManagementPage,
});

function ClassesManagementPage() {
  const search = Route.useSearch();
  const [activeTab, setActiveTab] = useState<string>(search.tab || "courses");

  // Query classes / trainings
  const classesQ = useQuery({
    queryKey: ["classes-list"],
    queryFn: async () => {
      try {
        const res = await fetchNestApi<any[]>("/trainings");
        if (Array.isArray(res)) return res;
      } catch {}
      return [];
    },
  });

  // State: modal QR điểm danh
  const [selectedSessionForQr, setSelectedSessionForQr] = useState<any | null>(null);

  // Danh sách giáo viên mẫu / từ CSDL
  const teachers = [
    {
      id: "tc-1",
      name: "TS. Nguyễn Trí Hiếu",
      title: "Chuyên gia Tài chính & Ngân hàng quốc tế",
      coursesCount: 4,
      studentsCount: 180,
      phone: "0903123456",
      email: "hieu.nguyen@ceohn10.vn",
      rating: 4.9,
    },
    {
      id: "tc-2",
      name: "ThS. Đỗ Hoài Nam",
      title: "Chuyên gia Quản trị Chiến lược & Tăng trưởng",
      coursesCount: 3,
      studentsCount: 140,
      phone: "0912987654",
      email: "nam.do@ceohn10.vn",
      rating: 4.8,
    },
    {
      id: "tc-3",
      name: "Bà Phạm Thanh Hưng",
      title: "Chuyên gia Đàm phán B2B & Đầu tư Doanh nghiệp",
      coursesCount: 5,
      studentsCount: 220,
      phone: "0988554433",
      email: "hung.pham@ceohn10.vn",
      rating: 5.0,
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Nhóm Lớp CEOHN10
              </h2>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Quản trị giáo viên, lớp học, học viên đăng ký, học viên trợ thính và mã QR điểm danh theo buổi học
            </p>
          </div>

          <Link
            to="/trainings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-semibold hover:bg-muted transition"
          >
            <span>Mở giao diện Đào tạo nâng cao</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-border">
          {[
            { key: "teachers", label: "Quản lý Giáo viên", icon: Users },
            { key: "courses", label: "Quản lý Lớp học", icon: BookOpen },
            { key: "enrollments", label: "Học viên đăng ký", icon: UserCheck },
            { key: "auditors", label: "Học viên trợ thính", icon: GraduationCap },
            { key: "attendance-qr", label: "Mã QR điểm danh theo buổi", icon: QrCode },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer ${
                  isActive
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB: Quản lý Giáo viên */}
        {activeTab === "teachers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Danh sách giảng viên &amp; chuyên gia đào tạo ({teachers.length})
              </span>
              <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" /> Thêm Giáo Viên
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teachers.map((tc) => (
                <div key={tc.id} className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{tc.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">{tc.title}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                      ★ {tc.rating}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs text-muted-foreground">
                    <div>
                      <span className="font-semibold text-foreground">{tc.coursesCount}</span> lớp phụ trách
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">{tc.studentsCount}</span> học viên
                    </div>
                  </div>

                  <div className="text-[11px] text-muted-foreground font-mono">
                    ĐT: {tc.phone} · {tc.email}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Quản lý Lớp học */}
        {activeTab === "courses" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Danh sách khóa học &amp; lớp học CEO HN10 ({classesQ.data?.length || 0})
              </span>
              <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" /> Mở Lớp Học Mới
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(classesQ.data || []).map((c: any) => (
                <div key={c.id} className="p-5 rounded-2xl border border-border bg-card shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20 uppercase font-mono">
                        {c.code || "CEO-LHP"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        {c.status === "completed" ? "Đã kết thúc" : "Đang mở"}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-foreground line-clamp-2">
                      {c.title}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {c.description || "Chương trình đào tạo chuyên sâu dành riêng cho CEO và nhà quản trị cấp cao."}
                    </p>

                    <div className="pt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{c.duration || "8 buổi"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{c.registered || 25} học viên</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setSelectedSessionForQr(c)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline cursor-pointer"
                    >
                      <QrCode className="h-3.5 w-3.5" /> Điểm danh QR
                    </button>
                    <Link
                      to={`/trainings`}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground"
                    >
                      Chi tiết →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Học viên đăng ký */}
        {activeTab === "enrollments" && (
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Danh sách học viên đăng ký chính thức
              </h3>
              <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> Xuất Excel
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Mã HV</th>
                    <th className="px-4 py-3">Học viên</th>
                    <th className="px-4 py-3">Lớp đăng ký</th>
                    <th className="px-4 py-3">Ngày đăng ký</th>
                    <th className="px-4 py-3 text-center">Học phí</th>
                    <th className="px-4 py-3 text-center">Điểm danh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { id: "HV-101", name: "Nguyễn Văn Hùng", comp: "Công ty Cổ phần TechVibe", course: "CEO Chiến Lược 2026", date: "12/03/2026", fee: "Đã nộp", attend: "8/8 buổi" },
                    { id: "HV-102", name: "Trần Thị Mai", comp: "Tập đoàn Đầu tư An Phát", course: "Tài Chính Quản Trị Cấp Cao", date: "15/03/2026", fee: "Đã nộp", attend: "7/8 buổi" },
                    { id: "HV-103", name: "Lê Hoàng Nam", comp: "Logistics Toàn Cầu HN", course: "CEO Chiến Lược 2026", date: "18/03/2026", fee: "Chờ duyệt", attend: "0/8 buổi" },
                  ].map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-bold">{row.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{row.name}</div>
                        <div className="text-[11px] text-muted-foreground">{row.comp}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{row.course}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.date}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          {row.fee}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-foreground">{row.attend}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Học viên trợ thính */}
        {activeTab === "auditors" && (
          <div className="p-5 rounded-2xl border border-border bg-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Danh sách học viên trợ thính (Dự thính / Khách mời chuyên môn)
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Dành cho hội viên tham gia học bổ trợ, không tính chỉ số tốt nghiệp chính khóa
                </p>
              </div>
              <Button size="sm" className="h-8 gap-1.5 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" /> Tiếp nhận Học viên trợ thính
              </Button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/40 font-semibold text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Mã</th>
                    <th className="px-4 py-3">Học viên trợ thính</th>
                    <th className="px-4 py-3">Lớp trợ thính</th>
                    <th className="px-4 py-3">Buổi tham dự</th>
                    <th className="px-4 py-3">Người giới thiệu</th>
                    <th className="px-4 py-3 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { id: "TT-01", name: "Đặng Quang Huy", comp: "Công ty Cơ khí Chính xác", course: "CEO Chiến Lược 2026", session: "Buổi 3 & 4 (Đàm phán B2B)", ref: "CT. Nguyễn Văn A", status: "Đã duyệt" },
                    { id: "TT-02", name: "Vũ Hải Yến", comp: "Chuỗi Thực phẩm Sạch HN", course: "Tài Chính Quản Trị Cấp Cao", session: "Buổi 1 (Dòng tiền doanh nghiệp)", ref: "Phó CT. Trần B", status: "Đã duyệt" },
                  ].map((row) => (
                    <tr key={row.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono font-bold">{row.id}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{row.name}</div>
                        <div className="text-[11px] text-muted-foreground">{row.comp}</div>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">{row.course}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.session}</td>
                      <td className="px-4 py-3 text-muted-foreground">{row.ref}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: Mã QR điểm danh theo buổi */}
        {activeTab === "attendance-qr" && (
          <div className="p-6 rounded-2xl border border-border bg-card space-y-5">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                <span>Quản Lý Cấu Hình Mã QR Điểm Danh Theo Buổi Học</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Mỗi buổi học có 1 mã QR bảo mật riêng biệt. Học viên quét mã bằng App Mobile CEOHN10 để tự động ghi nhận vào sổ điểm danh điện tử.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { session: "Buổi 1: Định Vị Chiến Lược & Mô Hình Kinh Doanh", course: "CEO Chiến Lược 2026", date: "10/04/2026 · 18:30 - 21:00", attendees: "32/35 HV" },
                { session: "Buổi 2: Tối Ưu Hóa Dòng Tiền & Cấu Trúc Vốn", course: "Tài Chính Quản Trị Cấp Cao", date: "12/04/2026 · 18:30 - 21:00", attendees: "28/30 HV" },
                { session: "Buổi 3: Đàm Phán Hợp Đồng B2B Quốc Tế", course: "CEO Chiến Lược 2026", date: "17/04/2026 · 18:30 - 21:00", attendees: "Chưa diễn ra" },
              ].map((s, idx) => (
                <div key={idx} className="p-5 rounded-2xl border border-border bg-muted/20 space-y-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                    {s.course}
                  </span>
                  <h4 className="text-xs font-bold text-foreground leading-snug">{s.session}</h4>
                  <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{s.date}</span>
                  </div>
                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-foreground">Điểm danh: {s.attendees}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setSelectedSessionForQr({
                          title: s.session,
                          code: `QR-SESS-${idx + 1}`,
                        })
                      }
                      className="h-7 gap-1 text-xs font-semibold"
                    >
                      <QrCode className="h-3 w-3" /> Chiếu QR
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODAL CHIẾU QR ĐIỂM DANH */}
        <Dialog
          open={Boolean(selectedSessionForQr)}
          onOpenChange={(open) => !open && setSelectedSessionForQr(null)}
        >
          <DialogContent className="max-w-sm text-center">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                Mã QR Điểm Danh Buổi Học
              </DialogTitle>
            </DialogHeader>
            {selectedSessionForQr && (
              <div className="space-y-4 py-2">
                <p className="text-xs text-muted-foreground">{selectedSessionForQr.title}</p>
                <div className="w-56 h-56 mx-auto bg-white p-3 rounded-2xl border-2 border-primary/40 shadow-md flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://ceohn10.viconnect.vn/classes/checkin?code=${selectedSessionForQr.code || "CEO-QR"}`}
                    alt="QR Code"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Học viên dùng Camera hoặc App CEO HN10 quét mã này tại lớp để xác nhận điểm danh.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
