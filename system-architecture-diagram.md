# AICalorieTracker System Architecture Diagram

## Current System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WC[Web Client<br/>React + Vite]
        MC[Mobile Client<br/>React Native + Expo]
        AC[Admin Panel<br/>React + Vite]
    end

    subgraph "API Layer"
        API[Express.js API Server<br/>- Authentication<br/>- AI Service Integration<br/>- File Upload/Storage<br/>- Rate Limiting<br/>- Error Handling]
    end

    subgraph "Data Layer"
        DB[(MySQL Database<br/>Drizzle ORM)]
        CACHE[(Memory Cache<br/>AI Service Caching)]
        SESSION[(Session Store<br/>MemoryStore)]
    end

    subgraph "External Services"
        AI[AI Services<br/>Gemini/OpenAI]
        STRIPE[Stripe Payment<br/>Processing]
        S3[File Storage<br/>Current: Database]
    end

    WC --> API
    MC --> API
    AC --> API
    API --> DB
    API --> CACHE
    API --> SESSION
    API --> AI
    API --> STRIPE
    API --> S3

    style WC fill:#e1f5fe
    style MC fill:#e8f5e8
    style AC fill:#fff3e0
    style API fill:#f3e5f5
    style DB fill:#fce4ec
    style CACHE fill:#e8eaf6
    style SESSION fill:#fff8e1
```

## Planned System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WC[Web Client<br/>React + Vite<br/>- Error Boundaries<br/>- Bundle Optimization<br/>- Accessibility<br/>- PWA Support]
        MC[Mobile Client<br/>React Native + Expo<br/>- Offline First<br/>- Conflict Resolution<br/>- Crash Reporting<br/>- Push Notifications]
        AC[Admin Panel<br/>React + Vite<br/>- Real-time Analytics<br/>- User Management<br/>- System Monitoring]
    end

    subgraph "API Layer"
        API[Express.js API Server<br/>- JWT Authentication<br/>- Rate Limiting<br/>- Request Validation<br/>- Health Checks<br/>- API Versioning]
        MW[Middleware Layer<br/>- Security Headers<br/>- CORS<br/>- Compression<br/>- Logging<br/>- Monitoring]
    end

    subgraph "Data Layer"
        DB[(MySQL Database<br/>Drizzle ORM<br/>- Indexed Tables<br/>- Foreign Keys<br/>- Check Constraints<br/>- Soft Deletes)]
        REDIS[(Redis Cache<br/>- Session Storage<br/>- AI Service Cache<br/>- Rate Limiting<br/>- Queue Management)]
        FILE_S3[(File Storage<br/>AWS S3/MinIO<br/>- Image Optimization<br/>- CDN Integration<br/>- Version Control)]
    end

    subgraph "External Services"
        AI[AI Services<br/>Gemini/OpenAI<br/>- Request Caching<br/>- Fallback Services<br/>- Rate Limiting]
        STRIPE[Stripe Payment<br/>Processing<br/>- Webhook Handling<br/>- Subscription Management]
        MONITOR[Monitoring Services<br/>Sentry/Rollbar<br/>- Error Tracking<br/>- Performance Metrics]
        LOG[Logging Services<br/>ELK Stack/Datadog<br/>- Centralized Logs<br/>- Log Analysis]
    end

    subgraph "Infrastructure"
        CDN[CDN<br/>CloudFlare/AWS<br/>- Static Assets<br/>- Image Optimization<br/>- Global Caching]
        LB[Load Balancer<br/>Nginx/AWS ALB<br/>- Traffic Distribution<br/>- SSL Termination<br/>- Health Checks]
        CI_CD[CI/CD Pipeline<br/>GitHub Actions<br/>- Automated Testing<br/>- Deployment<br/>- Monitoring]
    end

    WC --> LB
    MC --> LB
    AC --> LB
    LB --> API
    API --> MW
    MW --> DB
    MW --> REDIS
    MW --> FILE_S3
    API --> AI
    API --> STRIPE
    API --> MONITOR
    API --> LOG
    WC --> CDN
    MC --> CDN
    AC --> CDN
    API --> CI_CD

    style WC fill:#e1f5fe
    style MC fill:#e8f5e8
    style AC fill:#fff3e0
    style API fill:#f3e5f5
    style MW fill:#e8f5e8
    style DB fill:#fce4ec
    style REDIS fill:#e8eaf6
    style FILE_S3 fill:#fff8e1
    style AI fill:#ffebee
    style STRIPE fill:#f3e5f5
    style MONITOR fill:#e8f5e8
    style LOG fill:#fff3e0
    style CDN fill:#e1f5fe
    style LB fill:#f3e5f5
    style CI_CD fill:#e8eaf6
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant WC as Web Client
    participant MC as Mobile Client
    participant API as API Server
    participant DB as Database
    participant AI as AI Service
    participant CACHE as Redis Cache
    participant LOG as Logging Service

    U->>WC: Request Action
    WC->>API: API Call (Auth Required)
    API->>CACHE: Check Cache
    alt Cache Hit
        CACHE-->>API: Return Cached Data
    else Cache Miss
        API->>DB: Query Database
        DB-->>API: Return Data
        API->>CACHE: Store in Cache
    end
    alt AI Processing Required
        API->>AI: Process Image/Request
        AI-->>API: Return Analysis
        API->>CACHE: Cache AI Result
    end
    API->>LOG: Log Request/Response
    API-->>WC: Return Response
    WC-->>U: Display Result

    U->>MC: Mobile Action
    MC->>API: API Call (Offline First)
    alt Online
        API->>DB: Sync Data
        DB-->>API: Confirm Sync
    else Offline
        MC->>LOCAL: Store Locally
        MC-->>U: Confirm Action
    end
    API-->>MC: Return Response
    MC-->>U: Display Result
```

