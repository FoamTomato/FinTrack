# 基于 Node.js 18 镜像
FROM node:18-alpine

# 设置环境变量为生产模式，优化依赖安装和运行时性能
ENV NODE_ENV=production

# 设置工作目录
WORKDIR /app

# 复制依赖配置
COPY package*.json ./

# 安装生产环境依赖，并清理缓存减少镜像体积
RUN npm install --production && npm cache clean --force

# 复制源代码
COPY . .

# 暴露端口
EXPOSE 80

# 启动命令：直接使用 node 启动，避免 npm 进程转发信号问题
CMD ["node", "app.js"]
