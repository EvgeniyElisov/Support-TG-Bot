import { UpdatePasswordForm } from "@/features/auth";

export function UpdatePasswordPage() {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-linear-to-br from-[#0c1208] via-[#08070b] to-[#0a0e14] px-8 py-12 lg:max-w-[46%] lg:px-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8ff3d' fill-opacity='0.06'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
          aria-hidden
        />
        <div className="relative">
          <p className="text-[11px] font-bold uppercase tracking-[0.4em] text-[#c8ff3d]/70">Безопасность</p>
          <h1 className="font-heading mt-4 max-w-sm text-3xl font-bold leading-tight text-zinc-50">
            Новый пароль
          </h1>
          <p className="mt-4 max-w-sm text-sm text-zinc-500">
            После сохранения войдите в панель с обновлёнными данными.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-white/9 bg-white/4 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_32px_90px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl">
            <UpdatePasswordForm />
          </div>
        </div>
      </div>
    </div>
  );
}
