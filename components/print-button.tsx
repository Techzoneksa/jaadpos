"use client";

import { Printer } from "lucide-react";

type PrintButtonProps = {
  label?: string;
  className?: string;
};

export function PrintButton({ label = "طباعة", className = "" }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={`inline-flex items-center justify-center gap-2 rounded-lg border border-ink/10 bg-white px-3 py-2 text-sm font-bold ${className}`}
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
