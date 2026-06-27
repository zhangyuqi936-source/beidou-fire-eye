FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build:h5
EXPOSE 8080
CMD ["node", "server.cjs"]
