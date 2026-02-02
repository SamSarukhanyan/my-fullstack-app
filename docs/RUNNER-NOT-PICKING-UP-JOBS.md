# «Waiting for a runner to pick up this job» — что делать

Если в **GitHub Actions** workflow **Deploy to Production** запустился, но job зависает на **«Waiting for a runner to pick up this job»**, значит **self-hosted runner на сервере не подхватывает задачи**.

Workflow и Commit & Sync тут ни при чём — push прошёл, workflow стартовал. Проблема только в том, что **runner на EC2 не работает или не подключён**.

---

## 1. Проверить runner в GitHub

1. **GitHub** → репозиторий **SamSarukhanyan/my-fullstack-app** → **Settings** → **Actions** → **Runners**.
2. Посмотри список **Self-hosted runners**.
   - Если runner есть и статус **Idle** / **Online** (зелёный) — он должен подхватывать job; тогда смотри п. 3 на сервере.
   - Если runner **Offline** (серый) или его нет — нужно зайти на сервер и запустить/перезапустить runner (п. 2).

---

## 2. На сервере (EC2): проверить и перезапустить runner

Подключись к серверу (под пользователем, от которого установлен runner, например `sam`):

```bash
ssh prod-fullstack
# или: ssh -i ~/.ssh/prod-key.pem sam@<ELASTIC_IP>
```

### Проверить, запущен ли сервис runner

```bash
cd /home/sam/actions-runner
sudo ./svc.sh status
```

Ожидается что-то вроде: **active (running)**. Если **inactive** или **failed** — сервис не работает.

### Перезапустить runner

```bash
cd /home/sam/actions-runner
sudo ./svc.sh stop
sudo ./svc.sh start
sudo ./svc.sh status
```

Подожди 10–20 секунд и снова открой **GitHub → Settings → Actions → Runners** — статус должен стать **Idle** / **Online**.

### Если папки actions-runner нет или runner не установлен

Тогда runner нужно установить заново по инструкции в **deployment.md**, раздел **9.1 Создание runner на EC2**: скачать runner, `./config.sh`, `./svc.sh install`, `./svc.sh start`.

---

## 3. Если runner Online, но job всё равно висит

- В **Runners** на GitHub нажми на runner и проверь **Labels**: должен быть **self-hosted** (в workflow указано `runs-on: self-hosted`).
- Перезапусти runner на сервере (п. 2) и снова запусти workflow (Re-run all jobs во вкладке Actions).

---

## 4. После того как runner снова работает

- Запусти workflow заново: **Actions** → выбери последний run **Deploy to Production** → **Re-run all jobs**.
- Либо сделай небольшое изменение, коммит и **Commit & Sync** — новый push снова запустит workflow, и job должен подхватиться.

---

## Кратко

| Симптом | Причина | Действие |
|--------|--------|----------|
| «Waiting for a runner to pick up this job» | Runner на EC2 не запущен или Offline | Зайти на сервер, в `~/actions-runner` выполнить `sudo ./svc.sh start` и проверить `sudo ./svc.sh status` |
| Runner Offline в GitHub | Сервис runner не работает или сеть | То же: перезапуск `svc.sh`, проверить интернет и доступ к GitHub с сервера |

Workflow-файл менять не нужно — он корректно ждёт runner с меткой `self-hosted`. Исправлять нужно только состояние runner на сервере.
