"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, RotateCw, Shield, X } from "lucide-react";

/** Image with graceful fallback. External logos come from several CDNs, so we use a plain <img>. */
export function SafeImg({ src, alt, className, fallback }: { src: string | null | undefined; alt: string; className?: string; fallback: ReactNode }) {
  const [failed, setFailed] = useState<string | null>(null);
  if (!src || failed === src) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} loading="lazy" decoding="async" onError={() => setFailed(src)} />
  );
}

export function TeamLogo({ src, name, className = "h-8 w-8" }: { src?: string | null; name: string; className?: string }) {
  return (
    <SafeImg
      src={src}
      alt={name}
      className={`${className} shrink-0 object-contain`}
      fallback={
        <span className={`${className} inline-flex shrink-0 items-center justify-center text-slate-500`} title={name}>
          <Shield className="h-full w-full" strokeWidth={1.5} />
        </span>
      }
    />
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`ch-skeleton rounded-md ${className}`} aria-hidden />;
}

/** Empty, info and error states: quiet, left-aligned, with a clear next step. */
export function StateMessage({
  icon,
  title,
  message,
  onRetry,
  action,
  tone = "neutral",
}: {
  icon?: ReactNode;
  title: string;
  message?: string;
  onRetry?: () => void;
  action?: ReactNode;
  tone?: "neutral" | "error";
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className={`flex h-10 w-10 items-center justify-center rounded-md ${tone === "error" ? "bg-red-500/10 text-red-400" : "bg-white/[0.04] text-slate-400"}`}>
        {icon ?? <AlertTriangle className="h-5 w-5" />}
      </span>
      <div>
        <p className="font-semibold text-slate-100">{title}</p>
        {message && <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">{message}</p>}
      </div>
      {onRetry && (
        <button onClick={onRetry} className="mt-1 inline-flex h-9 items-center gap-2 rounded-md bg-slate-100 px-4 text-sm font-semibold text-slate-950 transition hover:bg-white">
          <RotateCw className="h-4 w-4" /> Try again
        </button>
      )}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return <StateMessage tone="error" title="Couldn't load this right now" message={error} onRetry={onRetry} />;
}

/**
 * Historical name kept for compatibility. Football Hub no longer tilts every card on hover —
 * each section has its own interaction — so this is now a plain container.
 */
export function TiltCard({ children, className = "" }: { children: ReactNode; className?: string; max?: number }) {
  return <div className={className}>{children}</div>;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    const opener = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onClose();
      if (e.key !== "Tab" || !panel.current) return;
      // Keep keyboard focus inside the dialog while it is open.
      const focusable = [...panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(
        (el) => el.offsetParent !== null,
      );
      if (!focusable.length) return e.preventDefault();
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === panel.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !panel.current.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
      // Return focus to whatever opened the dialog.
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  // Portal to <body> so animated (transformed) ancestors cannot trap the fixed overlay.
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <div className="ch-fade absolute inset-0 bg-black/70" onClick={onClose} />
      <div
        ref={panel}
        tabIndex={-1}
        className={`ch-pop relative max-h-[92vh] w-full ${wide ? "max-w-5xl" : "max-w-3xl"} overflow-y-auto rounded-t-xl border border-line-strong bg-panel shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] outline-none sm:rounded-xl`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-panel/95 px-5 py-3.5 backdrop-blur">
          <h3 className="truncate font-display text-lg font-semibold uppercase tracking-wide text-slate-200">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-slate-400 transition hover:bg-white/[0.06] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 sm:p-7">{children}</div>
      </div>
    </div>,
    document.body,
  );
}

/** Section heading: condensed title, optional subtitle, a hairline to the edge and an optional action. */
export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="min-w-0">
        <h3 className="font-display text-2xl font-bold uppercase tracking-wide text-white">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Underlined tab switch — the shared control for two- or three-way views. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="inline-flex gap-6 border-b border-line" role="tablist">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={`relative -mb-px pb-2.5 pt-1 text-sm font-semibold transition-colors ${on ? "text-white" : "text-slate-400 hover:text-slate-200"}`}
          >
            {o.label}
            <span className={`absolute inset-x-0 -bottom-px h-0.5 origin-left bg-volt transition-transform duration-300 ${on ? "scale-x-100" : "scale-x-0"}`} />
          </button>
        );
      })}
    </div>
  );
}

/** The standard surface: graphite panel, hairline edge, modest corner. */
export const card = "rounded-lg border border-line bg-panel";
