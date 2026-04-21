FROM node:20.19.5-alpine

RUN npm install -g pnpm

WORKDIR /frontend

COPY pnpm-lock.yaml package.json ./

RUN pnpm install

COPY . .

EXPOSE 5173

CMD ["pnpm", "run", "dev", "--host", "0.0.0.0"]