# ── Build stage ──
FROM node:22-alpine AS build
ENV CI=true
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
ENV PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS=true
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g npm@12.0.0
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ── Production stage ──
FROM node:22-alpine
ENV CI=true
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
ENV PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS=true
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/src/main.js"]
