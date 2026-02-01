# Руководство по продакшен-деплою Fullstack приложения

Полная инструкция с нуля: EC2, безопасность, сервер, приложение (React Vite + Express), PM2, Nginx, GitHub Actions и автоматический деплой.

---

## Часть 1. Amazon EC2 и инфраструктура

### 1.1 Создание EC2-инстанса

1. Войдите в **AWS Console** → **EC2** → **Launch Instance**.
2. **Name:** `prod-fullstack-app` (или своё имя).
3. **AMI:** Ubuntu Server 22.04 LTS.
4. **Instance type:** `t3.small` или `t3.medium` (по нагрузке).
5. **Key pair:** создать новую пару (например `prod-key.pem`), скачать и сохранить в `~/.ssh/`.
6. **Network settings:** оставить дефолтную VPC; создание Security Group — в следующем шаге.
7. **Storage:** минимум 20 GiB gp3.
8. Запустите инстанс (**Launch instance**).

### 1.2 Security Groups

1. **EC2** → **Security Groups** → **Create security group**.
2. **Name:** `prod-fullstack-sg`.
3. **Inbound rules:**

| Type   | Port | Source      | Описание        |
|--------|------|-------------|-----------------|
| SSH    | 22   | 0.0.0.0/0   | SSH откуда угодно |
| HTTP   | 80   | 0.0.0.0/0   | HTTP откуда угодно |
| Custom | 3000 | 127.0.0.1   | (опционально) Express только с localhost |

4. **Outbound:** оставить All traffic.
5. Сохраните группу и привяжите её к инстансу: **EC2** → **Instances** → выберите инстанс → **Actions** → **Security** → **Change security groups** → выберите `prod-fullstack-sg`.

### 1.3 Elastic IP

1. **EC2** → **Elastic IPs** → **Allocate Elastic IP address** → **Allocate**.
2. Выберите новый IP → **Actions** → **Associate Elastic IP address**.
3. Выберите ваш инстанс и приватный IP инстанса → **Associate**.
4. Запомните **Elastic IP** — он будет использоваться для SSH и доступа к приложению.

---

## Часть 2. Первичная настройка сервера

### 2.1 Подключение по SSH (первый раз)

```bash
chmod 600 ~/.ssh/prod-key.pem
ssh -i ~/.ssh/prod-key.pem ubuntu@<ELASTIC_IP>
```

### 2.2 Обновление системы и базовые пакеты

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

### 2.3 Установка Node.js (LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # v20.x
npm -v
```

### 2.4 Установка Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 2.5 Установка PM2 глобально

```bash
sudo npm install -g pm2
pm2 startup   # выполните выведенную команду от root (sudo env PATH=...)
```

### 2.6 Создание пользователя `sam` с привилегиями

```bash
sudo adduser sam
sudo usermod -aG sudo sam
sudo usermod -aG www-data sam

# Копирование SSH-ключей от ubuntu к sam (чтобы sam мог логиниться по ключу)
sudo mkdir -p /home/sam/.ssh
sudo cp /home/ubuntu/.ssh/authorized_keys /home/sam/.ssh/
sudo chown -R sam:sam /home/sam/.ssh
sudo chmod 700 /home/sam/.ssh
sudo chmod 600 /home/sam/.ssh/authorized_keys
```

Дальнейшую работу на сервере можно вести под пользователем `sam` (после настройки локального SSH config — см. ниже).

---

## Часть 3. Локальный SSH config

На **вашей локальной машине** отредактируйте `~/.ssh/config`:

```bash
# Продакшен Fullstack App — EC2
Host prod-fullstack
    HostName <ВАШ_ELASTIC_IP>
    User sam
    IdentityFile ~/.ssh/prod-key.pem
    IdentitiesOnly yes
