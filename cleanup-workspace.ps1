# Cleanup Script - Remove Unnecessary Files
Write-Host "Starting workspace cleanup..." -ForegroundColor Cyan

$deletedCount = 0
$savedSpace = 0

# 1. Delete all MD files except README.md
Write-Host "`n[1/8] Removing documentation files (*.md except README.md)..." -ForegroundColor Yellow
Get-ChildItem -Path "." -Filter "*.md" | Where-Object { $_.Name -ne "README.md" } | ForEach-Object {
    $savedSpace += $_.Length
    Remove-Item $_.FullName -Force
    $deletedCount++
    Write-Host "  Deleted: $($_.Name)" -ForegroundColor Gray
}

# 2. Delete old HTML files
Write-Host "`n[2/8] Removing old/backup HTML files..." -ForegroundColor Yellow
$oldHtmlFiles = @(
    "student-portal.html.old",
    "teacher-portal.html.old"
)
foreach ($file in $oldHtmlFiles) {
    if (Test-Path $file) {
        $item = Get-Item $file
        $savedSpace += $item.Length
        Remove-Item $file -Force
        $deletedCount++
        Write-Host "  Deleted: $file" -ForegroundColor Gray
    }
}

# 3. Delete duplicate push scripts (keep only push-to-github.bat)
Write-Host "`n[3/8] Removing duplicate push scripts..." -ForegroundColor Yellow
$pushScripts = @(
    "commit-and-push.bat",
    "deploy-now.bat",
    "final-push.bat",
    "push-debug.bat",
    "push-fix.bat",
    "push-now.cmd",
    "push-now.ps1",
    "push-pwa-fix.bat",
    "push-react-build.cmd",
    "push-rebuild.bat",
    "push-student-portal.bat",
    "quick-push.bat",
    "quick-push.cmd"
)
foreach ($file in $pushScripts) {
    if (Test-Path $file) {
        $item = Get-Item $file
        $savedSpace += $item.Length
        Remove-Item $file -Force
        $deletedCount++
        Write-Host "  Deleted: $file" -ForegroundColor Gray
    }
}

# 4. Delete test scripts
Write-Host "`n[4/8] Removing test scripts..." -ForegroundColor Yellow
$testScripts = @(
    "check-student-grades.js",
    "reset-student-password.js",
    "test-connection.js",
    "test-login-api.js",
    "test-student-login.js"
)
foreach ($file in $testScripts) {
    if (Test-Path $file) {
        $item = Get-Item $file
        $savedSpace += $item.Length
        Remove-Item $file -Force
        $deletedCount++
        Write-Host "  Deleted: $file" -ForegroundColor Gray
    }
}

# 5. Delete utility scripts
Write-Host "`n[5/8] Removing utility scripts..." -ForegroundColor Yellow
$utilScripts = @(
    "copy-to-new.ps1",
    "create-zip.ps1",
    "deploy-pwa.js",
    "build-all.js",
    "verify-deployment.js"
)
foreach ($file in $utilScripts) {
    if (Test-Path $file) {
        $item = Get-Item $file
        $savedSpace += $item.Length
        Remove-Item $file -Force
        $deletedCount++
        Write-Host "  Deleted: $file" -ForegroundColor Gray
    }
}

# 6. Delete entire docs folder (all documentation)
Write-Host "`n[6/8] Removing docs folder..." -ForegroundColor Yellow
if (Test-Path "docs") {
    $docsSize = (Get-ChildItem -Path "docs" -Recurse | Measure-Object -Property Length -Sum).Sum
    $savedSpace += $docsSize
    $docsCount = (Get-ChildItem -Path "docs" -Recurse -File).Count
    Remove-Item "docs" -Recurse -Force
    $deletedCount += $docsCount
    Write-Host "  Deleted: docs folder ($docsCount files)" -ForegroundColor Gray
}

# 7. Delete old/unused app folders
Write-Host "`n[7/8] Removing old app folders..." -ForegroundColor Yellow
$oldFolders = @(
    "nisrine-admin-desktop",
    "nisrine-teacher-app",
    "pwa"
)
foreach ($folder in $oldFolders) {
    if (Test-Path $folder) {
        $folderSize = (Get-ChildItem -Path $folder -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        $folderCount = (Get-ChildItem -Path $folder -Recurse -File -ErrorAction SilentlyContinue).Count
        $savedSpace += $folderSize
        Remove-Item $folder -Recurse -Force -ErrorAction SilentlyContinue
        $deletedCount += $folderCount
        Write-Host "  Deleted: $folder ($folderCount files)" -ForegroundColor Gray
    }
}

# 8. Delete PUSH_TO_GITHUB_INSTRUCTIONS.txt
Write-Host "`n[8/8] Removing instruction files..." -ForegroundColor Yellow
if (Test-Path "PUSH_TO_GITHUB_INSTRUCTIONS.txt") {
    $item = Get-Item "PUSH_TO_GITHUB_INSTRUCTIONS.txt"
    $savedSpace += $item.Length
    Remove-Item "PUSH_TO_GITHUB_INSTRUCTIONS.txt" -Force
    $deletedCount++
    Write-Host "  Deleted: PUSH_TO_GITHUB_INSTRUCTIONS.txt" -ForegroundColor Gray
}

# Summary
Write-Host "`n" + "="*60 -ForegroundColor Green
Write-Host "CLEANUP COMPLETE!" -ForegroundColor Green
Write-Host "="*60 -ForegroundColor Green
Write-Host "Files deleted: $deletedCount" -ForegroundColor Cyan
Write-Host "Space saved: $([math]::Round($savedSpace / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host "`nYour workspace is now cleaner and faster!" -ForegroundColor Yellow
Write-Host "="*60 -ForegroundColor Green
