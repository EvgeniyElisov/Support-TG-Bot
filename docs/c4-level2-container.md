# C4 — уровень 2: контейнеры (Container)

Показывает основные приложения и хранилища внутри границы системы и их технологии.

Формат: [Mermaid C4](https://mermaid.js.org/syntax/c4.html).

```mermaid
C4Container
title Уровень 2 — контейнеры: Support TG Bot

Person(user, "Пользователь Telegram", "Клиент Telegram")

System_Boundary(support, "Support TG Bot") {
  Container(webhook, "tg-webhook", "Deno / Supabase Edge Function", "Вебхук grammY: приём Update, бизнес-логика, ответ в чат")
  ContainerDb(db, "PostgreSQL", "Supabase", "Таблица public.messages, RLS (чтение для клиентов)")
  Container(admin, "admin-panel", "Next.js", "Веб-интерфейс (заготовка; чтение сообщений через anon при настройке)")
}

System_Ext(telegram, "Telegram Bot API", "Внешняя система")
System_Ext(supabase_host, "Supabase Platform", "Роутинг /functions/v1, секреты TELEGRAM_BOT_TOKEN")

Rel(user, telegram, "Чат с ботом")
Rel(telegram, webhook, "POST /functions/v1/tg-webhook", "Update JSON")
Rel(webhook, telegram, "Bot API")
Rel(webhook, db, "upsert messages", "supabase-js, service_role")
Rel(admin, db, "select messages", "Supabase client, anon (политика RLS)")
Rel(webhook, supabase_host, "Развёртывание и env")
```

**Замечание:** **admin-panel** в репозитории — заготовка Next.js; на диаграмме отражена как планируемый потребитель read-only доступа к БД.