```

Подстановка: замените `<ВАШ_ELASTIC_IP>` на ваш Elastic IP.

Подключение одной командой:

```bash
ssh prod-fullstack
```

---

## Часть 4. Структура приложения на сервере

### 4.1 Каталоги (под пользователем `sam`)

Рекомендуемая структура:

```
/home/sam/
├── app/                    # репозиторий приложения (git clone)
│   ├── client/             # React Vite (без TypeScript)
│   ├── server/             # Express (type: "module")
│   └── ecosystem.config.cjs
├── app/client/dist         # билд фронтенда (деплоится сюда)
```

### 4.2 Клонирование репозитория

```bash
ssh prod-fullstack
cd /home/sam
git clone https://github.com/<ВАШ_ORG>/<ВАШ_РЕПО>.git app
cd app
```

---

## Часть 5. Backend (Express, type: module)

### 5.1 Пример package.json сервера

В `server/package.json`:

```json
{
  "name": "server",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}
```

Сервер должен слушать порт из переменной окружения, например `process.env.PORT || 3000`, и отдавать статику из `../client/dist` при необходимости (или Nginx отдаёт статику).

### 5.2 Порт и раздача статики (server/index.js или точка входа)

```javascript
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = Number(process.env.PORT) || 3000;

// API-маршруты подключаются до статики
// app.use('/api', apiRouter);

// Опционально: раздача статики из client/dist (если не отдаётся через Nginx)
const clientDist = path.resolve(__dirname, '../client/dist');
app.use(express.static(clientDist));

// SPA fallback: для клиентского роутинга отдаём index.html на неизвестные пути
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
```

Если статику отдаёт Nginx, закомментируйте блок с `express.static` и fallback `app.get('*', ...)` и настраивайте Nginx на `client/dist`.

---

## Часть 6. Frontend (React Vite, без TypeScript)

### 6.1 Создание (локально, если ещё не создан)

```bash
npm create vite@latest client -- --template react
# Выбрать React, без TypeScript (JavaScript).
cd client && npm install
```

### 6.2 Сборка для продакшена

В деплое используется:

```bash
cd client
npm run build
```

Артефакты попадают в `client/dist`. Этот каталог будет разворачиваться на сервере и отдаваться через Nginx.

---

## Часть 7. PM2 — конфигурация продакшен

В корне репозитория создайте `ecosystem.config.cjs` (CommonJS для совместимости с PM2):

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'api',
      cwd: './server',
      script: 'index.js',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      error_file: '/home/sam/logs/api-err.log',
      out_file: '/home/sam/logs/api-out.log',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
    },
  ],
};
```

Создайте каталог для логов:

```bash
mkdir -p /home/sam/logs
```

Запуск под пользователем `sam`:

```bash
cd /home/sam/app
pm2 start ecosystem.config.cjs --env production
pm2 save
```

---

## Часть 8. Nginx — конфигурация

### 8.1 Продакшен-конфиг (custom)

Создайте отдельный конфиг вместо правки `default`. Команду выполняйте под своим пользователем с sudo (например `sam` или `ubuntu`); `sudo` запросит пароль и откроет файл с правами root.

```bash
sudo nano /etc/nginx/sites-available/app
```

Вставьте (подставьте свой домен или IP). **Важно:** порт в `proxy_pass` (ниже — `4004`) должен совпадать с секретом **PORT** в GitHub Environment, иначе Nginx будет слать запросы не на тот порт, на котором слушает приложение.

