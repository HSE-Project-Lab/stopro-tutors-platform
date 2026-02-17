FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY src/ ./src/
COPY index.html ./
COPY vite.config.* ./
COPY tsconfig*.json ./
COPY postcss.config.* ./

# Собираем
RUN npm run build

# === Продакшен ===
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]