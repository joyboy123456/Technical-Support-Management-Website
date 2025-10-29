#!/bin/bash

# 技术支持管理系统 Docker 部署脚本
# 目标服务器: 192.168.80.23

set -e

# 配置变量
TARGET_HOST="192.168.80.23"
TARGET_USER="root"  # 请根据实际情况修改用户名
PROJECT_NAME="tech-support-management"
DEPLOY_DIR="/opt/${PROJECT_NAME}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查本地依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    if ! command -v ssh &> /dev/null; then
        log_error "SSH 客户端未安装"
        exit 1
    fi
    
    log_info "依赖检查完成"
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    # 构建前端镜像
    log_info "构建前端镜像..."
    docker build -f Dockerfile.frontend -t ${PROJECT_NAME}-frontend:latest .
    
    # 构建 API 镜像
    log_info "构建 API 镜像..."
    docker build -f Dockerfile.api -t ${PROJECT_NAME}-api:latest .
    
    log_info "镜像构建完成"
}

# 保存镜像
save_images() {
    log_info "保存镜像到文件..."
    
    mkdir -p ./docker-images
    
    docker save ${PROJECT_NAME}-frontend:latest | gzip > ./docker-images/frontend.tar.gz
    docker save ${PROJECT_NAME}-api:latest | gzip > ./docker-images/api.tar.gz
    
    log_info "镜像保存完成"
}

# 传输文件到目标服务器
transfer_files() {
    log_info "传输文件到目标服务器 ${TARGET_HOST}..."
    
    # 创建远程目录
    ssh ${TARGET_USER}@${TARGET_HOST} "mkdir -p ${DEPLOY_DIR}"
    
    # 传输 Docker 镜像
    scp ./docker-images/*.tar.gz ${TARGET_USER}@${TARGET_HOST}:${DEPLOY_DIR}/
    
    # 传输配置文件
    scp docker-compose.yml ${TARGET_USER}@${TARGET_HOST}:${DEPLOY_DIR}/
    scp .env.production ${TARGET_USER}@${TARGET_HOST}:${DEPLOY_DIR}/.env
    scp nginx.conf ${TARGET_USER}@${TARGET_HOST}:${DEPLOY_DIR}/
    
    # 传输数据库迁移文件
    scp -r supabase/migrations ${TARGET_USER}@${TARGET_HOST}:${DEPLOY_DIR}/
    
    log_info "文件传输完成"
}

# 在目标服务器上部署
deploy_on_target() {
    log_info "在目标服务器上部署..."
    
    ssh ${TARGET_USER}@${TARGET_HOST} << EOF
        set -e
        cd ${DEPLOY_DIR}
        
        # 检查 Docker 是否安装
        if ! command -v docker &> /dev/null; then
            echo "在目标服务器上安装 Docker..."
            curl -fsSL https://get.docker.com -o get-docker.sh
            sh get-docker.sh
            systemctl start docker
            systemctl enable docker
        fi
        
        # 检查 Docker Compose 是否安装
        if ! command -v docker-compose &> /dev/null; then
            echo "在目标服务器上安装 Docker Compose..."
            curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)" -o /usr/local/bin/docker-compose
            chmod +x /usr/local/bin/docker-compose
        fi
        
        # 加载 Docker 镜像
        echo "加载 Docker 镜像..."
        docker load < frontend.tar.gz
        docker load < api.tar.gz
        
        # 停止现有服务
        echo "停止现有服务..."
        docker-compose down || true
        
        # 启动服务
        echo "启动服务..."
        docker-compose up -d
        
        # 等待服务启动
        echo "等待服务启动..."
        sleep 30
        
        # 检查服务状态
        echo "检查服务状态..."
        docker-compose ps
        
        echo "部署完成！"
        echo "前端访问地址: http://${TARGET_HOST}"
        echo "API 访问地址: http://${TARGET_HOST}:3001"
EOF
    
    log_info "部署完成"
}

# 清理本地文件
cleanup() {
    log_info "清理本地临时文件..."
    rm -rf ./docker-images
    log_info "清理完成"
}

# 主函数
main() {
    log_info "开始部署技术支持管理系统到 ${TARGET_HOST}"
    
    check_dependencies
    build_images
    save_images
    transfer_files
    deploy_on_target
    cleanup
    
    log_info "部署流程完成！"
    log_info "请访问 http://${TARGET_HOST} 查看应用"
}

# 显示帮助信息
show_help() {
    echo "技术支持管理系统 Docker 部署脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -t, --target   指定目标服务器 IP (默认: 192.168.80.23)"
    echo "  -u, --user     指定目标服务器用户名 (默认: root)"
    echo ""
    echo "示例:"
    echo "  $0                           # 使用默认配置部署"
    echo "  $0 -t 192.168.1.100         # 部署到指定 IP"
    echo "  $0 -t 192.168.1.100 -u admin # 使用指定用户部署"
}

# 解析命令行参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -t|--target)
            TARGET_HOST="$2"
            shift 2
            ;;
        -u|--user)
            TARGET_USER="$2"
            shift 2
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 执行主函数
main