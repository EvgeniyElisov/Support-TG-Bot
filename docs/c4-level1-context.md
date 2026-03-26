# C4 — уровень 1: контекст системы (System Context)

Показывает систему в окружении: пользователи, внешние сервисы.

Формат: [Mermaid C4](https://mermaid.js.org/syntax/c4.html). Рендер: GitHub, GitLab, VS Code (Mermaid).

```mermaid
C4Context
title Уровень 1 — контекст: Support TG Bot

Person(user, "Пользователь Telegram", "Пишет в чат поддержки боту")
System_Ext(telegram, "Telegram Bot API", "Доставка апдейтов вебхуком, отправка ответов в чат")
System(support, "Support TG Bot", "Приём сообщений, сохранение в БД, эхо-ответ с цитированием")
System_Ext(supabase, "Supabase", "Хостинг Edge Functions, PostgreSQL, секреты")

Rel(user, telegram, "Сообщения в чате", "Telegram Client")
Rel(telegram, support, "HTTPS POST Update (webhook)", "JSON")
Rel(support, telegram, "sendMessage и др.", "HTTPS Bot API")
Rel(support, supabase, "Edge Function + service role к БД", "HTTPS")
```
