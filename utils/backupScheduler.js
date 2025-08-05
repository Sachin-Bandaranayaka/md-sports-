const cron = require('node-cron');
const fs = require('fs-extra');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function loadSettings() {
  const keys = [
    'db_backup_schedule',
    'db_backup_time',
    'db_backup_location',
    'db_backup_retention',
  ];
  const entries = await prisma.systemSettings.findMany({
    where: { key: { in: keys } },
  });
  const map = {};
  for (const e of entries) {
    map[e.key] = e.value;
  }
  return {
    schedule: map['db_backup_schedule'] || 'Daily',
    time: map['db_backup_time'] || '00:00',
    location: map['db_backup_location'] || './backups',
    retention: parseInt(map['db_backup_retention'] || '7', 10),
  };
}

function buildCronExpression(schedule, time) {
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10) || 0;
  const minute = parseInt(minuteStr, 10) || 0;
  switch (schedule) {
    case 'Hourly':
      return `${minute} * * * *`;
    case 'Daily':
      return `${minute} ${hour} * * *`;
    case 'Weekly':
      return `${minute} ${hour} * * 0`; // every Sunday
    case 'Monthly':
      return `${minute} ${hour} 1 * *`; // first day of month
    default:
      return `${minute} ${hour} * * *`;
  }
}

async function generateBackup(dir) {
  await fs.ensureDir(dir);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(dir, `backup-${timestamp}.json`);
  const data = {
    timestamp: new Date().toISOString(),
    version: '1.0',
    users: await prisma.user.findMany(),
    products: await prisma.product.findMany(),
    shops: await prisma.shop.findMany(),
    inventoryItems: await prisma.inventoryItem.findMany(),
    invoices: await prisma.invoice.findMany(),
    customers: await prisma.customer.findMany(),
    categories: await prisma.category.findMany(),
    suppliers: await prisma.supplier.findMany(),
  };
  await fs.writeJson(filePath, data, { spaces: 2 });
  console.log(`[BackupScheduler] Backup saved at ${filePath}`);
}

async function cleanupOldBackups(dir, retentionDays) {
  if (retentionDays <= 0) return;
  const files = await fs.readdir(dir);
  const now = Date.now();
  const cutoff = retentionDays * 24 * 60 * 60 * 1000;
  for (const file of files) {
    if (!file.startsWith('backup-') || !file.endsWith('.json')) continue;
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (now - stat.mtimeMs > cutoff) {
      await fs.remove(filePath);
      console.log(`[BackupScheduler] Removed old backup ${file}`);
    }
  }
}

async function scheduleBackups() {
  const settings = await loadSettings();
  const cronExpr = buildCronExpression(settings.schedule, settings.time);
  console.log(`[BackupScheduler] Scheduling backups with cron: ${cronExpr}`);
  cron.schedule(cronExpr, async () => {
    try {
      await generateBackup(settings.location);
      await cleanupOldBackups(settings.location, settings.retention);
    } catch (err) {
      console.error('[BackupScheduler] Error during scheduled backup', err);
    }
  });
}

module.exports = { scheduleBackups };