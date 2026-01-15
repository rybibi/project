FROM golang:1.23

WORKDIR /app

# Устанавливаем git через apt-get (так как у вас образ на базе Debian)
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# Копируем зависимости
COPY go.mod go.sum ./

# Разрешаем скачивать нужную версию Go автоматически
ENV GOTOOLCHAIN=auto

RUN go mod download || true

# Копируем всё остальное
COPY . .

# Собираем
RUN go build -o main main.go

CMD ["./main"]