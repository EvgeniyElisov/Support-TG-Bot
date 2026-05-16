import { Spinner } from "./spinner";

type ButtonLoadingLabelProps = {
  isLoading: boolean;
  loadingText: string;
  children: string;
};

export function ButtonLoadingLabel({ isLoading, loadingText, children }: ButtonLoadingLabelProps) {
  if (!isLoading) return children;

  return (
    <span className="inline-flex items-center justify-center gap-2">
      <Spinner />
      {loadingText}
    </span>
  );
}
