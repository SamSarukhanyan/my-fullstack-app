# Восстановление push и деплоя

## Что произошло

1. **Push не прошёл** — в логе: `Authentication failed`, `Password authentication is not supported`. GitHub больше не принимает пароль от аккаунта для `git push` по HTTPS. Нужен **Personal Access Token (PAT)** или **SSH**.

2. **Локально всё ок** — в `deploy.yml` и `ecosystem.config.cjs` нет конфликтов и лишнего текста. После настройки доступа к GitHub нужно один раз закоммитить все правки и сделать push.

---

## Шаг 1: Настроить доступ к GitHub (один раз)

### Вариант A: Personal Access Token (HTTPS)

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
2. **Generate new token (classic)**. Название: например `my-fullstack-app`. Права: отметь **repo** (полный доступ к репозиториям).
3. Скопируй токен (один раз показывается).

В терминале (подставь свой логин и токен):

```bash
cd /home/produser/my-fullstack-app
git remote set-url origin https://YOUR_GITHUB_USERNAME:YOUR_TOKEN@github.com/SamSarukhanyan/my-fullstack-app.git
```

Либо при следующем `git push` Git запросит логин и пароль — **пароль** вводи **токен**, не пароль от аккаунта.

### Вариант B: SSH

1. Создать ключ (если ещё нет): `ssh-keygen -t ed25519 -C "sarukhanyansam@gmail.com"` (Enter без пароля или с паролем).
2. Скопировать публичный ключ: `cat ~/.ssh/id_ed25519.pub`.
3. GitHub → **Settings** → **SSH and GPG keys** → **New SSH key** → вставить ключ.
4. Переключить remote на SSH:

```bash
cd /home/produser/my-fullstack-app
git remote set-url origin git@github.com:SamSarukhanyan/my-fullstack-app.git
```

---

## Шаг 2: Закоммитить все правки и отправить на GitHub

Выполни по порядку (из корня репозитория):

```bash
cd /home/produser/my-fullstack-app

# 1. Посмотреть, что изменилось
git status

# 2. Добавить все исправления (workflow, ecosystem, gitattributes, docs)
git add .github/workflows/deploy.yml ecosystem.config.cjs .gitattributes docs/

# 3. Один коммит со всеми правками деплоя и документацией
git commit -m "fix: deploy workflow (no conflicts), ecosystem without dotenv, gitattributes, docs"

# 4. Отправить на GitHub (после настройки доступа из Шага 1)
git push origin main
```

После успешного push на GitHub запустится **Deploy to Production** (Actions).

---

## Шаг 3: Если на GitHub всё ещё старая версия с конфликтами

Если `origin/main` когда-то был в плохом состоянии и ты хочешь, чтобы на GitHub была **только** твоя текущая ветка:

```bash
git push origin main --force
```

Использовать только если уверена, что локальный `main` — правильный. После этого все должны сделать `git fetch origin && git reset --hard origin/main` (или новый клон).

---

## Проверка после push

1. **GitHub → Actions** — последний workflow **Deploy to Production** должен завершиться успешно (зелёная галочка).
2. Сайт открывается по твоему домену/IP и отдаёт актуальную версию.

---

## Кратко: что сейчас в репозитории

- **deploy.yml** — без конфликтов, с шагами: ecosystem в app root, .env из secrets, PM2 logs dir, PM2 с `env.PORT`/`NODE_ENV`, Nginx reload.
- **ecosystem.config.cjs** — без `dotenv`, PORT/NODE_ENV приходят из окружения при `pm2 reload`.
- **.gitattributes** — единые переносы строк (меньше конфликтов при работе из разных мест).
- **docs/** — описание потока Git/deploy и этот файл с восстановлением push.

Ошибка «Password authentication is not supported» решается только настройкой PAT или SSH (Шаг 1).
