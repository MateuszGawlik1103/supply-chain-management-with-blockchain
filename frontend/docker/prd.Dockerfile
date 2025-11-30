# ===== STAGE 1: Build Frontend =====
ARG NODE_VERSION=23.7-alpine

FROM node:${NODE_VERSION} AS builder-frontend

ENV NODE_ENV=production

WORKDIR /app/frontend

ENV VITE_BACKEND_URL=/api

COPY ./package.json . 
RUN npm install --include dev

COPY ./src ./src
COPY ./public ./public
COPY ./config/vite.config.ts ./config/vite.config.ts
COPY ./tsconfig.app.json .
COPY ./index.html .

RUN npm run build

# ===== STAGE 2: Production =====
FROM nginx:alpine AS production

RUN apk add --no-cache npm

ENV USER=appuser
ENV UID=1001
ENV GROUP=appgroup
ENV GID=1001

RUN addgroup -g $GID $GROUP && adduser -u $UID -G $GROUP -D $USER

WORKDIR /usr/share/nginx/html

COPY --from=builder-frontend --chown=$UID:$GID /app/frontend/dist ./

COPY ./nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Start frontend (Nginx)
CMD ["nginx", "-g", "daemon off;" ]
