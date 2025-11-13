@echo off
echo ========================================
echo Deploying PWA Fix to Master Branch
echo ========================================
echo.

cd nisrine-student-pwa
echo Step 1: Building PWA...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Copying build to /pwa folder...
cd ..
xcopy /E /I /Y nisrine-student-pwa\build pwa

echo.
echo Step 3: Removing conflicting vercel.json from PWA subfolder...
if exist nisrine-student-pwa\vercel.json del nisrine-student-pwa\vercel.json

echo.
echo Step 4: Adding changes...
git add vercel.json pwa nisrine-student-pwa

echo.
echo Step 5: Committing changes...
git commit -m "fix-pwa-static-serving"

echo.
echo Step 6: Pushing to master branch...
git push origin main:master

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Vercel will auto-deploy in 1-2 minutes
echo Check: https://vercel.com/dashboard
echo.
echo After deployment:
echo 1. Clear browser cache (Ctrl+Shift+Delete)
echo 2. Visit: https://nisrine-school.vercel.app/pwa/
echo.
pause
