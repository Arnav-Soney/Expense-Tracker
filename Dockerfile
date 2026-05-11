# Build frontend
FROM node:26-alpine AS frontend-builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app/frontend
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build

# Build Go backend
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
COPY backend/ ./backend/
RUN CGO_ENABLED=0 GOOS=linux go build -o /expense-tracker

# Final image
FROM alpine:latest
WORKDIR /app
COPY --from=backend-builder /expense-tracker .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
EXPOSE 8080
CMD ["./expense-tracker"]
