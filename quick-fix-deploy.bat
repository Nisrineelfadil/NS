@echo off
echo Deploying simplified health endpoint...
git add server.js
git commit -m "simplify-health-endpoint"
git push origin main:master
echo.
echo Deployed! Wait 1 minute then test:
echo https://nisrine-school.vercel.app/pwa/
echo.
pause
