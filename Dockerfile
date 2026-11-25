FROM node:22-alpine

WORKDIR /app
COPY mcp-server ./mcp-server

ENTRYPOINT ["node", "/app/mcp-server/index.mjs"]
