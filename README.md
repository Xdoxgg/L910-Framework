# API для управления бассейнами и пловцами

## Единицы данных

### Pools (Бассейны)

Объекты бассейнов содержат следующие поля:

- `id` — уникальный идентификатор бассейна (число)
- `name` — название бассейна (строка)
- `type` — тип бассейна (например, "открытый", "закрытый") (строка)
- `length` — длина бассейна в метрах (число)
- `width` — ширина бассейна в метрах (число)
- `depth` — максимальная глубина в метрах (число)

### Swimmers (Пловцы)

Объекты пловцов содержат следующие поля:

- `id` — уникальный идентификатор пловца (число)
- `name` — имя пловца (строка)
- `age` — возраст (число)
- `level` — уровень подготовки (например, "начинающий", "продвинутый", "профессионал") (строка)
- `poolId` — id бассейна, который посещает пловец (число)

## Маршруты API

### Бассейны (Pools)

- `GET /pools` — получить список всех бассейнов (curl http://localhost:3000/pools)
- `GET /pools/:id` — получить бассейн по id (curl http://localhost:3000/pools/1)
- `POST /pools` — создать новый бассейн (тело запроса — JSON с параметрами) (➜  ~ curl -X POST http://localhost:3000/pools \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Новый бассейн",
  "type": "закрытый",
  "length": 30,
  "width": 15,
  "depth": 2
  }')
- `PUT /pools/:id` — полностью обновить бассейн по id (curl -X PUT http://localhost:3000/pools/1 \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Обновленный бассейн",
  "type": "открытый",
  "length": 50,
  "width": 25,
  "depth": 3.5
  }')
- `PATCH /pools/:id` — частично обновить бассейн по id (не идемпотентно) (curl -X PATCH http://localhost:3000/pools/1 \
  -H "Content-Type: application/json" \
  -d '{
  "depth": 4
  }')
- `DELETE /pools/:id` — удалить бассейн по id (curl -X DELETE http://localhost:3000/pools/1)

### Пловцы (Swimmers)

- `GET /swimmers` — получить список всех пловцов (curl http://localhost:3000/swimmers)
- `GET /swimmers/:id` — получить пловца по id (curl http://localhost:3000/swimmers/1)
- `POST /swimmers` — создать нового пловца (curl -X POST http://localhost:3000/swimmers \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Иван Петров",
  "age": 30,
  "level": "профессионал",
  "poolId": 1
  }')
- `PUT /swimmers/:id` — полностью обновить пловца по id (curl -X PUT http://localhost:3000/swimmers/1 \
  -H "Content-Type: application/json" \
  -d '{
  "name": "Алексей Смирнов",
  "age": 26,
  "level": "продвинутый",
  "poolId": 2
  }')
- `PATCH /swimmers/:id` — частично обновить пловца по id (не идемпотентно) (curl -X PATCH http://localhost:3000/swimmers/1 \
  -H "Content-Type: application/json" \
  -d '{
  "age": 27,
  "level": "профессионал"
  }')
- `DELETE /swimmers/:id` — удалить пловца по id (curl -X DELETE http://localhost:3000/swimmers/1)


