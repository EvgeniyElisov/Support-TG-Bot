import { Spinner } from "./spinner";

type LoadingBannerProps = {
  title: string;
  description?: string;
};

export function LoadingBanner({ title, description }: LoadingBannerProps) {
  return (
    <div
      role="status"
      className="mb-4 flex items-start gap-3 rounded-2xl border border-[#c8ff3d]/25 bg-[#c8ff3d]/8 px-4 py-3.5"
    >
      <Spinner className="mt-0.5 h-5 w-5" />
      <div>
        <p className="text-sm font-semibold text-[#e8ffc4]">{title}</p>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
