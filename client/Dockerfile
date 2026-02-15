FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_APP_ENV=production
ARG VITE_TEST_MODE=false

ENV VITE_APP_ENV=$VITE_APP_ENV
ENV VITE_TEST_MODE=$VITE_TEST_MODE

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
