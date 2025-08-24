export class EnvironmentConfigService {
  private static readonly ENV = process.env.NODE_ENV || 'development';
  private static readonly CONFIGS = {
    production: {
      securityLevel: 'high',
      debugMode: false,
      httpOnlyCookies: true,
      secureCookies: true,
      corsOrigin: ['https://production-domain.com']
    },
    staging: {
      securityLevel: 'medium',
      debugMode: false,
      httpOnlyCookies: true,
      secureCookies: true,
      corsOrigin: ['https://staging-domain.com']
    },
    development: {
      securityLevel: 'low',
      debugMode: true,
      httpOnlyCookies: false,
      secureCookies: false,
      corsOrigin: ['http://localhost:3000']
    },
    test: {
      securityLevel: 'medium',
      debugMode: false,
      httpOnlyCookies: true,
      secureCookies: false,
      corsOrigin: ['*']
    }
  };

  static get currentConfig() {
    return this.CONFIGS[this.ENV as keyof typeof this.CONFIGS] || this.CONFIGS.development;
  }

  static isProduction() {
    return this.ENV === 'production';
  }

  static validateSecuritySettings() {
    if (this.isProduction() && this.currentConfig.securityLevel !== 'high') {
      throw new Error('Production environment must use high security level');
    }
  }
}