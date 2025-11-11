@echo off

REM --- Script Arguments ---
REM %1 is the full path to the input image (e.g., "input.png")
REM %2 is the desired output name prefix (e.g., "output-image")
SET "INPUT_FILE=%~1"
SET "OUTPUT_PREFIX=%~2"

REM Check if arguments are provided
IF "%INPUT_FILE%"=="" GOTO :USAGE
IF "%OUTPUT_PREFIX%"=="" GOTO :USAGE

REM --- Configuration ---
REM A solid, general-purpose list of widths for your srcset
SET "WIDTHS=360 720 1024 1440 1920"

REM --- Processing ---
echo Processing %INPUT_FILE%...
echo Output prefix is: %OUTPUT_PREFIX%

REM Loop over each width and create the WebP image
FOR %%W IN (%WIDTHS%) DO (
  echo  - Generating %%Wpx wide version...
  
  magick "%INPUT_FILE%" ^
    -resize %%Wx ^
    -alpha off ^
    -quality 80 ^
    -define webp:method=6 ^
    -define webp:sns-strength=80 ^
    -define webp:pass=10 ^
    "%OUTPUT_PREFIX%-%%W.webp"
)

echo All images processed!
GOTO :EOF

REM --- Help Section ---
:USAGE
echo.
echo ERROR: Missing arguments.
echo.
echo Usage: %0 [InputFile] [OutputPrefix]
echo.
echo Example:
echo   %0 "source/photo.png" "dist/img/photo"
echo.
echo This will create:
echo   dist/img/photo-360.webp
echo   dist/img/photo-720.webp
echo   ...etc.
echo.

:EOF