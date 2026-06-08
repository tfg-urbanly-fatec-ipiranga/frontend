FROM node:24-alpine AS builder

RUN npm install -g pnpm@10.32.1

WORKDIR /frontend

COPY pnpm-lock.yaml package.json ./

RUN PNPM_ALLOW_ONLY_BUILT_DEPENDENCIES=1 pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL="/api"

ENV VITE_API_URL=$VITE_API_URL

RUN pnpm vite build

FROM nginx:alpine

COPY --from=builder /frontend/dist /usr/share/nginx/html

RUN echo 'server { listen 80; location / { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80 

CMD ["nginx", "-g", "daemon off;"]