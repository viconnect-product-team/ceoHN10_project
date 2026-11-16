import { createFileRoute } from "@tanstack/react-router";
import { Ceo1983FullLandingWeb } from "@/components/landing/Ceo1983FullLandingWeb";

export const Route = createFileRoute("/intro")({
  head: () => ({
    meta: [
      { title: "CLB Doanh Nhân CEO HN10 (HanoiBA) — Trang Giới Thiệu Chính Thức" },
      {
        name: "description",
        content:
          "Cộng đồng kết nối giao thương B2B, xúc tiến thương mại và nâng tầm giá trị thương hiệu cho các chủ doanh nghiệp CEO Hà Nội 10 trực thuộc Hội Doanh Nghiệp Trẻ Hà Nội (HanoiBA).",
      },
      { property: "og:title", content: "CLB Doanh Nhân CEO HN10 (HanoiBA)" },
      {
        property: "og:description",
        content: "Mạng lưới kết nối giao thương B2B và nâng tầm thương hiệu doanh nhân CEO HN10.",
      },
      { property: "og:image", content: "https://ceohn10.viconnect.vn/ceohn10_hero_daylight_skyline.jpg" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: IntroPage,
});

function IntroPage() {
  return <Ceo1983FullLandingWeb />;
}

