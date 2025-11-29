# Steps to Complete Services Move

## Current Issue
The `services/` folder cannot be moved because files are currently open in your IDE.

## Files You Need to Close

Based on your open documents, please close these files in your IDE:

1. ❌ `services/auth-service/.env`
2. ❌ `services/auth-service/seed-categories.bat`
3. ❌ `services/payment-service/src/controllers/escrow.controller.ts`
4. ❌ `services/payment-service/src/routes/escrow.routes.ts`

Also close:
- Any other files from the `services/` folder
- `scripts/run-seed-direct.js` (also open)
- `count.sql` (also open)

## Steps to Complete

### Option 1: Close Files in IDE
1. In your IDE, close ALL tabs/files from `services/` folder
2. Also close files from `scripts/` if any
3. Then I will run the move command again

### Option 2: Restart IDE
1. Save any unsaved work
2. Close your IDE completely
3. Reopen IDE
4. Don't open any files
5. Tell me when ready

### Option 3: Manual Move (If automated fails)
1. Close IDE completely
2. Manually move `services/` folder to `backend/` using File Explorer:
   - Cut: `E:\...\mnbara-platform\services\`
   - Paste into: `E:\...\mnbara-platform\backend\`
3. Reopen IDE

## After Moving Services

Once services are moved, we need to update `docker-compose.yml` paths:

```yaml
# Current path (will be wrong):
context: ./services/auth-service

# New path (correct):
context: ../backend/services/auth-service
```

## Ready to Continue?

Please choose an option above and let me know when files are closed or folder is moved.
