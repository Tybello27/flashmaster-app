import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export type TabKey = "home" | "decks" | "study" | "progress" | "profile";

export function cx(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

export function useTheme(dark: boolean) {
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    const meta = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement | null;
    if (meta) meta.content = dark ? "#0f172a" : "#0ea5e9";
  }, [dark]);
}

/**
 * Card — always uses light bg + dark text in light mode, dark bg + light text in dark mode.
 * Never rely on transparent/tinted backgrounds for readability.
 */
export function Card({ children, className = "", ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        "bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-50",
        "border border-gray-200 dark:border-gray-700",
        "rounded-xl shadow-sm p-4",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Button({
  children, onClick, className = "", disabled = false, type = "button", variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "danger";
}) {
  const variants = {
    // Blue bg → white text
    primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800",
    // Light gray bg → black text (light) | Dark gray bg → white text (dark)
    secondary:
      "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600",
    // Red bg → white text
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "w-full py-2.5 px-4 rounded-lg font-semibold transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function IconButton({
  children, onClick, className = "", title,
}: {
  children: React.ReactNode; onClick?: () => void; className?: string; title?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cx(
        "w-10 h-10 grid place-items-center rounded-full transition-colors text-lg",
        "text-gray-900 hover:bg-gray-100",
        "dark:text-white dark:hover:bg-gray-700",
        className
      )}
    >
      {children}
    </button>
  );
}

/**
 * Chip — filter/pill button. Selected: solid blue + white text.
 * Unselected: light gray bg + black text (light) / dark gray + white (dark).
 */
export function Chip({
  children, active, onClick,
}: {
  children: React.ReactNode; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors",
        active
          ? "bg-primary-600 text-white"
          : "bg-gray-100 text-gray-900 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
      )}
    >
      {children}
    </button>
  );
}

export function Input({
  value, onChange, placeholder, className = "", type = "text",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={cx(
        "w-full p-3 rounded-lg outline-none transition-colors",
        "bg-white text-gray-900 placeholder:text-gray-500",
        "border border-gray-300",
        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30",
        "dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400",
        "dark:border-gray-600 dark:focus:border-primary-400",
        className
      )}
    />
  );
}

export function Textarea({
  value, onChange, placeholder, className = "", rows = 3,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      className={cx(
        "w-full p-3 rounded-lg outline-none transition-colors resize-none",
        "bg-white text-gray-900 placeholder:text-gray-500",
        "border border-gray-300",
        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30",
        "dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400",
        "dark:border-gray-600 dark:focus:border-primary-400",
        className
      )}
    />
  );
}

export function Select({
  value, onChange, children, className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={cx(
        "w-full p-3 rounded-lg outline-none transition-colors",
        "bg-white text-gray-900",
        "border border-gray-300",
        "focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30",
        "dark:bg-gray-800 dark:text-white dark:border-gray-600",
        className
      )}
    >
      {children}
    </select>
  );
}

export function ProgressRing({
  value, size = 120, stroke = 10, label, sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={r}
          className="stroke-gray-200 dark:stroke-gray-700"
          strokeWidth={stroke} fill="none"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          className="stroke-primary-600 dark:stroke-primary-400"
          strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - v) }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          {label && <div className="text-xl font-extrabold text-gray-900 dark:text-white">{label}</div>}
          {sublabel && <div className="text-[10px] text-gray-600 dark:text-gray-300 mt-0.5">{sublabel}</div>}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon, title, subtitle, action,
}: {
  icon: string; title: string; subtitle?: string; action?: React.ReactNode;
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
      {subtitle && <p className="text-gray-600 dark:text-gray-300 mt-1">{subtitle}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Toast({ message, show }: { message: string; show: boolean }) {
  return show ? (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2.5 rounded-full shadow-lg font-medium text-sm"
    >
      {message}
    </motion.div>
  ) : null;
}

export function useToast() {
  const [msg, setMsg] = useState("");
  const [show, setShow] = useState(false);
  const t = useRef<number | null>(null);
  const fire = (m: string) => {
    setMsg(m);
    setShow(true);
    if (t.current) clearTimeout(t.current);
    t.current = window.setTimeout(() => setShow(false), 2000);
  };
  return { msg, show, fire };
}

/**
 * InstallButton — persistent, high-contrast banner at the top of the screen.
 * Dark background + white text so it's readable in both themes.
 */
/**
 * Global PWA install state — persists the deferred prompt so any component
 * can trigger install (banner on Home + button in Settings).
 */
let _deferredPrompt: any = null;
const _listeners: Set<() => void> = new Set();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    _deferredPrompt = e;
    _listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    _deferredPrompt = null;
    _listeners.forEach((l) => l());
  });
}

export function usePwaInstall() {
  const [, force] = useState(0);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const cb = () => force((x) => x + 1);
    _listeners.add(cb);
    const ua = navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as any).standalone;
    setIsIOS(iOS);
    setIsStandalone(!!standalone);
    return () => { _listeners.delete(cb); };
  }, []);

  const canInstall = !!_deferredPrompt && !isStandalone;
  const showIOSHint = isIOS && !isStandalone;

  const promptInstall = async () => {
    if (!_deferredPrompt) return "unavailable";
    _deferredPrompt.prompt();
    const { outcome } = await _deferredPrompt.userChoice;
    if (outcome === "accepted") _deferredPrompt = null;
    _listeners.forEach((l) => l());
    return outcome;
  };

  return { canInstall, showIOSHint, isStandalone, promptInstall };
}

export function InstallButton() {
  const { canInstall, showIOSHint, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || (!canInstall && !showIOSHint)) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900 text-white p-4 rounded-xl shadow-lg border border-gray-700 flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-primary-500 text-white grid place-items-center text-lg font-bold shrink-0">
        ⚡
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-bold text-white">Install FlashMaster</div>
        <div className="text-sm text-gray-300 truncate">
          {showIOSHint ? "Tap Share → Add to Home Screen" : "Get the app for offline access."}
        </div>
      </div>
      {canInstall && (
        <button
          onClick={async () => {
            const r = await promptInstall();
            if (r === "accepted") setDismissed(true);
          }}
          className="bg-primary-500 hover:bg-primary-400 text-white px-4 py-2 rounded-lg text-sm font-bold shrink-0"
        >
          Install
        </button>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="text-gray-300 hover:text-white text-2xl leading-none shrink-0 px-1"
        aria-label="Dismiss"
      >
        ×
      </button>
    </motion.div>
  );
}

export function PageHeader({
  title, onBack, right,
}: {
  title: string; onBack?: () => void; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 safe-top bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        {onBack && <IconButton onClick={onBack}>←</IconButton>}
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h1>
      </div>
      <div>{right}</div>
    </div>
  );
}

export function Speak(text: string) {
  if (!("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch {}
}
