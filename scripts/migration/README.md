# Migration Scripts

Scripts for database and system migrations.

## Scripts

- `migrate_databases.bat` - Database migration script
- `quick-migrate.ps1` - Quick migration procedure
- `safe-migration.ps1` - Safe migration with rollback support

## Usage

```powershell
# Quick migration
.\quick-migrate.ps1

# Safe migration with verification
.\safe-migration.ps1

# Full database migration
.\migrate_databases.bat
```

## Notes

- Always backup before running migrations
- Use `safe-migration.ps1` for production environments
