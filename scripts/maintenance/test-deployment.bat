@echo off
echo Starting mnbarh Platform Test Deployment...
echo.

echo 1. Starting Backend Service...
start "Backend" cmd /k "cd backend\services\listing-service-node && node index.js"

echo 2. Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo 3. Testing backend health...
curl -s http://localhost:10000/health
echo.

echo 4. Testing products API...
curl -s http://localhost:10000/api/products
echo.

echo 5. Starting Frontend Preview...
start "Frontend" cmd /k "cd frontend\web-app && node preview.js"

echo.
echo ✅ Deployment test complete!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:10000
echo 📊 Health: http://localhost:10000/health
echo 🛍️  Products: http://localhost:10000/api/products
echo.
echo Press any key to continue...
pause > nul