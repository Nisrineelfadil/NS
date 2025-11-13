@echo off
echo ========================================
echo Final PWA Deployment with Enhanced Logging
echo ========================================
echo.

echo Step 1: Building PWA...
cd nisrine-student-pwa
call npm run build
cd ..

echo.
echo Step 2: Copying to /pwa...
xcopy /E /I /Y nisrine-student-pwa\build pwa

echo.
echo Step 3: Deploying...
git add pwa nisrine-student-pwa/src test-health-endpoint.html
git commit -m "enhanced-pwa-logging-and-health-test"
git push origin main:master

echo.
echo ========================================
echo Deployed!
echo ========================================
echo.
echo IMPORTANT: Test the health endpoint first!
echo.
echo 1. Open: test-health-endpoint.html in browser
echo 2. Click "Test /api/health"
echo 3. If it works, the PWA should work too
echo.
echo Then test PWA:
echo 1. Clear browser cache completely
echo 2. Visit: https://nisrine-school.vercel.app/pwa/
echo 3. Check console for detailed logs
echo.
pause
