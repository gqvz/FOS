FROM node:22-alpine3.20
LABEL authors="gqvz"

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "bin/www"]