```nginx
server {
    listen 80;
    listen [::]:80;

    root /home/sam/app/client/dist;
    index index.html;

    server_name _;  # или ваш домен / Elastic IP

    # SPA: все маршруты — на index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API — проксирование на Express (порт должен совпадать с PORT из Environment secrets)
    location /api {
        proxy_pass http://127.0.0.1:4004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Статика приложения
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Включите сайт и при необходимости отключите default:

```bash
sudo ln -sf /etc/nginx/sites-available/app /etc/nginx/sites-enabled/
# если default больше не нужен:
# sudo rm /etc/nginx/sites-enabled/default
```

### 8.2 Права и перезапуск

```bash
sudo chown -R sam:www-data /home/sam/app/client/dist
sudo nginx -t
sudo systemctl reload nginx
```

При обновлении билда достаточно снова выставить права (если нужно) и сделать `sudo systemctl reload nginx`.

---

## Часть 9. Продакшен: self-hosted runner (один вариант)

Используется **только self-hosted runner на EC2**: workflow выполняется прямо на сервере, без SSH и без секретов для деплоя.

### 9.1 Создание runner на EC2

1. **GitHub** → репозиторий → **Settings** → **Actions** → **Runners** → **New self-hosted runner**.
2. Выберите ОС (Linux) и архитектуру (x64).
3. На сервере под пользователем, от которого будет крутиться runner (например `sam`):

```bash
ssh prod-fullstack
cd /home/sam
mkdir -p actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz
```

4. Конфигурация (токен и URL из GitHub):

```bash
./config.sh --url https://github.com/<ORG>/<REPO> --token <TOKEN>
```

5. Установка и запуск сервиса:

```bash
./svc.sh install
./svc.sh start
sudo ./svc.sh status
```

Актуальную версию runner скачивайте с [releases](https://github.com/actions/runner/releases).

### 9.2 Секреты в GitHub

В нашем варианте (self-hosted runner на EC2) **Environment secrets** нужны для переменных **приложения** (`PORT`, `NODE_ENV`, `API_KEY` и т.д.): workflow при каждом деплое записывает их в `/home/sam/app/server/.env`. Создайте Environment **production** и добавьте в него эти секреты (см. раздел 9.3).

- Секреты для **приложения** (`API_KEY`, `DATABASE_URL` и т.д.) можно хранить на сервере вручную в `.env`, либо задать в GitHub Environment — тогда workflow при каждом деплое запишет их в `.env` на сервере (см. ниже).
- Если при сборке клиента нужны переменные (например `VITE_API_URL`), тогда добавьте их в **Settings** → **Secrets and variables** → **Actions** и используйте в workflow в шаге Build.

### 9.3 Где и как создать переменные (Environment + Secrets)

Если вы хотите хранить переменные приложения (`PORT`, `NODE_ENV`, `API_KEY` и т.д.) в GitHub и чтобы при деплое они подставлялись в `.env` на сервере — делайте так.

#### Шаг 1: Создать Environment в репозитории

1. Откройте ваш репозиторий на **GitHub**.
2. Вверху: **Settings** (Настройки).
3. Слева в меню: **Environments** (Окружения).
4. Нажмите **New environment**.
5. Введите имя, например: **production** (оно потом используется в `deploy.yml` как `environment: production`).
6. Нажмите **Configure environment**.

#### Шаг 2: Добавить секреты в этот Environment

1. На странице Environment **production** найдите блок **Environment secrets**.
2. Нажмите **Add secret**.
3. Для каждого секрета:
   - **Name** — имя переменной (латиницей, без пробелов). Например: `PORT`, `NODE_ENV`, `API_KEY`.
   - **Secret** — значение (например `4004`, `production`, ваш ключ API). GitHub не покажет его потом в логах.
4. Сохраните (Add secret). Повторите для `PORT`, `NODE_ENV`, `API_KEY` (и других, если нужны).

Имена в GitHub должны совпадать с тем, что в workflow: `secrets.PORT`, `secrets.NODE_ENV`, `secrets.API_KEY`.

#### Шаг 3: Как это связано с деплоем

- В **deploy.yml** в job указано `environment: production`. Так GitHub «включает» окружение **production** и даёт workflow доступ к его секретам.
- В шаге **«Write server .env from environment secrets»** эти секреты записываются в файл `/home/sam/app/server/.env` на сервере.
- Сервер (Node.js) при старте читает `.env` через `dotenv` и получает `PORT`, `NODE_ENV`, `API_KEY`.

Схема:

```
GitHub: Environments → production → Environment secrets (PORT, NODE_ENV, API_KEY)
                    ↓
        deploy.yml: environment: production
                    ↓
        Шаг в workflow записывает их в /home/sam/app/server/.env
                    ↓
        PM2 перезапускает приложение → приложение читает .env
