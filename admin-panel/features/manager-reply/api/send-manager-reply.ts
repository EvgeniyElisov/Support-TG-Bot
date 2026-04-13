"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseServerClient } from "@/shared/api/supabase/server";

const TELEGRAM_API = "https://api.telegram.org";

export type SendManagerReplyState = { error: string } | { ok: true } | null;

function buildTelegramBody(params: {
  managerFirst: string;
  managerLast: string;
  companyRole: string;
  replyText: string;
}): string {
  const name = [params.managerFirst, params.managerLast].filter(Boolean).join(" ").trim();
  const header = `Менеджер ${name || "поддержки"} (${params.companyRole}) ответил вам:\n\n`;
  return `${header}${params.replyText}`;
}

export async function sendManagerReplyAction(
  _prev: SendManagerReplyState,
  formData: FormData,
): Promise<SendManagerReplyState> {
  const clientIdRaw = formData.get("client_id");
  const textRaw = formData.get("reply_text");

  if (typeof clientIdRaw !== "string" || clientIdRaw.length === 0) {
    return { error: "Некорректный диалог" };
  }

  if (typeof textRaw !== "string") {
    return { error: "Введите текст ответа" };
  }

  const replyText = textRaw.trim();
  if (replyText.length === 0) {
    return { error: "Введите текст ответа" };
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return { error: "Сервер: не задан TELEGRAM_BOT_TOKEN" };
  }

  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Требуется вход" };
  }

  const { data: manager, error: mgrError } = await supabase
    .from("managers")
    .select("first_name, last_name, company_role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (mgrError || !manager) {
    return { error: "Профиль менеджера не найден" };
  }

  const { data: assignment, error: assignError } = await supabase
    .from("client_assignments")
    .select("current_manager_id")
    .eq("client_id", clientIdRaw)
    .maybeSingle();

  if (assignError) {
    return { error: assignError.message };
  }

  if (!assignment?.current_manager_id || assignment.current_manager_id !== user.id) {
    return { error: "Отвечать может только назначенный на этот диалог менеджер" };
  }

  const { data: clientRow, error: clientError } = await supabase
    .from("clients")
    .select("chat_id")
    .eq("id", clientIdRaw)
    .single();

  if (clientError || !clientRow) {
    return { error: "Клиент не найден" };
  }

  const telegramText = buildTelegramBody({
    managerFirst: manager.first_name,
    managerLast: manager.last_name,
    companyRole: manager.company_role,
    replyText,
  });

  if (telegramText.length > 4096) {
    return { error: "Сообщение слишком длинное для Telegram (макс. 4096 символов)" };
  }

  const tgRes = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: clientRow.chat_id,
      text: telegramText,
    }),
  });

  const tgJson = (await tgRes.json()) as { ok?: boolean; description?: string };

  if (!tgRes.ok || !tgJson.ok) {
    return {
      error: tgJson.description ?? `Telegram: ${tgRes.status}`,
    };
  }

  const { error: rpcError } = await supabase.rpc("insert_manager_reply", {
    p_client_id: clientIdRaw,
    p_text: replyText,
  });

  if (rpcError) {
    return { error: rpcError.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
