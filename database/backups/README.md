# Database Backups

This directory contains backups of the business_directory table before major changes.

## Backup Files

- `business_directory_backup_*.json` - Full JSON export of all businesses
- Created before category normalization on remote database

## Restore Instructions

If needed, restore from backup:

```bash
# View backup
cat database/backups/business_directory_backup_YYYYMMDD_HHMMSS.json

# To restore (if needed), contact database admin
```

## Backup Date

Last backup: $(date)
Total businesses backed up: 304
