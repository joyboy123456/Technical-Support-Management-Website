# 图片数据库存储迁移指南

## 概述

本次更新将图片存储从云存储服务迁移到数据库存储，提供更好的数据控制和隐私保护。

## 主要变更

### 1. 后端 API 变更
- 添加了 `multer` 依赖用于文件上传处理
- 新增图片上传、获取、删除等 API 接口
- 支持文件上传和 Base64 上传两种方式

### 2. 数据库变更
- 新增 `images` 表用于存储图片二进制数据
- 包含图片元数据（文件名、MIME类型、大小等）

### 3. 前端变更
- 修改图片上传逻辑，优先使用数据库存储
- 保留云存储作为备用方案
- 支持从剪贴板直接上传图片

## 部署步骤

### 1. 安装新依赖
```bash
npm install
```

### 2. 创建图片存储表
```bash
npm run migrate:images
```

### 3. 重新构建镜像
```bash
# 构建后端 API 镜像
docker build -f Dockerfile.api -t swr.cn-east-3.myhuaweicloud.com/btc8_public/tech-support-api:v2 .

# 构建前端镜像
docker build -f Dockerfile.frontend -t swr.cn-east-3.myhuaweicloud.com/btc8_public/tech-support-ui:v3 .

# 推送镜像
docker push swr.cn-east-3.myhuaweicloud.com/btc8_public/tech-support-api:v2
docker push swr.cn-east-3.myhuaweicloud.com/btc8_public/tech-support-ui:v3
```

### 4. 更新 docker-compose.yml
```yaml
services:
  postgres-api:
    image: swr.cn-east-3.myhuaweicloud.com/btc8_public/tech-support-api:v2
    
  frontend:
    image: swr.cn-east-3.myhuaweicloud.com/btc8_public/tech-support-ui:v3
```

### 5. 重新部署服务
```bash
docker-compose --env-file .env.production down
docker-compose --env-file .env.production up -d
```

## 新增 API 接口

### 图片上传
- `POST /upload/image` - 文件上传
- `POST /upload/base64` - Base64 上传

### 图片管理
- `GET /image/:imageId` - 获取图片
- `DELETE /image/:imageId` - 删除图片
- `GET /images` - 图片列表

## 数据库表结构

```sql
CREATE TABLE images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    mimetype VARCHAR(100) NOT NULL,
    data BYTEA NOT NULL,
    size INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 优势

1. **数据控制**: 图片数据完全在自己的数据库中
2. **隐私保护**: 不依赖第三方云存储服务
3. **访问控制**: 可以实现更精细的权限控制
4. **备份一致性**: 图片数据与业务数据一起备份
5. **离线支持**: 不依赖外部网络服务

## 注意事项

1. **存储空间**: 数据库存储会占用更多磁盘空间
2. **性能考虑**: 大量图片可能影响数据库性能
3. **备份策略**: 需要考虑包含图片数据的备份策略
4. **缓存策略**: 建议在 nginx 层添加图片缓存

## 故障排除

### 1. 上传失败
- 检查文件大小限制（默认 10MB）
- 检查 MIME 类型是否为图片格式
- 检查数据库连接是否正常

### 2. 图片显示异常
- 检查图片 URL 格式是否正确
- 检查 API 服务是否正常运行
- 检查数据库中是否存在对应记录

### 3. 性能问题
- 考虑添加图片压缩
- 实施图片缓存策略
- 监控数据库存储使用情况