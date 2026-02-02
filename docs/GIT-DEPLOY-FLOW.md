# Commit → Push → Deploy: один поток для всех

Чтобы деплой работал одинаково из **VSCode**, **GoLand**, с **сервера** или из любого другого места:

---

## Правило: один источник правды

- Ветка **`main`** на **GitHub** — единственный источник правды.
- Перед работой всегда: **pull**, потом меняешь код, потом **commit** и **push**.

---

## С любой машины (VSCode, GoLand, сервер)

```bash
cd /path/to/my-fullstack-app

# 1. Взять последнее с GitHub
git fetch origin
git pull origin main

# 2. Внести изменения в коде...

# 3. Закоммитить и отправить
git add .
git status   # проверить, что добавляешь то, что нужно
git commit -m "краткое описание изменений"
git push origin main
```

После **push в main** на GitHub запускается workflow **Deploy to Production**: сборка клиента, деплой на сервер, перезапуск PM2 и Nginx.

---

## Если на GitHub «сломанный» workflow или конфликты

Если на **GitHub** в `main` осталась старая версия с конфликтами или битым workflow:

### Вариант A: у тебя локально уже правильный `deploy.yml`

```bash
git fetch origin
git pull origin main --no-rebase
# Если появятся конфликты в .github/workflows/deploy.yml:
#   открой файл, удали все строки с <<<<<<<, =======, >>>>>>>
#   оставь один нужный вариант кода, сохрани
git add .github/workflows/deploy.yml
git commit -m "fix: resolve deploy workflow conflicts"
git push origin main
```

### Вариант B: сделать так, чтобы GitHub = твоя локальная версия (жёсткий reset remote)

**Делать только если уверена, что локальный `main` — правильный и полный.**

```bash
git fetch origin
git push origin main --force
```

После этого `origin/main` будет совпадать с твоим локальным `main`. Все остальные должны сделать `git pull origin main` (при конфликтах — разобрать вручную или `git pull origin main --rebase`).

---

## Проверка после push

1. GitHub → репозиторий → вкладка **Actions** → последний workflow **Deploy to Production** должен быть зелёным.
2. Сайт открывается по твоему домену/IP и отдаёт актуальную версию.

Если workflow падает — смотреть логи в Actions и на сервере (`pm2 logs`, `sudo journalctl -u nginx`).
