FROM node:22-bookworm-slim

WORKDIR /app

# yt-dlp uses ffmpeg to extract audio and to embed metadata/artwork.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg python3 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && mkdir -p /data/downloads /data/zips /data/staging /data/uploads

ENV NODE_ENV=production \
    PORT=3000 \
    DOWNLOAD_DIR=/data/downloads \
    ZIP_DIR=/data/zips \
    STAGE_DIR=/data/staging

EXPOSE 3000
CMD ["node", "server.js"]
