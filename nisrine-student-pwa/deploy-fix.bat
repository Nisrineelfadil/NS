@echo off
echo ========================================
echo Deploying PWA Fix to Vercel
echo ========================================
echo.

echo Step 1: Building the app...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Committing changes...
git add .
git commit -m "Fix: Correct Vercel routing for static assets"

echo.
echo Step 3: Pushing to GitHub...
git push

echo.
echo Step 4: Deploying to Vercel...
echo Please wait for Vercel to auto-deploy from GitHub...
echo.
echo Check deployment status at: https://vercel.com/dashboard
echo.
echo ========================================
echo Deployment initiated successfully!
echo ========================================
echo.
echo After deployment completes:
echo 1. Clear browser cache (Ctrl+Shift+Delete)
echo 2. Visit: https://nisrine-school.vercel.app/pwa/
echo 3. Test the app
echo.
pause
