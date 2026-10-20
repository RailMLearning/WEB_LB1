# Лабораторная №3: Java EE / Hibernate

Приложение студентов общежития: Jakarta EE 10, WildFly, Hibernate/JPA, PostgreSQL и отдельный
frontend на Node/JavaScript. Jakarta EE — актуальное название платформы Java EE; в коде используются
пакеты `jakarta.*`. Spring в этой реализации не используется.

## Запуск

Нужен работающий Docker Desktop с Linux-контейнерами. Из корня проекта:

```powershell
powershell -ExecutionPolicy Bypass -File tools/setup-env.ps1
docker compose -p web-lab3 -f compose.lab3.yaml up --build -d
```

Скрипт создаёт `.env` со случайными секретами и паролями. Существующий файл не перезаписывается. Для
ручной настройки есть `.env.example`: пустые `DB_PASSWORD`, `JWT_SECRET` и `ADMIN_PASSWORD`
необходимо заполнить. JWT_SECRET должен иметь не менее 32 байт.

- Страница: http://127.0.0.1:8080/
- Swagger UI: http://127.0.0.1:8080/docs
- Java API: http://127.0.0.1:8000/api/health
- OpenAPI: http://127.0.0.1:8080/api/openapi.json

Администратор создаётся при первом запуске. Логин — значение `ADMIN_USERNAME`, пароль —
`ADMIN_PASSWORD` из локального `.env`. Пароль не включён в отчёт или коллекцию. Регистрация через
страницу создаёт USER; права этой роли ограничены чтением.

Порты задаются `API_PORT` и `FRONTEND_PORT`. Если заняты 8000/8080, остановите прежние процессы или
поменяйте порты в `.env`. PostgreSQL доступен внутри сети Compose и не публикует свой порт на хост.

```powershell
docker compose -p web-lab3 -f compose.lab3.yaml logs -f web
docker compose -p web-lab3 -f compose.lab3.yaml down
```

Обычный `down` сохраняет том БД. Не добавляйте `-v`, если хотите сохранить пользователей и
студентов. SQL из `java-backend/docker/schema.sql` выполняется при создании нового тома. Hibernate
проверяет схему через `validate`, а не пересоздаёт данные.

## API

| Запрос                       | Назначение              | Доступ                  |
| ---------------------------- | ----------------------- | ----------------------- |
| POST `/api/auth/register`    | Регистрация             | Без входа, создаёт USER |
| POST `/api/auth/login`       | Получить access/refresh | Без входа               |
| POST `/api/auth/refresh`     | Заменить пару токенов   | Действующий refresh     |
| POST `/api/auth/logout`      | Отозвать refresh        | Refresh этого сеанса    |
| GET `/api/auth/me`           | Текущий пользователь    | USER, ADMIN             |
| GET `/api/requests`          | Список с условиями      | USER, ADMIN             |
| QUERY `/api/requests`        | Условия в JSON-теле     | USER, ADMIN             |
| GET `/api/requests/{isu}`    | Студент                 | USER, ADMIN             |
| POST `/api/requests`         | Создать                 | ADMIN                   |
| PUT `/api/requests/{isu}`    | Полностью заменить      | ADMIN                   |
| PATCH `/api/requests/{isu}`  | Частично изменить       | ADMIN                   |
| DELETE `/api/requests/{isu}` | Удалить                 | ADMIN                   |

Защищённый запрос передаёт `Authorization: Bearer <accessToken>`. Refresh используется только на
refresh/logout, вместо access он не принимается. При обновлении прежний refresh удаляется из базы и
возвращается новая пара. Logout отзывает refresh; уже выданный access остаётся действительным до
своего срока истечения.

Модель студента сохранена: `isu`, `fio`, `grid`, `dnum`, `rnum`, `expdate`, `foreigner`, `notes`.
ИСУ — строка из 5–7 цифр, ведущие нули сохраняются. ФИО допускает одно слово. Входной JSON
превращается в DTO, сущности Hibernate не возвращаются клиенту напрямую.

Фильтры: все поля студента, а также псевдонимы `group` для `grid`, `dormitory` для `dnum`. ФИО и
заметки ищутся по подстроке без учёта регистра; остальные поля сравниваются точно. Все фильтры
соединяются через «И». `q` ищет по ФИО, группе, ИСУ и заметкам. `%` и `_` в текстовом поиске
считаются буквальными символами, а не SQL-шаблонами.

Сортировка: `sort=isu|fio|grid|dnum|rnum|expdate|foreigner|notes`, `order=asc|desc`. Пагинация:
`page` от 0, `size` от 1 до 100, по умолчанию 20. Ответ списка остаётся массивом; метаданные идут в
`X-Total-Count`, `X-Page`, `X-Page-Size`. Например:

```text
GET /api/requests?group=M3301&dormitory=8&sort=fio&order=asc&page=0&size=20
```

При более чем трёх непустых поисковых условиях frontend использует QUERY с JSON-телом. Параметры
сортировки и страницы в этот порог не входят. OpenAPI 3 не содержит стандартного поля операции
QUERY: схема описывает его через `x-query`, пример есть в Postman. Swagger UI показывает стандартные
методы.

Единый формат ошибок:

```json
{ "detail": [{ "field": "fio", "message": "Введите имя буквами." }] }
```

Коды: 200 — чтение/изменение, 201 — создание, 204 — удаление без тела, 400 — некорректный JSON, 401
— нет действующей авторизации, 403 — недостаточно прав, 404 — запись не найдена, 409 — конфликт, 422
— недопустимые поля, 500 — непредвиденный сбой. Недоступный backend на стороне Node даёт 502.

## Проверка и защита

Java 17+ и Maven:

```powershell
mvn -f java-backend/pom.xml test
```

Проверка работающих контейнеров, Python 3 без дополнительных библиотек:

```powershell
python tools/check-lab3.py
```

Скрипт использует отдельные тестовые записи студентов и удаляет их после проверки.
Зарегистрированный тестовый USER остаётся в БД; имя печатается после завершения. Не запускайте
проверку на сервере с чужими рабочими данными.

Проверка интерфейса браузером:

```powershell
npm ci
$env:BROWSER_PATH = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
npm run test:ui
```

Можно использовать Chromium Playwright: выполнить `npx playwright install chromium` и не задавать
BROWSER_PATH. UI-проверка работает с временным студентом и тестовым USER, проверяет CRUD, refresh,
ограничения и Swagger.

Импортируйте `api/lab3.postman_collection.json` в Postman. В переменных коллекции заполните
`adminPassword` из `.env`, проверьте `baseUrl`. Запускайте запросы сверху вниз: создаются тестовый
USER и студент, токены сохраняются автоматически, в конце студент удаляется и USER выходит. Секреты
в сохранённую коллекцию не экспортируйте.

- `LAB3_REPORT.md` — отчёт и соответствие ТЗ.
- `LAB3_REVIEW.md` — проверка кода, исправления и ограничения.
- `LAB3_DEFENSE.md` — ответы на 16 вопросов по текущему Java-коду.
- `CHANGELOG.md` — история изменений.

Предыдущий Python-backend сохранён в `server/`, описание второй лабы — `README_LAB2.md`, ответы —
`LAB2_DEFENSE.md`. Общий frontend теперь работает с авторизацией третьей лабы; её отдельная
конфигурация сохранена в `compose.lab2.yaml` (старый frontend без авторизации не сохранён).
`compose.yaml` подключает третью лабораторную по умолчанию; отдельный `compose.lab3.yaml` делает её
запуск явным.
