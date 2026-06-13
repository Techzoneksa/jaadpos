type UnavailableActionProps = {
  label: string;
  message?: string;
  className?: string;
};

export function UnavailableAction({ label, message = "هذه الميزة غير متاحة في هذه المرحلة.", className = "" }: UnavailableActionProps) {
  return (
    <div className={className}>
      <button type="button" disabled className="cursor-not-allowed rounded-lg bg-ink/30 px-4 py-2 text-sm font-black text-white">
        {label}
      </button>
      <p className="mt-2 text-xs font-bold text-date">{message}</p>
    </div>
  );
}
