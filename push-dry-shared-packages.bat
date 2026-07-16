@echo off
REM Push peek-a-boo dry/shared-packages to origin
REM Run from any directory on Windows

echo Pushing peek-a-boo dry/shared-packages...
git -C "C:\Users\mkupe\Code\system-b15\peek-a-boo" push origin dry/shared-packages
echo Done. Open a PR from dry/shared-packages -> master on GitHub.
pause
