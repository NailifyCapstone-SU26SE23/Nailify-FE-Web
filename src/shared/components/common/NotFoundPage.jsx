import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Home, ArrowLeft, Compass } from "lucide-react";
import { useAuth } from "../../../features/core/auth/hooks/useAuth";
import { useLanguage } from "../../hooks/useLanguage";
import { ROUTES } from "../../constants/routes";

export default function NotFoundPage() {
  const { isAuthenticated, role } = useAuth();
  const { language } = useLanguage();

  const getHomePath = () => {
    if (!isAuthenticated) return ROUTES.login;
    switch (role) {
      case "admin":
        return ROUTES.adminDashboard;
      case "manager":
        return ROUTES.managerDashboard;
      case "receptionist":
        return ROUTES.receptionistDashboard;
      case "staff":
        return ROUTES.staffDashboard;
      default:
        return ROUTES.root;
    }
  };

  const texts = {
    vi: {
      title: "404 Không Tìm Thấy Trang",
      subtitle: "Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển đi nơi khác.",
      backHome: "Quay về trang chủ",
      backPrev: "Quay lại trang trước",
      lostText: "Có vẻ như bạn đã đi lạc...",
      explore: "Khám phá tiệm Nailify"
    },
    en: {
      title: "404 Not Found",
      subtitle: "The page you are looking for doesn't exist or has been moved to another station.",
      backHome: "Back to Home",
      backPrev: "Go back",
      lostText: "Looks like you wandered off...",
      explore: "Explore Nailify"
    }
  };

  const t = texts[language === "vi" ? "vi" : "en"];

  // Framer motion variants
  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-[#fff6fa] px-4 font-sans">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[500px] w-[500px] rounded-full bg-gradient-to-br from-[#ffcde2]/60 to-transparent blur-[100px] animate-[pulse_10s_ease-in-out_infinite]" />
        <div className="absolute -right-[10%] -bottom-[10%] h-[600px] w-[600px] rounded-full bg-gradient-to-tl from-[#e9d5ff]/50 to-transparent blur-[120px] animate-[pulse_12s_ease-in-out_infinite]" />
        <div className="absolute left-[30%] top-[40%] h-[300px] w-[300px] rounded-full bg-[#fdf0f5] blur-[80px]" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-lg rounded-[36px] border border-white/70 bg-white/40 p-8 text-center shadow-[0_24px_60px_rgba(236,72,153,0.1)] backdrop-blur-2xl sm:p-12"
      >
        {/* Animated Custom Nail Polish Spilling SVG */}
        <motion.div variants={itemVariants} className="mb-6 flex justify-center">
          <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto drop-shadow-[0_16px_30px_rgba(234,79,147,0.22)]">
            <style>{`
              @keyframes spill {
                0% { transform: translate(0, 0) scale(1); }
                50% { transform: translate(1px, 2px) scale(1.02); }
                100% { transform: translate(0, 0) scale(1); }
              }
              @keyframes drip {
                0% { transform: translateY(0); opacity: 0; }
                20% { opacity: 1; }
                80% { transform: translateY(55px); opacity: 1; }
                100% { transform: translateY(55px) scaleX(1.3); opacity: 0; }
              }
              @keyframes float-bottle {
                0% { transform: rotate(-35deg) translateY(0px); }
                50% { transform: rotate(-32deg) translateY(-6px); }
                100% { transform: rotate(-35deg) translateY(0px); }
              }
              .spill-liquid {
                animation: spill 4s ease-in-out infinite;
              }
              .dripping-dot {
                animation: drip 2.2s cubic-bezier(0.5, 0, 0.7, 0.4) infinite;
              }
              .floating-bottle {
                animation: float-bottle 4s ease-in-out infinite;
                transform-origin: 120px 80px;
              }
            `}</style>

            {/* Puddle of spilled polish */}
            <path
              className="spill-liquid"
              d="M 35,145 C 45,128 85,132 105,137 C 125,142 165,135 170,155 C 175,175 135,185 95,185 C 45,185 25,165 35,145 Z"
              fill="url(#polishGrad)"
            />

            {/* Drip droplet */}
            <path
              className="dripping-dot"
              d="M 68,90 Q 68,95 71,95 Q 74,95 74,90 C 74,83 68,83 68,90 Z"
              fill="#ea4f93"
            />

            {/* Tilted Nail Polish Bottle */}
            <g className="floating-bottle" transform="rotate(-35, 120, 80)">
              {/* Bottle body */}
              <rect x="75" y="45" width="55" height="55" rx="14" fill="#ffffff" stroke="#fce7f3" strokeWidth="3" />
              {/* Label on bottle */}
              <rect x="83" y="58" width="39" height="28" rx="5" fill="url(#polishGrad)" opacity="0.9" />
              <text x="102" y="76" fill="#ffffff" fontSize="11" fontWeight="900" textAnchor="middle" letterSpacing="0.05em" fontFamily="sans-serif">404</text>
              {/* Bottle neck */}
              <rect x="91" y="30" width="22" height="15" fill="#f8dae9" rx="2" />
              {/* Bottle cap */}
              <rect x="96" y="-5" width="12" height="35" rx="3" fill="#3f2b3f" />
              {/* Liquid inside the bottle */}
              <path d="M 77,78 Q 102,87 127,78 L 127,87 Q 102,97 77,87 Z" fill="#ea4f93" opacity="0.35" />
            </g>

            {/* Gradients */}
            <defs>
              <linearGradient id="polishGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ff8ebb" />
                <stop offset="50%" stopColor="#ea4f93" />
                <stop offset="100%" stopColor="#cc437a" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        {/* 404 Text */}
        <motion.div variants={itemVariants} className="mb-2">
          <span className="inline-block rounded-full bg-[#fff0f6] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] text-[#ea4f93] shadow-[0_4px_12px_rgba(234,79,147,0.08)]">
            {t.lostText}
          </span>
        </motion.div>

        {/* Heading */}
        <motion.h1
          variants={itemVariants}
          className="text-3xl font-bold tracking-tight text-[#ec4899] sm:text-4xl leading-tight"
        >
          {t.title}
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="mt-4 text-sm font-medium leading-relaxed text-[#9b7c8f] sm:text-base px-2"
        >
          {t.subtitle}
        </motion.p>

        {/* Navigation Buttons */}
        <motion.div
          variants={itemVariants}
          className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
        >
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl border border-[#f8c8db] bg-white/70 px-6 text-sm font-semibold text-[#eb5a99] shadow-sm transition-all hover:bg-white hover:shadow-md hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            <ArrowLeft size={16} />
            {t.backPrev}
          </button>

          <Link
            to={getHomePath()}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff8ebb] to-[#ea4f93] px-6 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(236,72,153,0.22)] transition-all hover:opacity-95 hover:shadow-[0_12px_28px_rgba(236,72,153,0.32)] hover:-translate-y-0.5 whitespace-nowrap shrink-0"
          >
            <Home size={16} />
            {t.backHome}
          </Link>
        </motion.div>

        {/* Footer Link / Decorative info */}
        <motion.div
          variants={itemVariants}
          className="mt-10 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400"
        >
          <Compass size={14} className="text-[#ff8ebb]" />
          <span>Nailify Workspace Console</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
