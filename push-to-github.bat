@echo off
echo ========================================
echo   Nisrine School - GitHub Push Script
echo ========================================
echo.

cd /d "%~dp0"

echo [1/7] Checking Git installation...
git --version
if errorlevel 1 (
    echo ERROR: Git is not installed!
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo.

echo [2/7] Initializing Git repository...
git init
echo.

echo [3/7] Adding remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/Zayddahhaoui0609/ns.git
echo.

echo [4/7] Setting main branch...
git branch -M main
echo.

echo [5/7] Adding all files...
git add .
echo.

echo [6/7] Creating commit...
git commit -m "Complete Nisrine School Management System - Full Implementation"
echo.

echo [7/7] Pushing to GitHub...
git push -u origin main --force
echo.

if errorlevel 1 (
    echo.
    echo ========================================
    echo   PUSH FAILED!
    echo ========================================
    echo.
    echo Possible reasons:
    echo - Authentication required (use Personal Access Token)
    echo - Network connection issue
    echo - Repository doesn't exist
    echo.
    echo To fix authentication:
    echo 1. Go to: https://github.com/settings/tokens
    echo 2. Generate new token (classic)
    echo 3. Use token as password when prompted
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   SUCCESS! Project pushed to GitHub
echo ========================================
echo.
echo Repository URL:
echo https://github.com/Zayddahhaoui0609/ns
echo.
echo Next steps:
echo 1. Visit the repository URL above
echo 2. Verify all files are there
echo 3. Add a README.md if needed
echo 4. Set repository visibility (public/private)
echo.
pause
