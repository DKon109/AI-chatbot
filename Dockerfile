FROM node:22.18-alpine AS frontend-build
WORKDIR /app/frontend

COPY medical-ai-enhanced/frontend/package.json medical-ai-enhanced/frontend/package-lock.json ./
RUN npm ci

COPY medical-ai-enhanced/frontend/ ./
ENV VITE_API_URL=/api
RUN npm run build

FROM node:22.18-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY medical-ai-enhanced/backend/package.json medical-ai-enhanced/backend/package-lock.json ./
RUN npm ci --omit=dev

COPY medical-ai-enhanced/backend/ ./
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 5001
CMD ["npm", "run", "start:production"]
