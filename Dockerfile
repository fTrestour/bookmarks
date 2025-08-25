FROM node:24 AS base
RUN npx -y playwright@1.54.0 install --with-deps

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts

COPY . .

EXPOSE 3000

ENV PORT=3000

CMD ["npm", "start"] 