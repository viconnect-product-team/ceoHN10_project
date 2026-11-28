import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/dashboard/AppShell";
import { LuckyDrawLandingBanner } from "@/components/dashboard/LuckyDrawLandingBanner";
import { ArrowLeft, Sparkles, Trophy, Maximize2, Minimize2, Radio, Star } from "lucide-react";

export const Route = createFileRoute("/lucky-draw")({
  ssr: false,
  component: LuckyDrawRoutePage,
});

function GameShowLuckyDrawStage({
  isAuthenticated,
  stageFullscreen,
  onToggleFullscreen,
}: {
  isAuthenticated: boolean;
  stageFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden rounded-none sm:rounded-3xl bg-[#050816] text-white shadow-2xl">
      <style>{`
        @keyframes stageBeam {
          0%, 100% { transform: rotate(-12deg) scaleY(1); opacity: 0.25; }
          50% { transform: rotate(10deg) scaleY(1.08); opacity: 0.42; }
        }
        @keyframes marqueePulse {
          0%, 100% { box-shadow: 0 0 24px rgba(245, 158, 11, 0.35), inset 0 0 18px rgba(245, 158, 11, 0.15); }
          50% { box-shadow: 0 0 42px rgba(251, 191, 36, 0.65), inset 0 0 28px rgba(251, 191, 36, 0.28); }
        }
        .gameshow-stage-beam {
          animation: stageBeam 7s ease-in-out infinite;
        }
        .gameshow-marquee-glow {
          animation: marqueePulse 3.2s ease-in-out infinite;
        }
      `}</style>

      {/* Spotlight Beams & Gala Stage Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute -top-24 left-[12%] h-[480px] w-56 origin-top bg-gradient-to-b from-amber-400/30 via-amber-500/10 to-transparent blur-2xl gameshow-stage-beam"
        />
        <div
          className="absolute -top-24 right-[12%] h-[480px] w-56 origin-top bg-gradient-to-b from-violet-400/30 via-fuchsia-500/10 to-transparent blur-2xl gameshow-stage-beam"
          style={{ animationDelay: "1.8s" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 15%, rgba(245, 158, 11, 0.16) 0%, transparent 45%), radial-gradient(circle at 15% 80%, rgba(59, 130, 246, 0.14) 0%, transparent 40%), radial-gradient(circle at 85% 80%, rgba(168, 85, 247, 0.14) 0%, transparent 40%)",
          }}
        />
      </div>

      {/* Game Show Top Control Bar */}
      <div className="relative z-20 mx-auto max-w-[1380px] px-4 sm:px-8 pt-5 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {isAuthenticated && !stageFullscreen && (
            <Link
              to="/voting"
              search={{ tab: "all", page: 1, size: 10 }}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white hover:bg-white/20 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Về CRM</span>
            </Link>
          )}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/15 border border-amber-400/40 text-amber-300 text-xs font-extrabold tracking-wider uppercase">
            <Radio className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            <span>PUBLIC LIVE GAME SHOW · CEO HN10</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 hover:bg-amber-500/25 px-4 py-2 text-xs font-bold text-amber-200 cursor-pointer transition"
            >
              {stageFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              <span>{stageFullscreen ? "Thoát Sân Khấu" : "Mở Sân Khấu Public"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Game Show Marquee Hero Banner */}
      <div className="relative z-20 mx-auto max-w-[1380px] px-4 sm:px-8 pb-10 space-y-6">
        <div className="gameshow-marquee-glow rounded-3xl border-2 border-amber-400/60 bg-gradient-to-r from-[#0B1120]/95 via-[#17203B]/95 to-[#0B1120]/95 p-5 sm:p-7 text-center relative overflow-hidden">
          <div className="flex items-center justify-center gap-2 text-amber-300 text-xs font-black uppercase tracking-[0.22em] mb-2">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span>GALA VINH DANH &amp; BỐC THĂM TRÚNG THƯỞNG</span>
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent drop-shadow">
            LUCKY DRAW GAME SHOW · CEO HN10
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto flex items-center justify-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Sân khấu quay số may mắn công khai thời gian thực · Danh sách số may mắn cập nhật trực tiếp từ Check-in</span>
          </p>
        </div>

        {/* Lucky Draw Interactive Arena */}
        <div className="rounded-3xl border border-amber-400/30 bg-white/95 text-slate-900 p-3 sm:p-6 shadow-[0_25px_70px_rgba(0,0,0,0.65)]">
          <LuckyDrawLandingBanner />
        </div>
      </div>
    </div>
  );
}

function LuckyDrawRoutePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [stageFullscreen, setStageFullscreen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token") || localStorage.getItem("token");
      setIsAuthenticated(Boolean(token));
    }
  }, []);

  // Public visitors or Stage Fullscreen mode render without AppShell
  if (!isAuthenticated || stageFullscreen) {
    return (
      <GameShowLuckyDrawStage
        isAuthenticated={isAuthenticated}
        stageFullscreen={stageFullscreen}
        onToggleFullscreen={() => setStageFullscreen((v) => !v)}
      />
    );
  }

  return (
    <AppShell>
      <GameShowLuckyDrawStage
        isAuthenticated={isAuthenticated}
        stageFullscreen={stageFullscreen}
        onToggleFullscreen={() => setStageFullscreen((v) => !v)}
      />
    </AppShell>
  );
}
