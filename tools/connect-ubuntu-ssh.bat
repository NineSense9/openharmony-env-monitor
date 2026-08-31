@echo off
setlocal EnableExtensions
title Ubuntu SSH

set "VBOXMANAGE=C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
set "VM=Ubuntu"
set "SSH_HOST=127.0.0.1"
set "SSH_PORT=2222"
set "SSH_USER=lzdz"

if not exist "%VBOXMANAGE%" (
    echo [ERROR] VirtualBox was not found: "%VBOXMANAGE%"
    pause
    exit /b 1
)

set "STATEFILE=%TEMP%\ubuntu-vm-state.txt"
set "VMSTATE="
"%VBOXMANAGE%" showvminfo "%VM%" --machinereadable > "%STATEFILE%" 2>nul
for /f "tokens=2 delims==" %%S in ('findstr /B /C:"VMState=" "%STATEFILE%"') do set "VMSTATE=%%~S"
del /q "%STATEFILE%" >nul 2>&1

if not defined VMSTATE (
    echo [ERROR] Could not read the Ubuntu VM state.
    pause
    exit /b 1
)

if /I "%VMSTATE%"=="paused" (
    echo Resuming paused Ubuntu...
    "%VBOXMANAGE%" controlvm "%VM%" resume
) else if /I not "%VMSTATE%"=="running" (
    echo Starting Ubuntu in headless mode...
    "%VBOXMANAGE%" startvm "%VM%" --type headless
    if errorlevel 1 (
        echo [ERROR] Ubuntu failed to start.
        pause
        exit /b 1
    )
    timeout /t 5 /nobreak >nul
)

echo Connecting to %SSH_USER%@%SSH_HOST%:%SSH_PORT% ...
ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL -p %SSH_PORT% %SSH_USER%@%SSH_HOST%

echo.
echo SSH session ended.
pause
