# ---- Frontend build ----
FROM node:lts-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Backend build ----
FROM node:lts-alpine AS backend-build
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ---- Runtime ----
FROM node:lts-alpine
WORKDIR /app/backend
COPY --from=backend-build /app/backend ./
COPY --from=frontend-build /app/frontend/dist ../frontend/dist

EXPOSE 3333
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
