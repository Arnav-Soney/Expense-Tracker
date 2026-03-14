FROM node:18-alpine

WORKDIR /app

# Copy frontend source
COPY frontend ./frontend

# Copy backend source
COPY backend ./backend

# Build frontend
WORKDIR /app/frontend
RUN npm install && npm run build

# Setup backend
WORKDIR /app/backend
RUN npm install

EXPOSE 5000

CMD ["npm", "start"]
