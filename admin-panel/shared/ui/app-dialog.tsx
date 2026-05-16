"use client";

import type { ReactNode } from "react";

type AppDialogVariant = "default" | "success" | "error" | "warning";

type AppDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  variant?: AppDialogVariant;
  children?: ReactNode;
  footer: ReactNode;
  closeOnBackdrop?: boolean;
};

const variantIconClass: Record<AppDialogVariant, string> = {
  default: "border-white/15 bg-white/6 text-zinc-200",
  success: "border-emerald-500/30 bg-emerald-500/12 text-emerald-200",
  error: "border-rose-500/30 bg-rose-500/12 text-rose-200",
  warning: "border-[#c8ff3d]/35 bg-[#c8ff3d]/12 text-[#e8ffc4]",
};

function DialogIcon({ variant }: { variant: AppDialogVariant }) {
  if (variant === "success") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M5 12.5l4.5 4.5L19 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (variant === "error") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M8 8l8 8M16 8l-8 8"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (variant === "warning") {
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
        <path
          d="M12 4v6m0 4h.01M5.5 19h13a1.5 1.5 0 001.3-2.25L13.3 5.75a1.5 1.5 0 00-2.6 0L4.2 16.75A1.5 1.5 0 005.5 19z"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.75" />
      <path d="M12 8v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      <circle cx="12" cy="16" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function AppDialog({
  open,
  onClose,
  title,
  description,
  variant = "default",
  children,
  footer,
  closeOnBackdrop = true,
}: AppDialogProps) {
  if (!open) return null;

  const handleBackdropClick = () => {
    if (closeOnBackdrop) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#08070b] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.85)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-5 pb-4">
          <div
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border ${variantIconClass[variant]}`}
          >
            <DialogIcon variant={variant} />
          </div>
          <h2
            id="app-dialog-title"
            className="font-heading text-lg font-bold tracking-tight text-zinc-50"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
          ) : null}
          {children ? <div className="mt-4">{children}</div> : null}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-white/10 bg-black/20 px-5 py-4 sm:flex-row sm:justify-end">
          {footer}
        </div>
      </div>
    </div>
  );
}
