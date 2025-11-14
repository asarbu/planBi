@echo off
REM Batch script to convert all JPGs in images\botez using convert.bat
setlocal enabledelayedexpansion

set "IMGDIR=%~dp0botez"
set "CONVERT=%~dp0convert.bat"

for %%F in ("%IMGDIR%\*.jpg") do (
    set "IMG=%%~fF"
    set "NAME=%%~nF"
    call "%CONVERT%" "!IMG!" !NAME!
)
