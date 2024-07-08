FROM node:alpine as builder

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install 

COPY tsconfig.json .

COPY src ./src

RUN npm run build

FROM node:alpine

WORKDIR /app

COPY package.json .
COPY package-lock.json .

RUN npm install --only=production

COPY --from=builder /app/build ./build

EXPOSE 8080

CMD ["npm", "start"]
