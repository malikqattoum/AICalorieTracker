/**
 * Deployment configuration for the AICalorieTracker application
 * This file contains all deployment-specific settings and configurations
 */

export const deploymentConfig = {
  // Docker configuration
  docker: {
    // Docker image settings
    image: {
      name: 'aic-calorie-tracker',
      tag: process.env.DOCKER_TAG || 'latest',
      buildContext: '.',
      dockerfile: 'Dockerfile',
      args: {
        NODE_ENV: 'production',
        PORT: '3000'
      }
    },
    
    // Docker container settings
    container: {
      name: 'aic-calorie-tracker',
      restart: 'unless-stopped',
      memory: '2g',
      cpus: '1.0',
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: process.env.DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY
      },
      volumes: [
        './logs:/app/logs',
        './uploads:/app/uploads'
      ],
      ports: ['3000:3000'],
      networks: ['aic-network']
    }
  },
  
  // Kubernetes configuration
  kubernetes: {
    // Kubernetes namespace
    namespace: 'aic-calorie-tracker',
    
    // Kubernetes deployment
    deployment: {
      name: 'aic-calorie-tracker',
      replicas: 3,
      strategy: {
        type: 'RollingUpdate',
        rollingUpdate: {
          maxSurge: 1,
          maxUnavailable: 0
        }
      },
      template: {
        metadata: {
          labels: {
            app: 'aic-calorie-tracker',
            version: 'latest'
          }
        },
        spec: {
          containers: [{
            name: 'aic-calorie-tracker',
            image: 'aic-calorie-tracker:latest',
            ports: [{
              containerPort: 3000
            }],
            env: [
              {
                name: 'NODE_ENV',
                value: 'production'
              },
              {
                name: 'PORT',
                value: '3000'
              },
              {
                name: 'DATABASE_URL',
                valueFrom: {
                  secretKeyRef: {
                    name: 'database-secret',
                    key: 'url'
                  }
                }
              },
              {
                name: 'JWT_SECRET',
                valueFrom: {
                  secretKeyRef: {
                    name: 'app-secret',
                    key: 'jwt-secret'
                  }
                }
              },
              {
                name: 'OPENAI_API_KEY',
                valueFrom: {
                  secretKeyRef: {
                    name: 'ai-service-secret',
                    key: 'api-key'
                  }
                }
              }
            ],
            resources: {
              requests: {
                memory: '512Mi',
                cpu: '250m'
              },
              limits: {
                memory: '1Gi',
                cpu: '500m'
              }
            },
            livenessProbe: {
              httpGet: {
                path: '/api/health/live',
                port: 3000
              },
              initialDelaySeconds: 30,
              periodSeconds: 10
            },
            readinessProbe: {
              httpGet: {
                path: '/api/health/ready',
                port: 3000
              },
              initialDelaySeconds: 5,
              periodSeconds: 5
            },
            volumeMounts: [{
              name: 'logs',
              mountPath: '/app/logs'
            }]
          }],
          volumes: [{
            name: 'logs',
            emptyDir: {}
          }]
        }
      }
    },
    
    // Kubernetes service
    service: {
      name: 'aic-calorie-tracker',
      type: 'LoadBalancer',
      ports: [{
        port: 80,
        targetPort: 3000
      }],
      selector: {
        app: 'aic-calorie-tracker'
      }
    }
  },
  
  // AWS configuration
  aws: {
    // AWS ECS configuration
    ecs: {
      cluster: 'aic-calorie-tracker-cluster',
      serviceName: 'aic-calorie-tracker',
      taskDefinition: {
        family: 'aic-calorie-tracker',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        cpu: '256',
        memory: '512',
        executionRoleArn: 'arn:aws:iam::123456789012:role/ecsTaskExecutionRole',
        containerDefinitions: [{
          name: 'aic-calorie-tracker',
          image: '123456789012.dkr.ecr.us-east-1.amazonaws.com/aic-calorie-tracker:latest',
          portMappings: [{
            containerPort: 3000,
            protocol: 'tcp'
          }],
          environment: [
            {
              name: 'NODE_ENV',
              value: 'production'
            },
            {
              name: 'PORT',
              value: '3000'
            },
            {
              name: 'DATABASE_URL',
              value: process.env.DATABASE_URL
            },
            {
              name: 'JWT_SECRET',
              value: process.env.JWT_SECRET
            },
            {
              name: 'OPENAI_API_KEY',
              value: process.env.OPENAI_API_KEY
            }
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': '/ecs/aic-calorie-tracker',
              'awslogs-region': 'us-east-1',
              'awslogs-stream-prefix': 'ecs'
            }
          }
        }]
      }
    },
    
    // AWS RDS configuration
    rds: {
      engine: 'postgres',
      engineVersion: '15',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      dbInstanceIdentifier: 'aic-calorie-tracker-db',
      masterUsername: 'postgres',
      masterUserPassword: process.env.RDS_MASTER_PASSWORD,
      backupRetentionPeriod: 7,
      deletionProtection: true,
      vpcSecurityGroupIds: ['sg-12345678901234567'],
      dbSubnetGroupName: 'aic-calorie-tracker-subnet-group'
    },
    
    // AWS ElastiCache configuration
    elasticache: {
      engine: 'redis',
      engineVersion: '7.x',
      cacheNodeType: 'cache.t3.micro',
      numCacheNodes: 1,
      parameterGroupName: 'default.redis7',
      automaticFailoverEnabled: true,
      securityGroupIds: ['sg-12345678901234567'],
      subnetGroupName: 'aic-calorie-tracker-subnet-group'
    },
    
    // AWS S3 configuration
    s3: {
      bucket: 'aic-calorie-tracker-uploads',
      region: 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      encryption: 'AES256',
      versioning: true,
      lifecycleRules: [{
        id: 'delete-old-versions',
        status: 'Enabled',
        noncurrentVersionExpiration: {
          days: 30
        }
      }]
    }
  },
  
  // CI/CD configuration
  cicd: {
    // GitHub Actions configuration
    githubActions: {
      workflow: {
        name: 'CI/CD Pipeline',
        on: {
          push: {
            branches: ['main', 'develop']
          },
          pull_request: {
            branches: ['main']
          }
        },
        jobs: {
          test: {
            runsOn: 'ubuntu-latest',
            strategy: {
              matrix: {
                nodeVersion: [16, 18, 20]
              }
            },
            steps: [
              {
                name: 'Checkout code',
                uses: 'actions/checkout@v3'
              },
              {
                name: 'Setup Node.js',
                uses: 'actions/setup-node@v3',
                with: {
                  nodeVersion: '${{ matrix.nodeVersion }}',
                  cache: 'npm'
                }
              },
              {
                name: 'Install dependencies',
                run: 'npm ci'
              },
              {
                name: 'Run tests',
                run: 'npm test'
              },
              {
                name: 'Run security scan',
                run: 'npm audit'
              }
            ]
          },
          build: {
            needs: ['test'],
            runsOn: 'ubuntu-latest',
            steps: [
              {
                name: 'Checkout code',
                uses: 'actions/checkout@v3'
              },
              {
                name: 'Setup Node.js',
                uses: 'actions/setup-node@v3',
                with: {
                  nodeVersion: '18',
                  cache: 'npm'
                }
              },
              {
                name: 'Install dependencies',
                run: 'npm ci'
              },
              {
                name: 'Build application',
                run: 'npm run build'
              },
              {
                name: 'Build Docker image',
                run: 'docker build -t aic-calorie-tracker:${{ github.sha }} .'
              },
              {
                name: 'Push Docker image',
                run: 'docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/aic-calorie-tracker:${{ github.sha }}'
              }
            ]
          },
          deploy: {
            needs: ['build'],
            runsOn: 'ubuntu-latest',
            if: 'github.ref == \'refs/heads/main\'',
            steps: [
              {
                name: 'Deploy to production',
                run: 'echo "Deploying to production..."'
              }
            ]
          }
        }
      }
    }
  },
  
  // Monitoring and logging configuration
  monitoring: {
    // AWS CloudWatch configuration
    cloudwatch: {
      enabled: true,
      logGroup: '/ecs/aic-calorie-tracker',
      logStream: 'ecs',
      metricNamespace: 'AICalorieTracker',
      metrics: [
        {
          name: 'CPUUtilization',
          namespace: 'AWS/ECS',
          dimensions: [
            {
              name: 'ServiceName',
              value: 'aic-calorie-tracker'
            }
          ]
        },
        {
          name: 'MemoryUtilization',
          namespace: 'AWS/ECS',
          dimensions: [
            {
              name: 'ServiceName',
              value: 'aic-calorie-tracker'
            }
          ]
        }
      ]
    },
    
    // AWS X-Ray configuration
    xray: {
      enabled: true,
      sampling: {
        rule: {
          host: '*',
          httpMethod: '*',
          urlPath: '*',
          fixedRate: 0.1
        }
      }
    },
    
    // AWS CloudWatch Logs configuration
    cloudwatchLogs: {
      enabled: true,
      logGroup: '/ecs/aic-calorie-tracker',
      logStream: 'ecs',
      retentionInDays: 30,
      metricFilter: {
        filterPattern: '[ERROR]',
        metricTransformations: [
          {
            metricName: 'ErrorCount',
            metricNamespace: 'AICalorieTracker',
            metricValue: '1'
          }
        ]
      }
    }
  }
};

// Export configuration
export default deploymentConfig;

// Export individual configuration sections
export const {
  docker,
  kubernetes,
  aws,
  cicd,
  monitoring
} = deploymentConfig;