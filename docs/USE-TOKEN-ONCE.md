# Один раз: настроить push с токеном

## Шаг 1: Подставить токен в URL (в терминале)

Выполни **одну** из команд (подставь свой токен вместо `ВСТАВЬ_ТВОЙ_ТОКЕН`):

```bash
cd /home/produser/my-fullstack-app
git remote set-url origin https://SamSarukhanyan:ВСТАВЬ_ТВОЙ_ТОКЕН@github.com/SamSarukhanyan/my-fullstack-app.git
```

Пример: если токен `ghp_abc123`, то строка будет:
`https://SamSarukhanyan:ghp_abc123@github.com/SamSarukhanyan/my-fullstack-app.git`

## Шаг 2: Сделать push

```bash
git push origin main
```

## Шаг 3: Убрать токен из URL (безопасность)

После успешного push лучше не хранить токен в конфиге. Верни обычный URL:

```bash
git remote set-url origin https://github.com/SamSarukhanyan/my-fullstack-app.git
```

При следующих push Git спросит логин и пароль — в поле **пароль** вводи **новый** токен (см. шаг 4).

## Шаг 4: Важно — токен был в чате

Если ты где-то вставляла или отправляла этот токен (чат, скрин, сообщение):

1. Зайди на GitHub → **Settings** → **Developer settings** → **Personal access tokens**.
2. Найди этот токен и нажми **Delete** / **Revoke**.
3. Создай **новый** токен (classic, права **repo**).
4. Новый токен используй только при `git push` (логин: `SamSarukhanyan`, пароль: новый токен) или снова подставь в URL на один раз, потом убери и отзови, если нужно.

Так старый токен перестанет работать, даже если кто-то его видел.
