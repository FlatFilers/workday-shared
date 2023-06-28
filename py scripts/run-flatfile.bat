@echo off
call npm i

REM Check for .env file in the parent directory
if not exist "%~dp0..\..\.env" (
  echo call python "%~dp0\Generate_API_Key_v3.py"
  call python "%~dp0\Generate_API_Key_v3.py"
)

call python "%~dp0\List_Environments_v2.py"
call python "%~dp0\Display_Environments_Numbered_List.py"

:input_env
set /p "environment_index=Enter the number of the environment: "
call python "%~dp0\Get_Environment_By_Index.py" %environment_index%

for /F %%i in (selected_environment.txt) do set "environment=%%i"
echo %environment%

call python "%~dp0\Check_Environment_Exists.py" %environment%

for /F %%i in (environment_exists.txt) do set "environment_exists=%%i"

if "%environment_exists%"=="0" (
  echo Environment not found. Please try again.
  goto input_env
)

call python "%~dp0\Read_Environment_Secret.py" %environment%
for /F %%i in (secret_key.txt) do set "environment_SECRET_KEY=%%i"

setlocal enabledelayedexpansion
echo y | call npx flatfile@latest develop
call npx flatfile@latest develop -k !environment_SECRET_KEY! ../index.js
endlocal