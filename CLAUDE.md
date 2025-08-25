# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Structure

This is a fullstack real estate management system for REA INVEST with a monorepo structure:

- **frontend/**: Next.js 15.4.6 frontend with TypeScript, React 19, and Tailwind CSS v4
- **backend/**: Express.js API server with minimal setup
- **docs/**: Contains detailed PRD (Product Requirements Document) in Azerbaijani

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev          # Start development server with turbopack
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Run Playwright in UI mode
npm run test:e2e:debug  # Debug Playwright tests
```

### Backend (Express)
```bash
cd backend
npm start            # Start Express server (node index.js)
npm run migrate      # Run database migrations
npm run seed         # Run database seeds
npm run rollback     # Rollback last migration
npm run make-migration <name>  # Create new migration
```

### Database (PostgreSQL)
```bash
cd backend
docker-compose up -d    # Start PostgreSQL and pgAdmin containers
docker-compose down     # Stop containers
docker-compose ps       # Check container status
docker-compose logs     # View logs
```

Database credentials:
- PostgreSQL: localhost:5432, database: myapp_db, user: admin, password: admin123
- pgAdmin: http://localhost:8080, email: admin@admin.com, password: admin123

## Architecture Overview

This is a real estate management system with the following key components:

### Core Entities
- **Properties**: Real estate listings with support for agency-owned, branch-owned, and brokerage types
- **Bookings**: Reservation system with unique active booking per property constraint
- **Deals**: Sales/rental transactions with approval workflow
- **Expenses**: Cost tracking tied to properties and deals
- **Communications**: Call logs, SMS, and WhatsApp message tracking
- **Audit Logs**: Complete audit trail for all mutations

### Key Business Rules
- Each property can only have one active booking at a time
- Approval workflow: Agent → Manager → VP (budget allocation) → Director → Manager (publish)
- Different validation rules based on listing type (agency_owned vs branch_owned vs brokerage)
- All mutations must be logged in audit trail with before/after state

### Technology Stack
- Frontend: Next.js 15 with App Router, TypeScript, React 19, Tailwind CSS v4
- UI Components: shadcn/ui with Radix UI primitives
- Authentication: JWT-based with bcrypt password hashing
- Backend: Express.js with REST API, Helmet security, CORS, rate limiting
- Database: PostgreSQL with Knex.js ORM
- Testing: Playwright for E2E testing
- Development: Docker for PostgreSQL, strict TypeScript configuration
- Rendering: Mixed strategy (CSR for admin panels, ISR for public listings, SSR for detail pages)

### Security Requirements
- RBAC (Role-Based Access Control) with fine-grained permissions
- IP whitelisting for admin operations
- HMAC signature validation for webhooks
- Complete audit logging for compliance (5+ year retention)

## Development Workflow

1. **Start Database**: `cd backend && docker-compose up -d`
2. **Run Migrations**: `cd backend && npm run migrate`
3. **Seed Test Data**: `cd backend && npm run seed`
4. **Start Backend**: `cd backend && npm start` (runs on port 8000)
5. **Start Frontend**: `cd frontend && npm run dev` (runs on port 3000)

## Development Notes

- The project uses strict TypeScript configuration with `@/*` path aliasing
- Tailwind CSS v4 is configured via PostCSS for modern styling
- Authentication uses JWT tokens with role-based access control
- Database schema includes UUID primary keys and comprehensive audit logging
- All API routes are prefixed with `/api` and include error handling
- Frontend uses AuthProvider context for authentication state management
- Testing setup includes Playwright for cross-browser E2E testing
- Comprehensive PRD document defines detailed API specifications and business logic

## Test Users

The seeded database includes test users for each role:
- `admin@rea-invest.com` (password: password123) - Admin role
- `director@rea-invest.com` (password: password123) - Director role  
- `manager@rea-invest.com` (password: password123) - Manager role
- `agent@rea-invest.com` (password: password123) - Agent role

## API Architecture

- **Base URL**: http://localhost:8000/api
- **Authentication**: Bearer token in Authorization header
- **Error Format**: Standardized JSON responses with success/error structure
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Key Endpoints**:
  - `/api/auth` - Authentication (login, logout, me)
  - `/api/users` - User management
  - `/api/properties` - Property listings
  - `/api/customers` - Customer management
  - `/health` - Health check endpoint

## Important Files
- `docs/prd.md`: Complete product requirements in Azerbaijani with detailed API specs
- `backend/docker-compose.yml`: PostgreSQL and pgAdmin setup
- `backend/migrations/`: Database schema definitions
- `frontend/tsconfig.json`: TypeScript configuration with strict mode
- `frontend/components/auth/`: Authentication components and context
- `frontend/components/ui/`: shadcn/ui component library setup