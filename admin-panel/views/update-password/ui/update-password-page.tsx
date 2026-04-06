import { UpdatePasswordForm } from "@/features/auth";

export function UpdatePasswordPage() {
  return (
    <div className="min-h-screen">
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md -translate-y-8 sm:-translate-y-12">
          <h1 className="mb-2 text-center text-3xl font-semibold tracking-tight text-zinc-900">
            Сброс пароля
          </h1>
          <p className="mb-8 text-center text-sm text-zinc-600">
            Установите новый пароль для учётной записи администратора.
          </p>

          <div className="rounded-2xl border border-zinc-700/60 bg-zinc-900/75 p-6 shadow-xl backdrop-blur-xl">
            <UpdatePasswordForm />
          </div>
        </div>
      </main>
    </div>
  );
}
