/**
 * Helper sinh đường dẫn ảnh QR Code cục bộ từ backend CEO HN10.
 * Tránh hoàn toàn việc gọi dịch vụ ngoài (api.qrserver.com) bị timeout hoặc chặn mạng.
 */
export function getQrUrl(data: string, size = 300): string {
  if (!data) return "";
  return `/api/events/qr?data=${encodeURIComponent(data)}&size=${size}`;
}

export function getPublicAppOrigin(): string {
  const envUrl = (import.meta as any).env?.VITE_PUBLIC_APP_URL;
  if (typeof window !== "undefined") {
    const { protocol, hostname, port, origin } = window.location;
    if (port === "5032") {
      return `${protocol}//${hostname}:5030`;
    }
    if (hostname.startsWith("crm.")) {
      return `${protocol}//${hostname.slice(4)}`;
    }
    if (hostname === "localhost" || hostname === "127.0.0.1" || port === "5030") {
      return origin;
    }
    if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
      return envUrl.trim().replace(/\/+$/, "");
    }
    return origin;
  }
  if (envUrl && typeof envUrl === "string" && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, "");
  }
  return "https://ceohn10.viconnect.vn";
}

export function getAbsoluteQrUrl(data: string, size = 300): string {
  const rel = getQrUrl(data, size);
  if (!rel) return "";
  return `${getPublicAppOrigin()}${rel}`;
}

