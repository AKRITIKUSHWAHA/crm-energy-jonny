@echo off
title Push CRM Energy to GitHub
color 0a
echo =========================================================
echo   Pushing All Commits to GitHub (AKRITIKUSHWAHA)
echo =========================================================
echo.

cd /d "F:\akriti\kiaan work\crm-energy-jonny\crm-energy-jonny"

echo Checking Git status...
git status -s

echo.
echo Pushing to origin main...
echo Browser me GitHub authorization popup aayega to "Authorize" click kr dena.
echo.

git push origin main

echo.
echo =========================================================
echo Process finished.
echo =========================================================
pause

