import { createRouter, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { routeTree } from "./routeTree.gen";
import { ensureSessionCookiesSync } from "@/lib/api-client";

function DefaultErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const [showStack, setShowStack] = useState(false);
  const [copied, setCopied] = useState(false);

  const errorMessage = error?.message || "Lỗi không xác định khi tải dữ liệu trang.";
  const isAuthError =
    errorMessage.toLowerCase().includes("unauthorized") ||
    errorMessage.toLowerCase().includes("token") ||
    errorMessage.toLowerCase().includes("jwt") ||
    errorMessage.toLowerCase().includes("401");

  const handleCopy = () => {
    try {
      const details = `Lỗi: ${errorMessage}\n\nStack:\n${error?.stack || "N/A"}\n\nURL: ${window.location.href}`;
      navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="max-w-lg w-full text-center bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive shadow-inner">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Đã xảy ra sự cố khi tải trang
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          {isAuthError
            ? "Phiên làm việc đã hết hạn hoặc chưa được cấp quyền truy cập. Vui lòng đăng nhập lại."
            : "Hệ thống gặp gián đoạn tạm thời khi kết nối máy chủ. Quý thành viên vui lòng thử lại."}
        </p>

        {/* Khung hiển thị chi tiết thông điệp lỗi thực tế */}
        <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-left">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-destructive uppercase tracking-wider">
              Chi tiết lỗi
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-medium text-destructive hover:underline cursor-pointer"
            >
              {copied ? "Đã sao chép" : "Sao chép lỗi"}
            </button>
          </div>
          <p className="mt-1 font-mono text-xs text-foreground/90 break-words whitespace-pre-wrap">
            {errorMessage}
          </p>

          {error?.stack && (
            <div className="mt-2 pt-2 border-t border-destructive/10">
              <button
                type="button"
                onClick={() => setShowStack(!showStack)}
                className="text-[11px] text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                {showStack ? "Ẩn Call Stack kỹ thuật" : "Xem Call Stack kỹ thuật"}
              </button>
              {showStack && (
                <pre className="mt-2 max-h-44 overflow-auto rounded bg-muted/60 p-2 font-mono text-[10px] text-muted-foreground whitespace-pre-wrap">
                  {error.stack}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Nút điều hướng thao tác */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {isAuthError && (
            <a
              href="/auth"
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90"
            >
              Đăng nhập lại
            </a>
          )}
          <button
            type="button"
            onClick={() => {
              ensureSessionCookiesSync();
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow transition hover:bg-primary/90 cursor-pointer"
          >
            Thử tải lại
          </button>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                window.location.href = "/";
              }
            }}
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-xs sm:text-sm font-medium text-foreground transition hover:bg-accent cursor-pointer"
          >
            Quay lại
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-xs sm:text-sm font-medium text-foreground transition hover:bg-accent"
          >
            Về Trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadDelay: 50,
    defaultPreloadStaleTime: 30000,
    defaultErrorComponent: DefaultErrorComponent,
  });

  return router;
};
