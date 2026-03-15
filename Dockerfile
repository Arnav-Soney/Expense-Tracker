# Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Build Go backend
FROM golang:1.25-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /expense-tracker

# Final image
FROM alpine:latest
WORKDIR /app
COPY --from=backend-builder /expense-tracker .
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist
EXPOSE 8080
CMD ["./expense-tracker"]
