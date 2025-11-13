@echo off
echo ========================================
echo Pushing PWA Fix to Master Branch
echo ========================================
echo.

echo Step 1: Adding changes...
git add vercel.json

echo.
echo Step 2: Committing changes...
git commit -m "fix-vercel-static-deployment"

echo.
echo Step 3: Pushing to master branch...
git push origin main:master

echo.
echo ========================================
echo Push Complete!
echo ========================================
echo.
echo Vercel will auto-deploy from master branch
echo Check: https://vercel.com/dashboard
echo.
echo After deployment:
echo 1. Clear browser cache
echo 2. Visit: https://nisrine-school.vercel.app/pwa/
echo.
pause
