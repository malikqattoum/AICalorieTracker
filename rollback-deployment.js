#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DeploymentRollbackManager {
  constructor() {
    this.config = JSON.parse(fs.readFileSync(path.join(__dirname, 'deployment-config.json'), 'utf8'));
    this.environment = process.env.NODE_ENV || 'production';
    this.envConfig = this.config[this.environment];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async executeSSHCommand(command, description = '') {
    const sshConfig = this.envConfig.ssh;
    const sshCommand = `sshpass -p "${sshConfig.password}" ssh -p ${sshConfig.port} -o StrictHostKeyChecking=no ${sshConfig.username}@${sshConfig.host} "${command}"`;

    try {
      this.log(`${description ? description + ': ' : ''}Executing: ${command}`, 'info');
      const result = execSync(sshCommand, { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 });
      return result.trim();
    } catch (error) {
      this.log(`SSH command failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async findLatestBackup() {
    this.log('🔍 Finding latest database backup...', 'info');

    try {
      const backupDir = this.envConfig.remote.backupPath;
      const listCommand = `ls -la ${backupDir}/*.sql.gz 2>/dev/null | head -5`;

      const result = await this.executeSSHCommand(listCommand, 'Listing backup files');
      const lines = result.split('\n').filter(line => line.includes('.sql.gz'));

      if (lines.length === 0) {
        throw new Error('No backup files found');
      }

      // Parse the latest backup file
      const latestBackup = lines[0].split(/\s+/).pop();
      this.log(`📁 Latest backup found: ${latestBackup}`, 'info');

      return `${backupDir}/${latestBackup}`;
    } catch (error) {
      this.log('❌ Could not find backup files', 'error');
      throw error;
    }
  }

  async stopApplication() {
    this.log('🛑 Stopping application...', 'info');

    try {
      const cdCommand = `cd ${this.envConfig.remote.projectPath}`;

      // Try to stop gracefully first
      await this.executeSSHCommand(`${cdCommand} && npm stop 2>/dev/null || true`, 'Stopping application gracefully');

      // Force kill any remaining Node.js processes
      await this.executeSSHCommand(`pkill -f "node.*dist/index.js" || true`, 'Force killing Node.js processes');

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Verify application is stopped
      const checkProcess = await this.executeSSHCommand('ps aux | grep node | grep -v grep', 'Checking for remaining processes');
      if (checkProcess) {
        this.log('⚠️  Some Node.js processes may still be running', 'warning');
      } else {
        this.log('✅ Application stopped successfully', 'success');
      }
    } catch (error) {
      this.log('❌ Failed to stop application', 'error');
      throw error;
    }
  }

  async restoreDatabase(backupPath) {
    this.log('💾 Restoring database from backup...', 'info');

    try {
      const dbConfig = this.envConfig.database;

      // Create a temporary SQL file for restoration
      const tempSqlFile = `/tmp/restore_${Date.now()}.sql`;

      // Decompress and restore
      const restoreCommand = `
        gunzip < ${backupPath} > ${tempSqlFile} &&
        mysql -h ${dbConfig.host} -u ${dbConfig.user} -p'${dbConfig.password}' ${dbConfig.name} < ${tempSqlFile} &&
        rm ${tempSqlFile}
      `;

      await this.executeSSHCommand(restoreCommand, 'Restoring database');

      this.log('✅ Database restored successfully', 'success');
    } catch (error) {
      this.log('❌ Database restoration failed', 'error');
      throw error;
    }
  }

  async restoreApplicationFiles() {
    this.log('📁 Restoring application files...', 'info');

    try {
      const projectPath = this.envConfig.remote.projectPath;

      // Check if there's a previous deployment backup
      const backupCheck = await this.executeSSHCommand(`ls -la ${projectPath}.backup.* 2>/dev/null | head -1`, 'Checking for file backups');

      if (backupCheck) {
        const backupDir = backupCheck.split(/\s+/).pop();
        this.log(`📦 Found file backup: ${backupDir}`, 'info');

        // Restore files
        await this.executeSSHCommand(`cp -r ${backupDir}/* ${projectPath}/`, 'Restoring application files');

        this.log('✅ Application files restored', 'success');
      } else {
        this.log('⚠️  No file backup found, skipping file restoration', 'warning');
      }
    } catch (error) {
      this.log('❌ File restoration failed', 'error');
      throw error;
    }
  }

  async restartApplication() {
    this.log('🔄 Restarting application...', 'info');

    try {
      const cdCommand = `cd ${this.envConfig.remote.projectPath}`;

      // Start the application
      await this.executeSSHCommand(`${cdCommand} && npm start`, 'Starting application');

      // Wait for startup
      await new Promise(resolve => setTimeout(resolve, 10000));

      // Verify application is running
      const checkProcess = await this.executeSSHCommand('ps aux | grep node | grep -v grep', 'Verifying application startup');
      if (checkProcess) {
        this.log('✅ Application restarted successfully', 'success');
      } else {
        throw new Error('Application failed to start after rollback');
      }
    } catch (error) {
      this.log('❌ Application restart failed', 'error');
      throw error;
    }
  }

  async verifyRollback() {
    this.log('🔍 Verifying rollback...', 'info');

    try {
      const dbConfig = this.envConfig.database;

      // Test database connection
      const dbTest = await this.executeSSHCommand(`mysql -h ${dbConfig.host} -u ${dbConfig.user} -p'${dbConfig.password}' -e "SELECT 1 FROM users LIMIT 1;"`, 'Testing database connection');
      this.log('✅ Database connection verified', 'success');

      // Test application health
      try {
        const healthCheck = await this.executeSSHCommand(`curl -f http://localhost:${this.envConfig.application.port}${this.envConfig.application.healthEndpoint} 2>/dev/null || echo "Health check failed"`, 'Testing application health');
        if (healthCheck.includes('Health check failed')) {
          this.log('⚠️  Health check failed, but application may still be functional', 'warning');
        } else {
          this.log('✅ Application health verified', 'success');
        }
      } catch (error) {
        this.log('⚠️  Health check not available', 'warning');
      }

      this.log('✅ Rollback verification completed', 'success');
    } catch (error) {
      this.log('❌ Rollback verification failed', 'error');
      throw error;
    }
  }

  async performFullRollback() {
    try {
      this.log('🔙 Starting full rollback procedure...', 'warning');

      // Step 1: Find latest backup
      const backupPath = await this.findLatestBackup();

      // Step 2: Stop application
      await this.stopApplication();

      // Step 3: Restore database
      await this.restoreDatabase(backupPath);

      // Step 4: Restore application files (if available)
      await this.restoreApplicationFiles();

      // Step 5: Restart application
      await this.restartApplication();

      // Step 6: Verify rollback
      await this.verifyRollback();

      this.log('🎉 Rollback completed successfully!', 'success');
      this.log(`💾 Database restored from: ${backupPath}`, 'info');

    } catch (error) {
      this.log(`💥 Rollback failed: ${error.message}`, 'error');
      this.log('🚨 MANUAL INTERVENTION REQUIRED', 'error');
      throw error;
    }
  }

  async createEmergencyBackup() {
    this.log('🚨 Creating emergency backup before rollback...', 'warning');

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = `${this.envConfig.remote.backupPath}/emergency_${timestamp}`;
      const dbConfig = this.envConfig.database;

      // Create backup directory
      await this.executeSSHCommand(`mkdir -p ${backupDir}`, 'Creating emergency backup directory');

      // Create database backup
      const backupCommand = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} -p'${dbConfig.password}' ${dbConfig.name} > ${backupDir}/emergency_backup.sql`;
      await this.executeSSHCommand(backupCommand, 'Creating emergency database backup');

      // Compress backup
      await this.executeSSHCommand(`cd ${backupDir} && gzip emergency_backup.sql`, 'Compressing emergency backup');

      const backupPath = `${backupDir}/emergency_backup.sql.gz`;
      this.log(`✅ Emergency backup created: ${backupPath}`, 'success');

      return backupPath;
    } catch (error) {
      this.log('❌ Emergency backup failed', 'error');
      throw error;
    }
  }

  async showRollbackStatus() {
    this.log('📊 Rollback Status Information', 'info');

    try {
      // Show available backups
      const backupList = await this.executeSSHCommand(`ls -la ${this.envConfig.remote.backupPath}/*.sql.gz 2>/dev/null | wc -l`, 'Counting available backups');
      this.log(`📁 Available backups: ${backupList.trim()}`, 'info');

      // Show latest backup
      const latestBackup = await this.executeSSHCommand(`ls -la ${this.envConfig.remote.backupPath}/*.sql.gz 2>/dev/null | head -1`, 'Finding latest backup');
      if (latestBackup) {
        this.log(`📦 Latest backup: ${latestBackup.split(/\s+/).pop()}`, 'info');
      }

      // Show application status
      const appStatus = await this.executeSSHCommand('ps aux | grep node | grep -v grep | wc -l', 'Checking application status');
      this.log(`🚀 Running Node.js processes: ${appStatus.trim()}`, 'info');

      // Show database status
      const dbConfig = this.envConfig.database;
      const dbStatus = await this.executeSSHCommand(`mysql -h ${dbConfig.host} -u ${dbConfig.user} -p'${dbConfig.password}' -e "SELECT 1;" 2>/dev/null && echo "Connected" || echo "Failed"`, 'Checking database status');
      this.log(`🗃️  Database status: ${dbStatus.trim()}`, 'info');

    } catch (error) {
      this.log('❌ Could not retrieve rollback status', 'error');
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'rollback';

  const rollbackManager = new DeploymentRollbackManager();

  try {
    switch (command) {
      case 'rollback':
        await rollbackManager.performFullRollback();
        break;

      case 'status':
        await rollbackManager.showRollbackStatus();
        break;

      case 'emergency-backup':
        const backupPath = await rollbackManager.createEmergencyBackup();
        console.log(`Emergency backup created: ${backupPath}`);
        break;

      default:
        console.log('Usage: node rollback-deployment.js [command]');
        console.log('Commands:');
        console.log('  rollback         - Perform full rollback');
        console.log('  status           - Show rollback status');
        console.log('  emergency-backup - Create emergency backup');
        break;
    }
  } catch (error) {
    console.error('Rollback operation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default DeploymentRollbackManager;