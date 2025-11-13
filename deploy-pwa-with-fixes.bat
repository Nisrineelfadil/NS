@echo off
echo ========================================
echo Deploying PWA with Connection Fixes
echo ========================================
echo.

echo Step 1: Building PWA with enhanced logging...
cd nisrine-student-pwa
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
echo Step 3: Adding all changes...
git add server.js pwa nisrine-student-pwa/src

echo.
echo Step 4: Committing changes...
git commit -m "add-api-health-check-and-enhanced-logging"

echo.
echo Step 5: Pushing to master branch...
git push origin main:master

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Changes deployed:
echo - Added /api/health endpoint
echo - Increased timeout to 30 seconds
echo - Added detailed error logging
echo - Added API connectivity check
echo.
echo Wait 1-2 minutes for Vercel deployment
echo.
echo Then test:
echo 1. Open: https://nisrine-school.vercel.app/pwa/
echo 2. Open browser DevTools (F12)
echo 3. Go to Console tab
echo 4. Try logging in
echo 5. Check console for detailed logs
echo.
echo You should see:
echo - "Checking API connectivity..."
echo - "API is online" or "API check failed"
echo - "Login attempt" with details
echo.
pause
