"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import toast from "react-hot-toast";

/**
 * После redirect с `?login=success` показываем toast и убираем query из URL.
 */
export function LoginSuccessToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    if (searchParams.get("login") !== "success") return;

    done.current = true;
    toast.success("Вход выполнен", { id: "login-success" });
    router.replace("/dashboard", { scroll: false });
  }, [searchParams, router]);

  return null;
}
