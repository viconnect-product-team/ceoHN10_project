import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect, useMemo } from "react";
import {
  MessageSquare,
  Star,
  Calendar,
  GraduationCap,
  Paperclip,
  Search,
  Filter,
  Download,
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageCircle,
  FileSpreadsheet,
  Building2,
  Sparkles,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/dashboard/AppShell";
import { PageHeader } from "@/components/dashboard/PageKit";
import { fetchNestApi, resolveMediaUrl } from "@/lib/api-client";
import {
  CustomTable,
  useCustomTableSort,
  CrmMetricCard,
  CrmMetricGrid,
  CrmToolbar,
  type CustomTableColumn,
} from "@/components/common/CustomTable";

export const Route = createFileRoute("/feedback")({
  component: FeedbackManagementPage,
});

interface FeedbackRecord {
  id: string;
  targetId: string;
  targetTitle: string;
  targetType: "event" | "training" | string;
  targetCategory: string;
  respondentName: string;
  rating: number;
  comment: string;
  attachmentUrl?: string | null;
  status: string;
  createdAt: string;
  recommendScore?: number;
  suggestions?: string;
}

function FeedbackManagementPage() {
  const [loading, setLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState<FeedbackRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackRecord | null>(null);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetchNestApi<any>("/admin/feedbacks");
      if (res && Array.isArray(res.items)) {
        setFeedbacks(res.items);
      } else if (Array.isArray(res)) {
        setFeedbacks(res);
      } else {
        setFeedbacks([]);
      }
    } catch {
      toast.error("Không thể tải danh sách phản ánh.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFeedbacks();
  }, []);

  const filteredFeedbacks = useMemo(() => {
    let result = feedbacks;
    if (categoryFilter !== "all") {
      result = result.filter((item) => item.targetType === categoryFilter);
    }
    if (ratingFilter !== "all") {
      result = result.filter((item) => item.rating === Number(ratingFilter));
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.respondentName.toLowerCase().includes(s) ||
          item.targetTitle.toLowerCase().includes(s) ||
          item.comment.toLowerCase().includes(s)
      );
    }
    return result;
  }, [feedbacks, categoryFilter, ratingFilter, searchTerm]);

  const { sortKey, sortDir, handleSort, sortData } = useCustomTableSort<FeedbackRecord>(
    "createdAt",
    "desc"
  );

  const sorted = useMemo(() => {
    return sortData(filteredFeedbacks, {
      createdAt: (r) => new Date(r.createdAt).getTime(),
      rating: (r) => r.rating,
      targetTitle: (r) => r.targetTitle,
      respondentName: (r) => r.respondentName,
    });
  }, [filteredFeedbacks, sortData]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  // Thống kê Metrics
  const metrics = useMemo(() => {
    const total = feedbacks.length;
    const eventCount = feedbacks.filter((x) => x.targetType === "event").length;
    const trainingCount = feedbacks.filter((x) => x.targetType === "training").length;
    const avgRating =
      total > 0
        ? Number((feedbacks.reduce((acc, curr) => acc + curr.rating, 0) / total).toFixed(1))
        : 5.0;

    return { total, eventCount, trainingCount, avgRating };
  }, [feedbacks]);

  // Xuất file Excel
  const handleExportExcel = () => {
    if (filteredFeedbacks.length === 0) {
      toast.info("Không có dữ liệu phản ánh để xuất file.");
      return;
    }
    const headers = [
      "STT",
      "Phân Loại",
      "Hoạt Động / Khóa Học",
      "Hội Viên Phản Ánh",
      "Đánh Giá (Sao)",
      "Nội Dung Góp Ý",
      "Thời Gian",
    ];
    const rows = filteredFeedbacks.map((item, index) => [
      index + 1,
      item.targetCategory,
      `"${item.targetTitle.replace(/"/g, '""')}"`,
      `"${item.respondentName.replace(/"/g, '""')}"`,
      item.rating,
      `"${item.comment.replace(/"/g, '""')}"`,
      new Date(item.createdAt).toLocaleString("vi-VN"),
    ]);

    const csvContent =
      "\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Bao_Cao_Phan_Anh_CEOHN10_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Xuất danh sách phản ánh & góp ý thành công!");
  };

  const columns: CustomTableColumn<FeedbackRecord>[] = [
    {
      key: "targetCategory",
      label: "PHÂN LOẠI",
      width: 160,
      render: (r) => {
        const isEvent = r.targetType === "event";
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border ${
              isEvent
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30"
            }`}
          >
            {isEvent ? <Calendar className="h-3.5 w-3.5" /> : <GraduationCap className="h-3.5 w-3.5" />}
            <span>{r.targetCategory}</span>
          </span>
        );
      },
    },
    {
      key: "targetTitle",
      label: "HOẠT ĐỘNG / KHÓA HỌC",
      minWidth: 200,
      render: (r) => (
        <div className="py-1">
          <p className="text-xs font-bold text-foreground leading-snug line-clamp-1">{r.targetTitle}</p>
          <span className="text-[11px] text-muted-foreground">ID: #{r.targetId?.slice(0, 8)}</span>
        </div>
      ),
    },
    {
      key: "respondentName",
      label: "HỘI VIÊN GỬI",
      width: 170,
      render: (r) => (
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-primary/10 text-primary text-xs font-black">
            {r.respondentName.slice(0, 1).toUpperCase()}
          </div>
          <span className="text-xs font-bold text-foreground">{r.respondentName}</span>
        </div>
      ),
    },
    {
      key: "rating",
      label: "ĐÁNH GIÁ",
      width: 130,
      sortable: true,
      render: (r) => (
        <div className="flex items-center gap-1 text-amber-500">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${
                i < r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"
              }`}
            />
          ))}
          <span className="ml-1 text-xs font-bold text-foreground">{r.rating}/5</span>
        </div>
      ),
    },
    {
      key: "comment",
      label: "NỘI DUNG GÓP Ý & TỆP ĐÍNH KÈM",
      minWidth: 280,
      render: (r) => (
        <div className="py-1">
          <p className="text-xs text-foreground/90 leading-relaxed">{r.comment || "(Không có bình luận chữ)"}</p>
          {r.attachmentUrl && (
            <div className="mt-2 flex items-center gap-2">
              <a
                href={resolveMediaUrl(r.attachmentUrl) || r.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-primary hover:bg-muted transition"
              >
                <Paperclip className="h-3.5 w-3.5" />
                <span>Xem tệp đính kèm</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      label: "THỜI GIAN GỬI",
      width: 140,
      sortable: true,
      render: (r) => (
        <span className="text-xs text-muted-foreground">
          {r.createdAt ? new Date(r.createdAt).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" }) : ""}
        </span>
      ),
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title="Quản lý Phản ánh & Góp ý Hội viên"
          subtitle="Hệ thống tiếp nhận, tổng hợp và lắng nghe ý kiến đánh giá sau mỗi sự kiện, buổi đào tạo của CLB Doanh Nhân CEO HN10."
          actions={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadFeedbacks}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted transition cursor-pointer shadow-xs"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                <span>Làm mới</span>
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition cursor-pointer shadow-sm"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Xuất file Excel</span>
              </button>
            </div>
          }
        />

        {/* ── METRIC STAT CARDS ── */}
        <CrmMetricGrid>
          <CrmMetricCard
            label="Tổng số phản ánh"
            value={metrics.total}
            icon={MessageSquare}
            tone="sky"
            sub="Tất cả đánh giá đã gửi"
          />
          <CrmMetricCard
            label="Đánh giá trung bình"
            value={`${metrics.avgRating} / 5`}
            icon={Star}
            tone="orange"
            sub="Mức độ hài lòng chung"
          />
          <CrmMetricCard
            label="Góp ý sự kiện"
            value={metrics.eventCount}
            icon={Calendar}
            tone="green"
            sub="Từ các chương trình CLB"
          />
          <CrmMetricCard
            label="Góp ý khóa học"
            value={metrics.trainingCount}
            icon={GraduationCap}
            tone="violet"
            sub="Từ 30 buổi học thứ 7 & lớp riêng"
          />
        </CrmMetricGrid>

        {/* ── TOOLBAR BỘ LỌC ── */}
        <CrmToolbar
          searchPlaceholder="Tìm theo tên hội viên, nội dung phản ánh..."
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
        >
          {/* Lọc theo phân loại */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer"
            >
              <option value="all">Tất cả hoạt động</option>
              <option value="event">Sự kiện CLB</option>
              <option value="training">Lớp học đào tạo</option>
            </select>
          </div>

          {/* Lọc theo mức sao */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground outline-none cursor-pointer"
            >
              <option value="all">Tất cả số sao</option>
              <option value="5">5 sao (Xuất sắc)</option>
              <option value="4">4 sao (Tốt)</option>
              <option value="3">3 sao (Khá)</option>
              <option value="2">2 sao (Cần cải thiện)</option>
              <option value="1">1 sao (Kém)</option>
            </select>
          </div>
        </CrmToolbar>

        {/* ── BẢNG DỮ LIỆU CUSTOMTABLE ── */}
        <CustomTable<FeedbackRecord>
          columns={columns}
          data={pagedRows}
          keyExtractor={(r) => r.id}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          showStt={true}
          page={page}
          pageSize={pageSize}
          total={sorted.length}
          onPageChange={setPage}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize);
            setPage(1);
          }}
          actionColumn={{
            title: "THAO TÁC",
            width: 120,
            render: (r) => (
              <button
                type="button"
                onClick={() => setSelectedFeedback(r)}
                className="flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-primary hover:bg-muted transition cursor-pointer shadow-xs"
              >
                <Eye className="h-3.5 w-3.5" />
                <span>Chi tiết</span>
              </button>
            ),
          }}
        />

        {/* ── MODAL CHI TIẾT PHẢN ÁNH ── */}
        {selectedFeedback && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
            onClick={() => setSelectedFeedback(null)}
          >
            <div
              className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Chi tiết Ý kiến Phản ánh</h3>
                    <p className="text-xs text-muted-foreground">{selectedFeedback.targetCategory}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFeedback(null)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-muted-foreground">Hoạt động / Khóa học:</span>
                  <p className="font-semibold text-foreground text-sm mt-0.5">{selectedFeedback.targetTitle}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="font-bold text-muted-foreground">Hội viên phản ánh:</span>
                    <p className="font-semibold text-foreground mt-0.5">{selectedFeedback.respondentName}</p>
                  </div>
                  <div>
                    <span className="font-bold text-muted-foreground">Mức đánh giá:</span>
                    <div className="flex items-center gap-1 mt-0.5 text-amber-500 font-bold">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span>{selectedFeedback.rating} / 5 sao</span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-muted-foreground">Nội dung đóng góp:</span>
                  <div className="mt-1 rounded-xl border border-border bg-muted/30 p-3 text-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedFeedback.comment || "Không có nhận xét chi tiết."}
                  </div>
                </div>
                {selectedFeedback.attachmentUrl && (
                  <div>
                    <span className="font-bold text-muted-foreground">Tệp đính kèm:</span>
                    <div className="mt-1">
                      <a
                        href={resolveMediaUrl(selectedFeedback.attachmentUrl) || selectedFeedback.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 py-1.5 font-bold text-primary hover:bg-primary/20 transition"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        <span>Mở tệp đính kèm / hình ảnh</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                )}
                <div>
                  <span className="font-bold text-muted-foreground">Thời gian ghi nhận:</span>
                  <p className="text-muted-foreground mt-0.5">
                    {new Date(selectedFeedback.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Đã ghi nhận tiếp thu phản ánh của hội viên!");
                    setSelectedFeedback(null);
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 transition shadow-sm"
                >
                  Xác nhận tiếp thu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