## Security Architecture

```mermaid
graph TB
    subgraph "Security Layer"
        AUTH[Authentication<br/>- JWT Tokens<br/>- Session Management<br/>- Password Hashing]
        AUTHZ[Authorization<br/>- Role-Based Access<br/>- Resource Permissions<br/>- Admin Controls]
        VALID[Input Validation<br/>- Zod Schema<br/>- Sanitization<br/>- SQL Injection Protection]
        RATE[Rate Limiting<br/>- Auth Endpoints<br/>- API Endpoints<br/>- AI Service Calls]
        HEAD[Security Headers<br/>- CSP<br/>- CORS<br/>- HSTS<br/>- X-Frame-Options]
    end

    subgraph "Data Protection"
        ENC[Encryption<br/>- Data at Rest<br/>- Data in Transit<br/>- Session Encryption]
        SECURE[Secure Storage<br/>- Environment Variables<br/>- Secrets Management<br/>- Key Rotation]
    end

    subgraph "Network Security"
        FIREWALL[Firewall Rules<br/>- Port Restrictions<br/>- IP Whitelisting<br/>- DDoS Protection]
        SSL[SSL/TLS<br/>- Certificate Management<br/>- HSTS<br/>- Perfect Forward Secrecy]
    end

    subgraph "Mobile Security"
        PIN[Certificate Pinning<br/>- SSL Pinning<br/>- Root Certificate Trust]
        SECURE_STORE[Secure Storage<br/>- Keychain/Keystore<br/>- Biometric Authentication]
    end

    AUTH --> AUTHZ
    AUTHZ --> VALID
    VALID --> RATE
    RATE --> HEAD
    HEAD --> ENC
    ENC --> SECURE
    SECURE --> FIREWALL
    FIREWALL --> SSL
    SSL --> PIN
    PIN --> SECURE_STORE

    style AUTH fill:#ffebee
    style AUTHZ fill:#fce4ec
    style VALID fill:#f3e5f5
    style RATE fill:#e8eaf6
    style HEAD fill:#e1f5fe
    style ENC fill:#e8f5e8
    style SECURE fill:#fff3e0
    style FIREWALL fill:#ffebee
    style SSL fill:#fce4ec
    style PIN fill:#f3e5f5
    style SECURE_STORE fill:#e8eaf6
```