```

Итого: переменные вы **создаёте** в GitHub (Settings → Environments → нужный Environment → Environment secrets), а **используются** они в `deploy.yml` через `${{ secrets.ИМЯ }}`.

---

## Часть 10. Автоматический деплой при push (GitHub Actions)

При push в `main`: обновление кода на сервере, сборка клиента, копирование `dist`, запись переменных из **GitHub Environment secrets** в `.env` на сервере, установка зависимостей сервера, перезапуск PM2, перезагрузка Nginx.

Используется **один вариант**: self-hosted runner на EC2 + **GitHub Environments и Environment secrets** (см. раздел 9.3).

### 10.1 Workflow (окончательный вариант)

Создайте в репозитории `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: self-hosted   # runner на EC2
    environment: production   # имя environment в GitHub (Settings → Environments) — оттуда подтягиваются secrets

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install client deps
        run: npm ci
        working-directory: ./client

      - name: Build client
        run: npm run build
        working-directory: ./client

      - name: Update app and deploy client
        run: |
          cd /home/sam/app
          git pull
          rm -rf client/dist
          cp -r $GITHUB_WORKSPACE/client/dist client/dist
          chown -R sam:www-data client/dist

      - name: Install server deps
        run: npm ci --omit=dev
        working-directory: /home/sam/app/server

      - name: Write server .env from environment secrets
        run: |
          printf 'PORT=%s\nNODE_ENV=%s\nAPI_KEY=%s\n' \
            "${{ secrets.PORT }}" \
            "${{ secrets.NODE_ENV }}" \
            "${{ secrets.API_KEY }}" \
            > /home/sam/app/server/.env
          chown sam:www-data /home/sam/app/server/.env
          chmod 600 /home/sam/app/server/.env

      - name: Restart PM2
        run: |
          cd /home/sam/app
          pm2 restart ecosystem.config.cjs --env production
          pm2 save

      - name: Reload Nginx
        run: sudo systemctl reload nginx
```

В Environment **production** в GitHub (Settings → Environments → production → Environment secrets) должны быть заданы секреты: **PORT**, **NODE_ENV**, **API_KEY**. При необходимости добавьте туда же другие переменные (например `DATABASE_URL`) и продублируйте их в шаге «Write server .env from environment secrets».

Предполагается, что `/home/sam/app` — это клон вашего репозитория (`git clone ...`), чтобы `git pull` обновлял backend.

Чтобы runner выполнял `sudo systemctl reload nginx` без ввода пароля, на сервере:

```bash
sudo visudo
# Добавить строку (подставьте пользователя, под которым запущен runner, например sam):
sam ALL=(ALL) NOPASSWD: /usr/bin/systemctl reload nginx
```

---

## Часть 11. Чеклист перед продакшеном

- [ ] Elastic IP привязан к инстансу.
- [ ] Security group: 22 (SSH), 80 (HTTP).
- [ ] Пользователь `sam` создан, в группах `sudo` и `www-data`.
- [ ] Локальный `~/.ssh/config` с хостом `prod-fullstack` и ключом.
- [ ] Node.js 20, Nginx, PM2 установлены.
- [ ] Репозиторий склонирован в `/home/sam/app`.
- [ ] `ecosystem.config.cjs` настроен, PM2 запущен и сохранён (`pm2 save`).
- [ ] Nginx настроен: root = `client/dist`, `/api` → proxy на 3000.
- [ ] Self-hosted runner установлен и зарегистрирован.
- [ ] В репозитории есть `.github/workflows/deploy.yml` (окончательный вариант с Environment + secrets).
- [ ] В GitHub создан Environment **production** и в нём заданы Environment secrets: **PORT**, **NODE_ENV**, **API_KEY** (и другие при необходимости).

---

## Краткие команды для ручного деплоя

```bash
# На сервере (или по SSH)
cd /home/sam/app
git pull
cd client && npm ci && npm run build && cd ..
rm -rf /home/sam/app/client/dist && cp -r client/dist /home/sam/app/client/dist
pm2 restart ecosystem.config.cjs --env production
pm2 save
sudo systemctl reload nginx
```

После выполнения всех шагов у вас будет полноценный продакшен-сетап с автоматическим деплоем React (Vite) + Express на EC2 с фиксированным Elastic IP, Nginx и PM2, с возможностью входа по `ssh prod-fullstack` под пользователем `sam`.
