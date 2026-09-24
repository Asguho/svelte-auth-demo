FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
# Env vars are read at runtime; the build only needs them to pass validation
RUN DATABASE_URL=postgres://build AUTH_SECRET=AAAA bun run build
ENV NODE_ENV=production PORT=3000
EXPOSE 3000
CMD ["bun", "build/index.js"]
