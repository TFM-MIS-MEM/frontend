# Panel del cliente: build estático de Vite servido por nginx.
FROM node:24-alpine AS build
RUN npm install -g pnpm@11.24.0
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Origen público de la pasarela, tal como lo verá el NAVEGADOR: no es la
# dirección de Kong dentro de la red de Docker. Queda escrito en el bundle;
# no es un secreto.
ARG VITE_GATEWAY_URL=http://localhost:8000
ENV VITE_GATEWAY_URL=$VITE_GATEWAY_URL
RUN pnpm build

FROM nginx:1.29-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
