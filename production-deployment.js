#!/usr/bin/env node

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProductionDeploymentManager {
  constructor() {
    // Load configuration from file
    const configPath = path.join(__dirname, 'deployment-config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error('deployment-config.json not found. Please create the configuration file.');
    }

    const fullConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    this.environment = process.env.NODE_ENV || 'production';
    this.config = fullConfig[this.environment];

    if (!this.config) {
      throw new Error(`Environment '${this.environment}' not found in deployment-config.json`);
    }

    this.backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.deploymentConfig = fullConfig.deployment;
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

  async executeSSHCommand(command, description = '', retries = this.deploymentConfig.maxRetries) {
    const sshConfig = this.config.ssh;
    let sshCommand;

    if (sshConfig.password) {
      sshCommand = `sshpass -p "${sshConfig.password}" ssh -p ${sshConfig.port} -o StrictHostKeyChecking=no -o ConnectTimeout=30 ${sshConfig.username}@${sshConfig.host} "${command}"`;
    } else if (sshConfig.keyPath) {
      sshCommand = `ssh -i ${sshConfig.keyPath} -p ${sshConfig.port} -o StrictHostKeyChecking=no -o ConnectTimeout=30 ${sshConfig.username}@${sshConfig.host} "${command}"`;
    } else {
      throw new Error('No SSH authentication method configured (password or keyPath)');
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.log(`${description ? description + ': ' : ''}Executing (attempt ${attempt}/${retries}): ${command}`, 'info');
        const result = execSync(sshCommand, {
          encoding: 'utf8',
          maxBuffer: 1024 * 1024 * 10,
          timeout: 300000 // 5 minutes timeout
        });
        return result.trim();
      } catch (error) {
        this.log(`SSH command attempt ${attempt} failed: ${error.message}`, 'warning');

        if (attempt === retries) {
          this.log(`SSH command failed after ${retries} attempts`, 'error');
          throw new Error(`SSH command failed: ${error.message}`);
        }

        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, this.deploymentConfig.retryDelay));
      }
    }
  }

  async executeLocalCommand(command, cwd = null) {
    try {
      const options = { encoding: 'utf8', maxBuffer: 1024 * 1024 * 10 };
      if (cwd) options.cwd = cwd;

      const result = execSync(command, options);
      return result.trim();
    } catch (error) {
      this.log(`Local command failed: ${error.message}`, 'error');
      throw error;
    }
  }

  async setupSSHConnection() {
    this.log('🔧 Setting up SSH connection...', 'info');

    try {
      // Test SSH connection
      await this.executeSSHCommand('echo "SSH connection successful"', 'Testing SSH connection');
      this.log('✅ SSH connection established', 'success');
      return true;
    } catch (error) {
      this.log('❌ SSH connection failed', 'error');
      throw error;
    }
  }

  async checkNodeJSEnvironment() {
    this.log('🔍 Checking Node.js environment on production server...', 'info');

    try {
      const nodeVersion = await this.executeSSHCommand('node --version', 'Checking Node.js version');
      const npmVersion = await this.executeSSHCommand('npm --version', 'Checking npm version');

      this.log(`📦 Node.js version: ${nodeVersion}`, 'info');
      this.log(`📦 npm version: ${npmVersion}`, 'info');

      // Check if required Node.js version is available
      if (!nodeVersion.includes('v18') && !nodeVersion.includes('v20')) {
        this.log('⚠️  Node.js version might be outdated', 'warning');
      }

      return { nodeVersion, npmVersion };
    } catch (error) {
      this.log('❌ Node.js environment check failed', 'error');
      throw error;
    }
  }

  async createDatabaseBackup() {
    this.log('💾 Creating database backup...', 'info');

    try {
      const backupDir = `${this.config.remote.backupPath}/${this.backupTimestamp}`;
      const backupFile = `full_backup_${this.backupTimestamp}.sql`;

      // Create backup directory
      await this.executeSSHCommand(`mkdir -p ${backupDir}`, 'Creating backup directory');

      // Create database backup
      const backupCommand = `mysqldump -h ${this.config.database.host} -u ${this.config.database.user} -p'${this.config.database.password}' ${this.config.database.name} > ${backupDir}/${backupFile}`;
      await this.executeSSHCommand(backupCommand, 'Creating database backup');

      // Compress backup
      await this.executeSSHCommand(`cd ${backupDir} && gzip ${backupFile}`, 'Compressing backup');

      this.log(`✅ Database backup created: ${backupDir}/${backupFile}.gz`, 'success');
      return `${backupDir}/${backupFile}.gz`;
    } catch (error) {
      this.log('❌ Database backup failed', 'error');
      throw error;
    }
  }

  async syncProjectFiles() {
    this.log('📁 Syncing project files to production...', 'info');

    try {
      // Create rsync command for efficient file transfer
      const rsyncCommand = `rsync -avz --delete --exclude='node_modules' --exclude='.git' --exclude='logs' --exclude='uploads' -e "sshpass -p '${this.config.ssh.password}' ssh -p ${this.config.ssh.port} -o StrictHostKeyChecking=no" ./ ${this.config.ssh.username}@${this.config.ssh.host}:${this.config.remote.projectPath}/`;

      await this.executeLocalCommand(rsyncCommand, __dirname);
      this.log('✅ Project files synced successfully', 'success');
    } catch (error) {
      this.log('❌ File sync failed', 'error');
      throw error;
    }
  }

  async setupProductionEnvironment() {
    this.log('🏗️  Setting up production environment...', 'info');

    try {
      // Navigate to project directory
      const cdCommand = `cd ${this.config.remote.projectPath}`;

      // Install dependencies
      await this.executeSSHCommand(`${cdCommand} && npm install --production`, 'Installing production dependencies');

      // Create necessary directories
      await this.executeSSHCommand(`${cdCommand} && mkdir -p logs uploads/thumbnails uploads/originals uploads/optimized`, 'Creating necessary directories');

      // Set proper permissions
      await this.executeSSHCommand(`${cdCommand} && chmod +x *.js *.sh 2>/dev/null || true`, 'Setting executable permissions');

      this.log('✅ Production environment setup complete', 'success');
    } catch (error) {
      this.log('❌ Environment setup failed', 'error');
      throw error;
    }
  }

  async runMigrationSync() {
    this.log('🔄 Running migration synchronization...', 'info');

    try {
      const cdCommand = `cd ${this.config.remote.projectPath}`;

      // Run the migration sync script
      const migrationCommand = `${cdCommand} && node fix-migration-sync.js`;
      const result = await this.executeSSHCommand(migrationCommand, 'Running migration synchronization');

      this.log('✅ Migration synchronization completed', 'success');
      this.log(`📋 Migration output: ${result}`, 'info');

      return result;
    } catch (error) {
      this.log('❌ Migration synchronization failed', 'error');
      throw error;
    }
  }

  async runDatabaseMigrations() {
    this.log('🗃️  Running database migrations...', 'info');

    try {
      const cdCommand = `cd ${this.config.remote.projectPath}`;

      // Run Drizzle migrations
      const migrateCommand = `${cdCommand} && npm run db:migrate`;
      const result = await this.executeSSHCommand(migrateCommand, 'Running database migrations');

      this.log('✅ Database migrations completed', 'success');
      this.log(`📋 Migration output: ${result}`, 'info');

      return result;
    } catch (error) {
      this.log('❌ Database migrations failed', 'error');
      throw error;
    }
  }

  async buildApplication() {
    this.log('🔨 Building application...', 'info');

    try {
      const cdCommand = `cd ${this.config.remote.projectPath}`;

      // Build the server
      await this.executeSSHCommand(`${cdCommand} && npm run build:server`, 'Building server');

      // Build client if needed
      await this.executeSSHCommand(`${cdCommand} && npm run build`, 'Building client');

      this.log('✅ Application build completed', 'success');
    } catch (error) {
      this.log('❌ Application build failed', 'error');
      throw error;
    }
  }

  async restartApplication() {
    this.log('🔄 Restarting application...', 'info');

    try {
      const cdCommand = `cd ${this.config.remote.projectPath}`;

      // Stop existing application
      await this.executeSSHCommand(`${cdCommand} && npm stop 2>/dev/null || true`, 'Stopping existing application');

      // Start application
      await this.executeSSHCommand(`${cdCommand} && npm start`, 'Starting application');

      this.log('✅ Application restarted successfully', 'success');
    } catch (error) {
      this.log('❌ Application restart failed', 'error');
      throw error;
    }
  }

  async verifyDeployment() {
    this.log('🔍 Verifying deployment...', 'info');

    try {
      // Wait a moment for the application to start
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Check if application is running
      const processCheck = await this.executeSSHCommand('ps aux | grep node | grep -v grep', 'Checking if Node.js process is running');
      if (!processCheck.includes('node')) {
        throw new Error('Node.js application is not running');
      }

      // Test database connection
      const dbTestCommand = `mysql -h ${this.config.database.host} -u ${this.config.database.user} -p'${this.config.database.password}' -e "USE ${this.config.database.name}; SELECT COUNT(*) FROM users;"`;
      const dbResult = await this.executeSSHCommand(dbTestCommand, 'Testing database connection');
      this.log(`📊 Database test result: ${dbResult}`, 'info');

      // Check application health endpoint if available
      try {
        const healthCheck = await this.executeSSHCommand('curl -f http://localhost:3000/health 2>/dev/null || echo "Health endpoint not available"', 'Checking application health');
        this.log(`🏥 Health check result: ${healthCheck}`, 'info');
      } catch (error) {
        this.log('⚠️  Health endpoint check failed, but this might be normal', 'warning');
      }

      this.log('✅ Deployment verification completed successfully', 'success');
      return true;
    } catch (error) {
      this.log('❌ Deployment verification failed', 'error');
      throw error;
    }
  }

  async rollbackDeployment(backupPath) {
    this.log('🔙 Rolling back deployment...', 'warning');

    try {
      // Stop application
      await this.executeSSHCommand(`cd ${this.config.remote.projectPath} && npm stop 2>/dev/null || true`, 'Stopping application');

      // Restore database from backup
      if (backupPath) {
        const restoreCommand = `gunzip < ${backupPath} | mysql -h ${this.config.database.host} -u ${this.config.database.user} -p'${this.config.database.password}' ${this.config.database.name}`;
        await this.executeSSHCommand(restoreCommand, 'Restoring database from backup');
      }

      // Note: File rollback would require keeping a backup of the previous deployment
      this.log('⚠️  File rollback requires manual intervention - previous deployment backup needed', 'warning');

      this.log('✅ Rollback completed', 'success');
    } catch (error) {
      this.log('❌ Rollback failed', 'error');
      throw error;
    }
  }

  async runFullDeployment() {
    let backupPath = null;

    try {
      this.log('🚀 Starting full production deployment...', 'info');

      // Step 1: Setup SSH connection
      await this.setupSSHConnection();

      // Step 2: Check Node.js environment
      await this.checkNodeJSEnvironment();

      // Step 3: Create database backup
      backupPath = await this.createDatabaseBackup();

      // Step 4: Sync project files
      await this.syncProjectFiles();

      // Step 5: Setup production environment
      await this.setupProductionEnvironment();

      // Step 6: Run migration synchronization
      await this.runMigrationSync();

      // Step 7: Run database migrations
      await this.runDatabaseMigrations();

      // Step 8: Build application
      await this.buildApplication();

      // Step 9: Restart application
      await this.restartApplication();

      // Step 10: Verify deployment
      await this.verifyDeployment();

      this.log('🎉 Production deployment completed successfully!', 'success');
      this.log(`💾 Database backup available at: ${backupPath}`, 'info');

    } catch (error) {
      this.log(`💥 Deployment failed: ${error.message}`, 'error');

      // Attempt rollback if we have a backup
      if (backupPath) {
        try {
          await this.rollbackDeployment(backupPath);
        } catch (rollbackError) {
          this.log(`❌ Rollback also failed: ${rollbackError.message}`, 'error');
        }
      }

      throw error;
    }
  }

  async runHealthCheck() {
    this.log('🏥 Running health check...', 'info');

    try {
      await this.setupSSHConnection();

      // Check application status
      const appStatus = await this.executeSSHCommand('ps aux | grep node | grep -v grep', 'Checking application status');
      this.log(`📊 Application status: ${appStatus || 'No Node.js processes found'}`, 'info');

      // Check database connectivity
      const dbStatus = await this.executeSSHCommand(`mysql -h ${this.config.database.host} -u ${this.config.database.user} -p'${this.config.database.password}' -e "SELECT 1;"`, 'Checking database connectivity');
      this.log('✅ Database connection successful', 'success');

      // Check disk space
      const diskSpace = await this.executeSSHCommand('df -h', 'Checking disk space');
      this.log(`💾 Disk space:\n${diskSpace}`, 'info');

      this.log('✅ Health check completed successfully', 'success');

    } catch (error) {
      this.log(`❌ Health check failed: ${error.message}`, 'error');
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'deploy';

  const deploymentManager = new ProductionDeploymentManager();

  try {
    switch (command) {
      case 'deploy':
        await deploymentManager.runFullDeployment();
        break;

      case 'health':
        await deploymentManager.runHealthCheck();
        break;

      case 'backup':
        await deploymentManager.setupSSHConnection();
        const backupPath = await deploymentManager.createDatabaseBackup();
        console.log(`Backup created: ${backupPath}`);
        break;

      case 'sync':
        await deploymentManager.setupSSHConnection();
        await deploymentManager.syncProjectFiles();
        break;

      case 'migrate':
        await deploymentManager.setupSSHConnection();
        await deploymentManager.runMigrationSync();
        await deploymentManager.runDatabaseMigrations();
        break;

      default:
        console.log('Usage: node production-deployment.js [command]');
        console.log('Commands:');
        console.log('  deploy  - Run full production deployment');
        console.log('  health  - Run health check');
        console.log('  backup  - Create database backup only');
        console.log('  sync    - Sync files only');
        console.log('  migrate - Run migrations only');
        break;
    }
  } catch (error) {
    console.error('Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default ProductionDeploymentManager;