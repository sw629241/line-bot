FROM node:20-slim

# 安裝基本工具和 PM2
RUN apt-get update && apt-get install -y \
    curl \
    git \
    && npm install -g pm2 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 複製 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安裝依賴
RUN npm install

# 複製源代碼
COPY . .

# 設置環境變數
ENV NODE_ENV=production
ENV PORT=5000

# 暴露端口
EXPOSE 5000

# 使用 PM2 啟動應用
CMD ["pm2-runtime", "app.js"]