## Monitoring and Observability Architecture

```mermaid
graph TB
    subgraph "Application Monitoring"
        PERF[Performance Metrics<br/>- Response Times<br/>- Throughput<br/>- Error Rates<br/>- Resource Usage]
        ERROR[Error Tracking<br/>- Exception Capture<br/>- Error Aggregation<br/>- Alerting<br/>- Stack Traces]
        USER[User Analytics<br/>- User Behavior<br/>- Feature Usage<br/>- Drop-off Points<br/>- Conversion Rates]
    end

    subgraph "Infrastructure Monitoring"
        SYS[System Metrics<br/>- CPU/Memory<br/>- Disk Usage<br/>- Network I/O<br/>- Process Health]
        DB[Database Metrics<br/>- Query Performance<br/>- Connection Pool<br/>- Index Usage<br/>- Table Statistics]
        CACHE[Cache Metrics<br/>- Hit Rates<br/>- Memory Usage<br/>- Eviction Policies<br/>- Response Times]
    end

    subgraph "Logging Infrastructure"
        STRUCT[Structured Logging<br/>- JSON Format<br/>- Log Levels<br/>- Context Information<br/>- Trace IDs]
        CENTRAL[Centralized Logging<br/>- Log Aggregation<br/>- Search & Analysis<br/>- Retention Policies<br/>- Log Shipping]
        ALERT[Alerting System<br/>- Real-time Notifications<br/>- Escalation Paths<br/>- SLA Monitoring<br/>- Incident Response]
    end

    subgraph "Visualization"
        DASH[Dashboards<br/>- Real-time Metrics<br/>- Historical Trends<br/>- System Health<br/>- Performance KPIs]
        REPORTS[Reports<br/>- Daily/Weekly Summaries<br/>- Performance Reports<br/>- Security Audits<br/>- Compliance Reports]
    end

    PERF --> CENTRAL
    ERROR --> CENTRAL
    USER --> CENTRAL
    SYS --> CENTRAL
    DB --> CENTRAL
    CACHE --> CENTRAL
    CENTRAL --> ALERT
    CENTRAL --> DASH
    CENTRAL --> REPORTS

    style PERF fill:#e1f5fe
    style ERROR fill:#ffebee
    style USER fill:#e8f5e8
    style SYS fill:#fff3e0
    style DB fill:#fce4ec
    style CACHE fill:#f3e5f5
    style STRUCT fill:#e8eaf6
    style CENTRAL fill:#e1f5fe
    style ALERT fill:#ffebee
    style DASH fill:#e8f5e8
    style REPORTS fill:#fff3e0
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development Environment"
        DEV_DEV[Development Server<br/>- Local Development<br/>- Hot Reload<br/>- Debug Tools]
        DEV_TEST[Testing Server<br/>- Unit Testing<br/>- Integration Testing<br/>- Staging Environment]
    end

    subgraph "Production Environment"
        PROD_LB[Load Balancer<br/>- Traffic Distribution<br/>- SSL Termination<br/>- Health Checks]
        PROD_WEB[Web Servers<br/>- Auto Scaling<br/>- Blue/Green Deploy<br/>- Rolling Updates]
        PROD_DB[(Database Cluster<br/>- Master/Slave<br/>- Automated Backups<br/>- Failover)]
        PROD_CACHE[(Redis Cluster<br/>- High Availability<br/>- Data Persistence<br/>- Auto Scaling)]
        PROD_FILE[(File Storage<br/>- S3 Compatible<br/>- CDN Integration<br/>- Version Control)]
    end

    subgraph "CI/CD Pipeline"
        CODE[Source Control<br/>- Git Repository<br/>- Branch Strategy<br/>- Code Reviews]
        BUILD[Build Process<br/>- Dependency Management<br/>- Code Compilation<br/>- Bundle Optimization]
        TEST[Testing Suite<br/>- Unit Tests<br/>- Integration Tests<br/>- E2E Tests<br/>- Security Tests]
        DEPLOY[Deployment<br/>- Infrastructure as Code<br/>- Configuration Management<br/>- Release Orchestration]
        MONITOR[Monitoring<br/>- Health Checks<br/>- Performance Metrics<br/>- Rollback Triggers]
    end

    DEV_DEV --> CODE
    DEV_TEST --> CODE
    CODE --> BUILD
    BUILD --> TEST
    TEST --> DEPLOY
    DEPLOY --> PROD_LB
    PROD_LB --> PROD_WEB
    PROD_WEB --> PROD_DB
    PROD_WEB --> PROD_CACHE
    PROD_WEB --> PROD_FILE
    DEPLOY --> MONITOR
    MONITOR --> DEPLOY

    style DEV_DEV fill:#e8f5e8
    style DEV_TEST fill:#e1f5fe
    style PROD_LB fill:#ffebee
    style PROD_WEB fill:#fce4ec
    style PROD_DB fill:#f3e5f5
    style PROD_CACHE fill:#e8eaf6
    style PROD_FILE fill:#fff3e0
    style CODE fill:#e1f5fe
    style BUILD fill:#e8f5e8
    style TEST fill:#ffebee
    style DEPLOY fill:#fce4ec
    style MONITOR fill:#f3e5f5
```

