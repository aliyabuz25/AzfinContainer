FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3001
ENV HOST=0.0.0.0
ENV PORT=3001
CMD ["node", "server.js"]
