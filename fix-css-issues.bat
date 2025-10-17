@echo off
echo Fixing CSS issues...

echo Backing up original files...
copy src\index.tsx src\index.tsx.bak
copy src\App.tsx src\App.tsx.bak

echo Applying fixes...
copy src\index.tsx.fix src\index.tsx
copy src\App.tsx.fix src\App.tsx

echo Stopping any running servers...
taskkill /f /im node.exe

echo Clearing cache...
rmdir /s /q node_modules\.cache

echo Done! Run 'npm start' to test the changes.
