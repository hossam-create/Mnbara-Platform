@echo off
echo ========================================
echo تنظيف مجلد "New folder"
echo ========================================
echo.

echo هذا السكريبت سيحذف مجلد "New folder" بالكامل
echo المجلد يحتوي على:
echo - مشروع React تجريبي (GeoCore Community)
echo - ملفات مهملة (exe, vsix, php, csv)
echo - node_modules (~200 MB)
echo.
echo الحجم الإجمالي: ~230 MB
echo.

set /p confirm="هل أنت متأكد من الحذف؟ (Y/N): "

if /i "%confirm%"=="Y" (
    echo.
    echo جاري الحذف...
    rmdir /s /q "New folder"
    
    if exist "New folder" (
        echo ❌ فشل الحذف! تأكد من إغلاق أي ملفات مفتوحة من المجلد
    ) else (
        echo ✅ تم الحذف بنجاح!
        echo تم توفير ~230 MB من المساحة
    )
) else (
    echo.
    echo تم الإلغاء. لم يتم حذف أي شيء.
)

echo.
echo ========================================
echo للمزيد من المعلومات، راجع:
echo - NEW_FOLDER_ANALYSIS_REPORT.md
echo - تقرير_تحليل_المجلد_الخارجي.md
echo ========================================
echo.
pause
