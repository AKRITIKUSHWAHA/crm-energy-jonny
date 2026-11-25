@echo off
title Push CRM Energy to GitHub (AKRITIKUSHWAHA)
color 0a
echo =========================================================
echo   Pushing All Commits to GitHub (AKRITIKUSHWAHA)
echo =========================================================
echo.

cd /d "F:\akriti\kiaan work\crm-energy-jonny\crm-energy-jonny"

echo Setting Git Author to Akriti Kushwaha...
git config user.name "Akriti Kushwaha"
git config user.email "akritikushwaha@users.noreply.github.com"

echo.
echo Checking Git status...
git status -s

echo.
echo Pushing to origin main...
git push origin main --force-with-lease

echo.
echo =========================================================
echo Process finished.
echo =========================================================
pause
