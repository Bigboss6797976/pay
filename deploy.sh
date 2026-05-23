#!/bin/bash
set -e
echo "🚀 开始部署聚合支付服务..."
BUILD_DIR="$HOME/pay-agg-build"
REPO="Bigboss6797976/pay"
echo "📁 准备构建目录..."
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"
echo "📦 复制项目文件..."
cp -r /storage/emulated/0/Download/4/pay/* "$BUILD_DIR/"
echo "🔧 初始化 Git..."
cd "$BUILD_DIR"
git init
git add .
git commit -m "deploy: 聚合支付服务 $(date '+%Y-%m-%d %H:%M:%S')"
echo "🔗 添加远程仓库..."
git remote add origin "https://github.com/$REPO.git" 2>/dev/null || true
echo "⬆️ 推送到 GitHub..."
git push -f origin main || git push -f origin master
echo "✅ 部署完成！"
echo ""
echo "📱 Railway 将自动部署最新代码"
echo "🌐 访问地址: https://你的项目.railway.app"
echo ""
echo "⚠️  请确保已设置环境变量:"
echo "   export ALIPAY_APP_ID=你的APP_ID"
echo "   export ALIPAY_PRIVATE_KEY=你的私钥"
echo "   export ALIPAY_PUBLIC_KEY=支付宝公钥"
