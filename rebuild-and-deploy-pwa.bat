@echo off
echo ========================================
echo Rebuilding and Deploying PWA
echo ========================================
echo.

echo Step 1: Building fresh PWA...
cd nisrine-student-pwa
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Removing old /pwa folder...
cd ..
if exist pwa rmdir /S /Q pwa

echo.
echo Step 3: Copying fresh build to /pwa...
xcopy /E /I /Y nisrine-student-pwa\build pwa

echo.
echo Step 4: Verifying files...
dir pwa\static\js\*.js

echo.
echo Step 5: Adding changes...
git add pwa

echo.
echo Step 6: Committing...
git commit -m "rebuild-pwa-with-latest-changes"

echo.
echo Step 7: Pushing to master...
git push origin main:master

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Wait 1-2 minutes for Vercel deployment
echo Then test: https://nisrine-school.vercel.app/pwa/
echo.
echo Clear browser cache before testing:
echo 1. Press Ctrl+Shift+Delete
echo 2. Select "All time"
echo 3. Check "Cached images and files"
echo 4. Click "Clear data"
echo.
pause
