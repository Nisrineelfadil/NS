@echo off
echo ========================================
echo PWA Status Check
echo ========================================
echo.

echo Opening test page in browser...
start test-api-connection.html

echo.
echo ========================================
echo Instructions:
echo ========================================
echo.
echo 1. Click "Test API Connection" button
echo 2. Click "Test Student Login" button
echo 3. Check the results
echo.
echo If tests PASS:
echo   - API is working
echo   - Issue might be in PWA code or cache
echo   - Clear browser cache and try again
echo.
echo If tests FAIL:
echo   - Check Vercel environment variables
echo   - Check Vercel function logs
echo   - See PWA_CONNECTION_FIX.md for solutions
echo.
echo ========================================
echo Vercel Dashboard:
echo https://vercel.com/dashboard
echo.
echo PWA URL:
echo https://nisrine-school.vercel.app/pwa/
echo ========================================
echo.
pause
