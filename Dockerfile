# 使用 Node.js 18 的 Alpine Linux 版本作為基礎映像
FROM node:18-slim

# 設置工作目錄
WORKDIR /app

# Create logs directory and set proper permissions
RUN mkdir -p /app/logs && chmod 777 /app/logs

# 複製 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安裝依賴
RUN npm install && npm cache clean --force

# 複製應用程式代碼
COPY . .

# 設置環境變量
ENV NODE_ENV=production
ENV PORT=80

# 確保日誌目錄存在並可寫
RUN mkdir -p /app/admin/logs && chmod 777 /app/admin/logs

# 啟動應用程式
CMD ["npm", "start"]
