# Backup & Restore Testing Guide

## Overview

This guide explains how to test the backup and restore functionality in your MS Sport application. The system now includes:

✅ **Backup functionality** - Export all data as JSON  
✅ **Restore functionality** - Import data from backup  
✅ **Authentication & Authorization** - Admin-only access  
✅ **Data validation** - Backup format verification  
✅ **Error handling** - Graceful failure management  

## Features Implemented

### Backup (GET /api/backup)
- Exports all major data tables: users, products, shops, inventory, invoices, customers, categories, suppliers
- Includes metadata: timestamp, version for compatibility
- Requires admin permissions
- Downloads as JSON file

### Restore (POST /api/backup) 
- Imports data from backup JSON
- Validates backup format and version compatibility
- Performs complete database transaction (all-or-nothing)
- Requires admin permissions
- Preserves data integrity with foreign key constraints

## Testing Methods

### Method 1: Manual UI Testing (Recommended)

1. **Start your application**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. **Login as admin user**
   - Go to `http://localhost:3000/login`
   - Login with admin credentials

3. **Navigate to Settings**
   - Go to `http://localhost:3000/settings`
   - Click on "System Settings" tab

4. **Test Backup**
   - Click "Generate Backup" button
   - Verify file downloads as `mssports-backup.json`
   - Check file contains valid JSON with your data

5. **Test Restore**
   - Select the downloaded backup file using "Choose File"
   - Click "Restore Backup" button
   - Verify success message appears
   - Check that data is restored correctly

### Method 2: Automated Testing Script

1. **Install dependencies**
   ```bash
   npm install node-fetch
   ```

2. **Get admin token**
   - Login to your app as admin
   - Open browser developer tools
   - Check localStorage or sessionStorage for auth token
   - Copy the token value

3. **Run automated tests**
   ```bash
   # Set your admin token
   export ADMIN_TOKEN="your-actual-admin-token-here"
   
   # Run all tests
   node scripts/test-backup-restore.js full
   
   # Or run specific tests
   node scripts/test-backup-restore.js backup   # Test backup only
   node scripts/test-backup-restore.js restore  # Test restore only
   ```

### Method 3: Integration Testing with Jest

1. **Run the comprehensive test suite**
   ```bash
   npm test tests/integration/backupRestore.test.ts
   ```

## Test Scenarios Covered

### ✅ Authentication & Authorization
- [x] Admin users can backup and restore
- [x] Non-admin users are rejected (403)
- [x] Unauthenticated requests are rejected (401)
- [x] Invalid tokens are rejected (401)

### ✅ Backup Functionality
- [x] Backup generates valid JSON with all data
- [x] Backup includes metadata (timestamp, version)
- [x] Backup includes all major tables
- [x] Backup respects foreign key relationships
- [x] Download headers are set correctly

### ✅ Restore Functionality  
- [x] Valid backup data restores successfully
- [x] Invalid JSON format is rejected (400)
- [x] Invalid backup structure is rejected (400)
- [x] Incompatible version is rejected (400)
- [x] Database transaction maintains integrity
- [x] Foreign key constraints are respected

### ✅ Error Handling
- [x] Database connection issues handled gracefully
- [x] Transaction failures rollback properly
- [x] Partial restore failures are prevented
- [x] Meaningful error messages provided

### ✅ Data Integrity
- [x] End-to-end backup → restore → verify cycle
- [x] Relationships maintained after restore
- [x] Data counts match before/after restore
- [x] Large dataset handling

## Expected Test Results

When testing manually or with the automated script, you should see:

### Successful Backup
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0",
  "users": [...],
  "products": [...],
  "shops": [...],
  "inventoryItems": [...],
  "invoices": [...],
  "customers": [...],
  "categories": [...],
  "suppliers": [...]
}
```

### Successful Restore
```json
{
  "success": true,
  "message": "Database restored successfully",
  "restoredCounts": {
    "users": 0,
    "products": 25,
    "shops": 0,
    "inventoryItems": 150,
    "invoices": 45,
    "customers": 30,
    "categories": 8,
    "suppliers": 12
  }
}
```

## Common Issues & Solutions

### ❌ "Insufficient permissions - Admin required"
**Cause**: User doesn't have admin role or `admin:all` permission  
**Solution**: Ensure you're logged in as an admin user

### ❌ "Invalid or expired token"
**Cause**: Authentication token is invalid or expired  
**Solution**: Re-login to get a fresh token

### ❌ "Backup version incompatible"
**Cause**: Trying to restore a backup from different version  
**Solution**: Use a backup created with the same app version

### ❌ "Failed to restore backup: Foreign key constraint violation"
**Cause**: Data references non-existent records  
**Solution**: Ensure backup data is complete and consistent

### ❌ "No authorization token provided"
**Cause**: Missing Authorization header  
**Solution**: Add `Authorization: Bearer <token>` header

## Performance Expectations

The backup and restore functionality should perform within these limits:

- **Backup generation**: < 10 seconds for typical datasets (< 10,000 records)
- **Restore operation**: < 15 seconds for typical datasets  
- **Memory usage**: Should not exceed 500MB for typical datasets
- **File size**: JSON backup typically 10-50MB for typical business data

## Security Considerations

⚠️ **Important Security Notes**:

1. **Admin-only access**: Only users with `admin:all` permission or `admin` role can backup/restore
2. **Data exposure**: Backup files contain ALL business data - handle securely
3. **Database overwrite**: Restore DELETES existing data - use with extreme caution
4. **No users/shops restore**: Users and shops are preserved to maintain system integrity

## Next Steps

After confirming the backup and restore functionality works:

1. **Set up regular backups** - Consider automated daily/weekly backups
2. **Secure backup storage** - Store backups in secure, encrypted location  
3. **Test disaster recovery** - Practice full restore procedures
4. **Document procedures** - Create operational runbooks for your team
5. **Monitor performance** - Track backup/restore times as data grows

## Troubleshooting

If tests fail, check:

1. **Application is running** on http://localhost:3000
2. **Database is accessible** and contains some test data
3. **Admin user exists** with proper permissions
4. **Authentication is working** in the UI
5. **No firewall/proxy issues** blocking API requests
6. **Sufficient disk space** for backup files

For additional help, check the application logs or create test data through the UI before running backup tests. 