## Disaster Recovery Architecture

```mermaid
graph TB
    subgraph "Backup Strategy"
        FULL[Full Backups<br/>- Daily Full Backups<br/>- Weekly Retention<br/>- Off-site Storage]
        INCR[Incremental Backups<br/>- Hourly Increments<br/>- Point-in-Time Recovery<br/>- Transaction Logs]
        FILE[File Backups<br/>- S3 Buckets<br/>- Version History<br/>- Cross-region Replication]
    end

    subgraph "Recovery Strategy"
        POINT[Point-in-Time Recovery<br/>- Database Rollback<br/>- File System Restore<br/>- Application State]
        REGION[Multi-region Deployment<br/>- Active-Active<br/>- Geo DNS<br/>- Automatic Failover]
        MANUAL[Manual Recovery<br/>- Disaster Recovery Plan<br/>- Contact Procedures<br/>- Communication Plan]
    end

    subgraph "High Availability"
        CLUSTER[Database Cluster<br/>- Master/Slave<br/>- Automatic Failover<br/>- Load Balancing]
        REDUNDANT[Redundant Components<br/>- Multiple Instances<br/>- Health Monitoring<br/>- Auto Scaling]
        MONITOR[Health Monitoring<br/>- Uptime Monitoring<br/>- Performance Alerts<br/>- Capacity Planning]
    end

    FULL --> POINT
    INCR --> POINT
    FILE --> POINT
    POINT --> REGION
    REGION --> MANUAL
    MANUAL --> CLUSTER
    CLUSTER --> REDUNDANT
    REDUNDANT --> MONITOR

    style FULL fill:#e1f5fe
    style INCR fill:#e8f5e8
    style FILE fill:#fff3e0
    style POINT fill:#fce4ec
    style REGION fill:#f3e5f5
    style MANUAL fill:#ffebee
    style CLUSTER fill:#e8eaf6
    style REDUNDANT fill:#e1f5fe
    style MONITOR fill:#e8f5e8
```

This comprehensive architecture diagram shows the current state and planned improvements for the AICalorieTracker system. The diagrams illustrate the multi-layered approach to security, performance, reliability, and scalability that will be implemented throughout the system audit process.