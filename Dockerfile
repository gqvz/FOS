FROM node:22-alpine3.20
LABEL authors="gqvz"
WORKDIR /app
COPY . .
RUN npm install --production
CMD ["node", "bin/www"]