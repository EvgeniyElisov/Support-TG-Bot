type HeaderProps = {
  title: string;
  subtitle: string;
};

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight text-zinc-900">{title}</h1>
      <p className="mb-3 text-sm text-zinc-600">{subtitle}</p>
    </>
  );
}
