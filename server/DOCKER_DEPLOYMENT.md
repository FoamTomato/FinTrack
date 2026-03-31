# Docker 部署指南

## 概述
本项目已配置为从环境变量读取所有敏感信息，确保 Docker 镜像中不包含任何硬编码的密钥或凭证。

## 前置条件
- Docker 已安装
- 拥有以下信息：
  - 微信 AppID 和 AppSecret
  - MySQL 数据库连接信息
  - （可选）腾讯云 COS 配置

## 构建 Docker 镜像

```bash
cd /Users/foam/个人项目/wechatApp/server
docker build -t wechat-account-server:1.0.0 .
```

## 运行 Docker 容器

### 方式一：直接指定环境变量

```bash
docker run -d \
  --name wechat-server \
  -p 80:80 \
  -e WX_APPID=wxde8a208736a4cc77 \
  -e WX_SECRET=19fed526e47a4360d9a9a71e233752f1 \
  -e MYSQL_HOST=sh-cynosdbmysql-grp-cq9vhtoy.sql.tencentcdb.com \
  -e MYSQL_PORT=21257 \
  -e MYSQL_USERNAME=root \
  -e MYSQL_PASSWORD=vtb8MuRw \
  -e MYSQL_DATABASE=account_app \
  -e PORT=80 \
  -e NODE_ENV=production \
  wechat-account-server:1.0.0
```

### 方式二：使用 .env 文件（本地开发）

1. 复制 `.env.example` 为 `.env`：
```bash
cp .env.example .env
```

2. 编辑 `.env` 并填入真实凭证：
```bash
vi .env
```

3. 运行容器：
```bash
docker run -d \
  --name wechat-server \
  -p 80:80 \
  --env-file .env \
  wechat-account-server:1.0.0
```

⚠️ **生产环境不推荐使用此方式** - 应该使用容器编排系统（K8s、Docker Swarm）或云托管平台的环境变量管理功能。

### 方式三：Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  wechat-server:
    image: wechat-account-server:1.0.0
    ports:
      - "80:80"
    environment:
      - WX_APPID=${WX_APPID}
      - WX_SECRET=${WX_SECRET}
      - MYSQL_HOST=${MYSQL_HOST}
      - MYSQL_PORT=${MYSQL_PORT}
      - MYSQL_USERNAME=${MYSQL_USERNAME}
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - MYSQL_DATABASE=${MYSQL_DATABASE}
      - PORT=80
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

运行：
```bash
docker-compose up -d
```

## 环境变量说明

| 变量名 | 说明 | 必需 | 示例 |
|-------|------|------|------|
| `WX_APPID` | 微信小程序 AppID | ✅ | `wxde8a208736a4cc77` |
| `WX_SECRET` | 微信小程序 AppSecret | ✅ | 保密信息 |
| `MYSQL_HOST` | MySQL 服务器地址 | ✅ | `sh-cynosdbmysql-grp-cq9vhtoy.sql.tencentcdb.com` |
| `MYSQL_PORT` | MySQL 端口 | ✅ | `21257` |
| `MYSQL_USERNAME` | MySQL 用户名 | ✅ | `root` |
| `MYSQL_PASSWORD` | MySQL 密码 | ✅ | 保密信息 |
| `MYSQL_DATABASE` | 数据库名 | ✅ | `account_app` |
| `COS_BUCKET` | 腾讯云 COS 桶名 | ❌ | `7072-prod-xxx` |
| `COS_REGION` | 腾讯云 COS 地域 | ❌ | `ap-shanghai` |
| `PORT` | 服务监听端口 | ✅ | `80` |
| `NODE_ENV` | Node.js 环境 | ✅ | `production` |

## 验证部署

```bash
# 检查容器状态
docker ps

# 查看容器日志
docker logs wechat-server

# 测试健康检查端点
curl http://localhost/health
```

## 云托管部署

### 腾讯云云托管

在微信云托管控制台：

1. 上传镜像或使用 GitLab CI/CD 自动构建
2. 在部署配置中设置环境变量：
   - `WX_APPID`
   - `WX_SECRET`
   - `MYSQL_HOST`
   - `MYSQL_PORT`
   - `MYSQL_USERNAME`
   - `MYSQL_PASSWORD`
   - `MYSQL_DATABASE`
   - `PORT=80`
   - `NODE_ENV=production`

3. 部署容器

### Kubernetes

使用 Secret 管理敏感信息：

```bash
kubectl create secret generic wechat-secrets \
  --from-literal=WX_APPID=xxxx \
  --from-literal=WX_SECRET=xxxx \
  --from-literal=MYSQL_PASSWORD=xxxx
```

Pod 配置示例：

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: wechat-server
spec:
  containers:
  - name: wechat-server
    image: wechat-account-server:1.0.0
    ports:
    - containerPort: 80
    env:
    - name: WX_APPID
      valueFrom:
        secretKeyRef:
          name: wechat-secrets
          key: WX_APPID
    - name: WX_SECRET
      valueFrom:
        secretKeyRef:
          name: wechat-secrets
          key: WX_SECRET
    # ... 其他环境变量
```

## 安全建议

✅ **已做好的安全措施：**
- 所有敏感信息从环境变量读取
- `.env` 文件在 Docker 镜像中被排除（`.dockerignore`）
- 生产环境强制需要提供所有必需的环境变量
- 提供了 `.env.example` 作为安全的配置模板

⚠️ **额外安全建议：**
- 使用安全的密钥管理系统（如 HashiCorp Vault、AWS Secrets Manager）
- 限制容器的运行权限（非 root 用户）
- 定期轮换 AppSecret 和数据库密码
- 启用 HTTPS/TLS
- 使用网络隔离和防火墙规则
- 定期更新依赖包

## 常见问题

### 1. "Missing required environment variables" 错误

**原因：** 缺少必需的环境变量

**解决：** 检查运行命令中是否包含所有必需的 `-e` 选项

```bash
# ❌ 错误：缺少 WX_SECRET
docker run -e WX_APPID=xxx ...

# ✅ 正确：包含所有必需变量
docker run -e WX_APPID=xxx -e WX_SECRET=xxx ...
```

### 2. 数据库连接失败

**原因：**
- 网络不可达
- 凭证错误
- 防火墙阻止

**排查：**
```bash
# 查看容器日志
docker logs wechat-server

# 测试数据库连接（在容器内）
docker exec wechat-server ping $MYSQL_HOST
```

### 3. 微信接口调用失败

**原因：**
- AppID 或 AppSecret 错误
- 小程序未配置白名单

**解决：**
- 确认 AppID 和 AppSecret 正确
- 在微信小程序后台配置服务器白名单

## 更新镜像

当代码有更新时：

```bash
# 1. 重新构建镜像
docker build -t wechat-account-server:1.0.1 .

# 2. 停止旧容器
docker stop wechat-server
docker rm wechat-server

# 3. 运行新容器
docker run -d \
  --name wechat-server \
  -p 80:80 \
  -e WX_APPID=xxx \
  ... # 其他环境变量
  wechat-account-server:1.0.1
```

或使用 Docker Compose 更新：

```bash
docker-compose up -d --build
```
