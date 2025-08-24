import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Configuration interface
interface Config {
  nodeEnv: string;
  port: number;
  host: string;
  database: {
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
    ssl: boolean;
    connectionLimit: number;
  };
  jwt: {
    secret: string;
    expiresIn: string;
    refreshExpiresIn: string;
  };
  ai: {
    openai: {
      apiKey: string;
      model: string;
      maxTokens: number;
      temperature: number;
    };
    anthropic: {
      apiKey: string;
      model: string;
      maxTokens: number;
    };
  };
  externalApis: {
    nutritionix: {
      appId: string;
      appKey: string;
      baseUrl: string;
    };
    spoonacular: {
      apiKey: string;
      baseUrl: string;
    };
    openfoodfacts: {
      baseUrl: string;
    };
    weather: {
      apiKey: string;
      baseUrl: string;
    };
  };
  payment: {
    stripe: {
      secretKey: string;
      publishableKey: string;
      webhookSecret: string;
    };
  };
  storage: {
    aws: {
      accessKeyId: string;
      secretAccessKey: string;
      region: string;
      bucket: string;
    };
    local: {
      enabled: boolean;
      path: string;
    };
  };
  email: {
    sendgrid: {
      apiKey: string;
      from: string;
    };
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
    };
  };
  pushNotifications: {
    firebase: {
      serviceAccountPath: string;
      serverKey: string;
    };
  };
  security: {
    bcryptRounds: number;
    jwtAlgorithm: string;
    cors: {
      origin: string | string[];
      credentials: boolean;
    };
    rateLimit: {
      windowMs: number;
      max: number;
    };
  };
  monitoring: {
    sentry: {
      dsn: string;
      environment: string;
    };
    prometheus: {
      enabled: boolean;
      port: number;
    };
    logging: {
      level: string;
      file: string;
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
}

// Configuration object
const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    name: process.env.DB_NAME || 'aicalorietracker',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    ssl: process.env.DB_SSL === 'true',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'gpt-4',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10),
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
    },
    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY || '',
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '1000', 10),
    },
  },
  
  externalApis: {
    nutritionix: {
      appId: process.env.NUTRITIONIX_APP_ID || '',
      appKey: process.env.NUTRITIONIX_APP_KEY || '',
      baseUrl: process.env.NUTRITIONIX_BASE_URL || 'https://trackapi.nutritionix.com',
    },
    spoonacular: {
      apiKey: process.env.SPOONACULAR_API_KEY || '',
      baseUrl: process.env.SPOONACULAR_BASE_URL || 'https://api.spoonacular.com',
    },
    openfoodfacts: {
      baseUrl: process.env.OPENFOODFACTS_BASE_URL || 'https://world.openfoodfacts.org',
    },
    weather: {
      apiKey: process.env.WEATHER_API_KEY || '',
      baseUrl: process.env.WEATHER_BASE_URL || 'https://api.openweathermap.org/data/2.5',
    },
  },
  
  payment: {
    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY || '',
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
  },
  
  storage: {
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.AWS_S3_BUCKET || '',
    },
    local: {
      enabled: process.env.LOCAL_STORAGE_ENABLED === 'true',
      path: process.env.LOCAL_STORAGE_PATH || './uploads',
    },
  },
  
  email: {
    sendgrid: {
      apiKey: process.env.SENDGRID_API_KEY || '',
      from: process.env.EMAIL_FROM || 'noreply@aicalorietracker.com',
    },
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
    },
  },
  
  pushNotifications: {
    firebase: {
      serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json',
      serverKey: process.env.FIREBASE_SERVER_KEY || '',
    },
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    jwtAlgorithm: process.env.JWT_ALGORITHM || 'HS256',
    cors: {
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
      credentials: process.env.CORS_CREDENTIALS !== 'false',
    },
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    },
  },
  
  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      environment: process.env.NODE_ENV || 'development',
    },
    prometheus: {
      enabled: process.env.PROMETHEUS_ENABLED === 'true',
      port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      file: process.env.LOG_FILE || 'logs/app.log',
    },
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },
};

// Validate required configuration
const validateConfig = (): void => {
  const requiredEnvVars = [
    'JWT_SECRET',
    'OPENAI_API_KEY',
    'STRIPE_SECRET_KEY',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate database configuration
  if (!config.database.name) {
    throw new Error('Database name is required');
  }
  
  // Validate JWT configuration
  if (!config.jwt.secret) {
    throw new Error('JWT secret is required');
  }
  
  // Validate AI configuration
  if (!config.ai.openai.apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  // Validate payment configuration
  if (!config.payment.stripe.secretKey) {
    throw new Error('Stripe secret key is required');
  }
};

// Validate configuration on startup
try {
  validateConfig();
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}

export { config, validateConfig };
export default config;