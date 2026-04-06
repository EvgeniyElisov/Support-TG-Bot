import { LoginForm } from "@/features/auth";

export function LoginPage() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md -translate-y-8 sm:-translate-y-12">
          <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight text-zinc-900">
            Вход в панель администратора
          </h1>
          <p className="mb-8 text-center text-sm text-zinc-600">
            Авторизуйтесь, чтобы открыть панель сообщений.
          </p>

          <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/75 p-6 shadow-xl backdrop-blur-xl">
            <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Учётные данные
            </h2>
            <LoginForm />
          </div>
        </div>
      </main>
    </div>
  );
}
