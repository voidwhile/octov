#!/usr/bin/env bash
# ============================================================
# Octov macOS 构建脚本
# 流程：同步版本号 → TypeScript 类型检查 → electron-vite 构建 → 打 zip 包
# ============================================================

set -e  # 任意步骤失败立即退出

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$ROOT_DIR"

echo "▶ 步骤 1/3  同步版本号..."
node scripts/sync-version.js

echo "▶ 步骤 2/3  编译前端与主进程..."
npx electron-vite build

echo "▶ 步骤 3/3  打包 zip..."
npx electron-builder --mac zip

echo ""
echo "✅ 构建完成！产物位于 dist/ 目录"
