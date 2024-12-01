# 使用 Node.js 18 的 Alpine Linux 版本作為基礎映像
FROM node:18-slim

# 設置工作目錄
WORKDIR /app

# Create logs directory and set proper permissions
RUN mkdir -p /app/logs && chmod 777 /app/logs

# 複製 package.json 和 package-lock.json（如果存在）
COPY package*.json ./

# 安裝依賴（不在本地環境安裝）
RUN npm install

# 複製應用程式代碼
COPY . .

# 設置環境變量
ENV NODE_ENV=production

# 暴露應用程式端口
EXPOSE 3000

# 設置啟動命令
CMD ["npm", "start"]
