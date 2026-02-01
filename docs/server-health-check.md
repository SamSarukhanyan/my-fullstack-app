# Проверка «API is not healthy» на сервере

Чеклист команд для запуска **на сервере** (под пользователем `sam` или с `sudo` где указано). Проект ожидает: приложение в `/home/sam/app`, Express на порту **4004**, маршрут **/api/health**.

---

## 1. Приложение (Node/PM2) слушает порт 4004

```bash
# PM2: процесс должен быть online
pm2 status

# Должен слушать 4004 (или порт из .env)
sudo ss -tlnp | grep 4004
# или
sudo lsof -i :4004
```

Если порта 4004 нет — приложение не запущено или слушает другой порт (см. п. 2).

---

## 2. Переменные окружения (PORT)

Приложение берёт порт из `process.env.PORT` (файлы `.env` или Environment secrets при деплое).

```bash
# Файл, который читает сервер при старте (из /home/sam/app/server)
cat /home/sam/app/server/.env
# Ожидается строка: PORT=4004

# Файл для ecosystem (если есть) — в корне приложения
cat /home/sam/app/.env.production
# Ожидается: PORT=4004
```

Если в `.env` указан другой порт (например 3000), то и Nginx должен проксировать на этот порт (см. п. 4).

---

## 3. Прямой запрос к приложению (минуя Nginx)

Проверка, что Express сам отдаёт `/api/health`:

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:4004/api/health
# Ожидается: 200

curl http://127.0.0.1:4004/api/health
# Ожидается: {"status":"OK","message":"Server is running"}
```

- Если **connection refused** — приложение не слушает 4004 (п. 1, 2).
- Если **404** и в ответе `Cannot GET /api/health` — **на сервере запущена старая версия кода** без маршрута `/api/health`. Нужно обновить код и перезапустить PM2 (см. ниже «Если curl на 4004 даёт 404»).
- Если **200** — бэкенд в порядке, проблема в Nginx или фронте.

**Если curl на 127.0.0.1:4004/api/health даёт 404** — на сервере старый `server/index.js`. Выполните на сервере:

```bash
cd /home/sam/app
git fetch && git status   # убедиться, что репо подключён
git pull origin main     # подставить свою ветку при необходимости
pm2 restart ecosystem.config.cjs --env production
pm2 save
```

Проверьте, что в файле есть маршрут: `grep -n "api/health" /home/sam/app/server/index.js` — должна быть строка с `app.get('/api/health', ...)`.

---

## 4. Nginx: порт и путь

Порт в `proxy_pass` должен совпадать с тем, на котором реально слушает приложение (п. 1–2).

```bash
cat /etc/nginx/sites-available/app
```

Проверить:

- `proxy_pass http://127.0.0.1:4004;` — **без** слэша в конце (иначе Nginx режет `/api`, и приходит `/health` вместо `/api/health`).
- Порт (`4004`) совпадает с `PORT` в `/home/sam/app/server/.env`.

Включён ли сайт:

```bash
ls -la /etc/nginx/sites-enabled/
# Должна быть ссылка на app (например app -> ../sites-available/app)
```

Проверка конфига и перезагрузка:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 5. Запрос через Nginx (как браузер)

С сервера имитируем запрос браузера к `/api/health`:

```bash
curl -s -o /dev/null -w "%{http_code}" -H "Host: 54.164.243.18" http://127.0.0.1/api/health
# Ожидается: 200

curl -H "Host: 54.164.243.18" http://127.0.0.1/api/health
# Ожидается: {"status":"OK","message":"Server is running"}
```

Если здесь 404 или 502 — ошибка в Nginx (порт, слэш в `proxy_pass`, или приложение не слушает).

---

## 6. Логи

```bash
# Ошибки Nginx
sudo tail -20 /var/log/nginx/error.log

# Доступ Nginx (какие URL приходят)
sudo tail -20 /var/log/nginx/access.log

# Логи приложения (PM2)
pm2 logs api --lines 30
# или
tail -30 /home/sam/logs/api-err.log
tail -30 /home/sam/logs/api-out.log
```

По ним видно: доходит ли запрос до Nginx, доходит ли до приложения, какие пути и коды ответа.

---

## 7. Фронтенд (статический билд)

Фронт ходит на `/api/health` (относительный URL). Значит запрос идёт на тот же хост, с которого отдаётся SPA — Nginx должен обрабатывать и `/`, и `/api`.

```bash
# Есть ли собранный клиент
ls -la /home/sam/app/client/dist/
# Должны быть index.html и папка assets
```

Если `client/dist` пустой или нет `index.html` — сначала нужен билд и деплой клиента.

---

## 8. Краткая последовательность

| Шаг | Команда | Ожидание |
|-----|---------|----------|
| 1 | `pm2 status` | `api` в статусе online |
| 2 | `sudo ss -tlnp \| grep 4004` | процесс слушает 4004 |
| 3 | `cat /home/sam/app/server/.env` | есть `PORT=4004` (или ваш порт) |
| 4 | `curl http://127.0.0.1:4004/api/health` | 200 и JSON с `"status":"OK"` |
| 5 | В Nginx: `proxy_pass http://127.0.0.1:4004;` без `/` в конце | — |
| 6 | `curl -H "Host: 54.164.243.18" http://127.0.0.1/api/health` | 200 и тот же JSON |

Если п. 4 даёт 200, а п. 6 — нет, ошибка в Nginx (конфиг или перезагрузка). Если п. 4 не 200 — ошибка в приложении или порте (PM2, .env, перезапуск).

---

## 9. Перезапуск после изменений

После правок `.env` или конфига Nginx:

```bash
# Перечитать .env и перезапустить приложение
cd /home/sam/app
pm2 restart ecosystem.config.cjs --env production
pm2 save

# Перезагрузить Nginx
sudo nginx -t && sudo systemctl reload nginx
```

После этого снова проверить п. 3 и п. 5.
