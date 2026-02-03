@echo off
echo ========================================
echo نقل مجلد "New folder" للأرشيف
echo ========================================
echo.

echo هذا السكريبت سيقوم بـ:
echo 1. حذف الملفات المهملة من المجلد
echo 2. نقل المجلد للأرشيف
echo.

set /p confirm="هل تريد المتابعة؟ (Y/N): "

if /i "%confirm%"=="Y" (
    echo.
    echo المرحلة 1: حذف الملفات المهملة...
    
    cd "New folder"
    
    if exist "sublime_text_build_4143_x64_setup.exe" (
        del /q "sublime_text_build_4143_x64_setup.exe"
        echo ✅ تم حذف ملف Sublime Text
    )
    
    if exist "vymarkov.nodejs-devops-extension-pack-0.0.12.vsix" (
        del /q "vymarkov.nodejs-devops-extension-pack-0.0.12.vsix"
        echo ✅ تم حذف ملف VS Code Extension
    )
    
    if exist "config.php" (
        del /q "config.php"
        echo ✅ تم حذف ملف PHP
    )
    
    if exist "99b223a2_USstatetocity.csv" (
        del /q "99b223a2_USstatetocity.csv"
        echo ✅ تم حذف ملف CSV
    )
    
    if exist "node_modules" (
        rmdir /s /q "node_modules"
        echo ✅ تم حذف node_modules
    )
    
    if exist ".vscode" (
        rmdir /s /q ".vscode"
        echo ✅ تم حذف .vscode
    )
    
    cd ..
    
    echo.
    echo المرحلة 2: نقل المجلد للأرشيف...
    
    if not exist "archive\prototypes" (
        mkdir "archive\prototypes"
    )
    
    move "New folder" "archive\prototypes\geocore-community"
    
    if exist "archive\prototypes\geocore-community" (
        echo ✅ تم النقل بنجاح!
        echo المسار الجديد: archive\prototypes\geocore-community
        echo تم توفير ~225 MB من المساحة
    ) else (
        echo ❌ فشل النقل!
    )
) else (
    echo.
    echo تم الإلغاء. لم يتم تغيير أي شيء.
)

echo.
echo ========================================
echo للمزيد من المعلومات، راجع:
echo - NEW_FOLDER_ANALYSIS_REPORT.md
echo - تقرير_تحليل_المجلد_الخارجي.md
echo ========================================
echo.
pause
