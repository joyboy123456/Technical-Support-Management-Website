@echo off
echo ========================================
echo   Supabase 数据库迁移工具
echo ========================================
echo.

cd /d "%~dp0.."
node scripts/migrate-to-supabase.js

echo.
echo ========================================
pause
