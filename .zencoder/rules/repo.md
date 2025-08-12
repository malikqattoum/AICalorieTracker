---
description: Repository Information Overview
alwaysApply: true
---

# AI Calorie Tracker Information

## Summary
AI Calorie Tracker is a full-stack web application for tracking calorie intake and nutritional information. It uses AI capabilities from OpenAI and Google's Generative AI to analyze food intake and provide nutritional insights.

## Structure
- **client/**: React frontend application with TypeScript
- **server/**: Express.js backend with TypeScript
- **shared/**: Shared code between client and server
- **models/**: Sequelize database models
- **migrations/**: Database migration files
- **config/**: Configuration files for database and other services
- **dist/**: Compiled output directory

## Language & Runtime
**Language**: TypeScript/JavaScript
**Version**: TypeScript 5.6.3
**Build System**: Vite 6.3.5
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- **Backend**: Express 4.21.2, Sequelize 6.37.7, MySQL2 3.14.1, Drizzle ORM 0.43.1
- **Frontend**: React 18.3.1, React Query 5.76.1, TailwindCSS 3.4.17
- **AI Services**: OpenAI 4.95.1, Google Generative AI 0.24.1
- **Authentication**: Passport 0.7.0, bcryptjs 3.0.2
- **UI Components**: Radix UI, Framer Motion 11.13.1

**Development Dependencies**:
- Jest 30.0.5, ts-jest 29.4.1
- ESBuild 0.25.5
- Concurrently 9.1.2
- Drizzle Kit 0.31.4

## Build & Installation
```bash
# Install dependencies
npm install
cd client && npm install

# Development mode
npm run dev

# Production build
npm run build
cd client && npm run build

# Start production server
npm start
```

## Database
**Type**: MySQL
**ORM**: Sequelize and Drizzle ORM
**Configuration**: config/config.json
**Migrations**: 
```bash
# Run migrations
npm run db:migrate
```

## Testing
**Framework**: Jest with ts-jest
**Test Location**: server/src/tests
**Configuration**: jest.config.cjs
**Run Command**:
```bash
npm test
```

## Client Application
**Framework**: React with TypeScript
**Routing**: Wouter
**State Management**: React Query
**Styling**: TailwindCSS
**Build Tool**: Vite
**Internationalization**: i18next

## Server Application
**Framework**: Express.js
**API Routes**: server/routes.ts
**Entry Point**: server/index.ts
**Port**: 5001 (default)
**AI Services**: OpenAI and Google Generative AI integration