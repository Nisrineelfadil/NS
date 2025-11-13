@echo off
git add server.js
git commit -m "fix-health-endpoint-mongoose-import"
git push origin main:master
echo.
echo Pushed! Wait 1-2 minutes for Vercel deployment
echo Then test: https://nisrine-school.vercel.app/pwa/
pause
