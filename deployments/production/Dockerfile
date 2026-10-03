# ── Build stage ──
FROM node:22-alpine AS build
ENV CI=true
ENV PNPM_CONFIG_MINIMUM_RELEASE_AGE=0
ENV PNPM_CONFIG_DANGEROUSLY_ALLOW_ALL_BUILDS=true
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10 && pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# ── Production stage ──
FROM node:22-alpine
ENV CI=true
ENV NODE_ENV=production
WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm@10 && pnpm install --prod --frozen-lockfile
COPY --from=build /app/dist ./dist
COPY --from=build /app/app ./app
USER node
EXPOSE 7501
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const p=process.env.PORT??3000; fetch('http://localhost:'+p+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/src/main.js"]
