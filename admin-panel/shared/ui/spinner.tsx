type SpinnerProps = {
  className?: string;
};

export function Spinner({ className }: SpinnerProps) {
  return (
    <span
      className={`inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-[#c8ff3d] ${className ?? ""}`}
      aria-hidden
    />
  );
}
