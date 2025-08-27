# REA INVEST Property Management System

🏢 **Modern property management system for real estate professionals**

[![Next.js](https://img.shields.io/badge/Next.js-15.4.6-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue?logo=docker)](https://docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+**
- **Docker & Docker Compose**
- **Git**

### 🛠️ Automated Setup

```bash
# Clone repository
git clone https://github.com/your-org/rea-invest.git
cd rea-invest

# Run automated setup (installs dependencies, sets up database, etc.)
chmod +x scripts/setup.sh
./scripts/setup.sh

# Start development environment
./start-dev.sh
```

### 🎯 Manual Setup

<details>
<summary>Click to expand manual setup instructions</summary>

```bash
# 1. Install backend dependencies
cd backend
npm install

# 2. Install frontend dependencies  
cd ../frontend
npm install

# 3. Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 4. Start database
cd ../backend
docker-compose up -d postgres

# 5. Run migrations
npm run migrate

# 6. (Optional) Seed sample data
npm run seed

# 7. Start backend server
npm run dev

# 8. In another terminal, start frontend
cd ../frontend
npm run dev
```

</details>

### 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Database**: localhost:5432

### 🔑 Default Credentials

```
Admin:   admin@rea-invest.com   / password123
Manager: manager@rea-invest.com / password123
Agent:   agent@rea-invest.com   / password123
```

## 📋 Features

### 🏠 **Property Management**
- ✅ Property CRUD operations with advanced validation
- ✅ Image upload and gallery management
- ✅ Advanced search and filtering
- ✅ Property categorization (residential/commercial)
- ✅ Listing types (agency-owned, branch-owned, brokerage)
- ✅ Price tracking and history

### 👥 **User Management**
- ✅ Role-based access control (Admin, Manager, Agent)
- ✅ JWT authentication with secure sessions
- ✅ User profile management
- ✅ Permission-based feature access

### 📅 **Booking System**
- ✅ Property viewing appointments
- ✅ Booking status tracking
- ✅ Calendar integration
- ✅ Automated notifications

### 🔔 **Notification System**
- ✅ Real-time notifications
- ✅ Email notifications (configurable)
- ✅ Notification preferences
- ✅ System alerts and reminders

### 📊 **Analytics & Reporting**
- ✅ Property performance metrics
- ✅ Sales/rental analytics
- ✅ Agent performance tracking
- ✅ Market trend analysis
- ✅ Custom dashboard widgets

### 📁 **File Management**
- ✅ Drag & drop file upload
- ✅ Image optimization and resizing
- ✅ Chunked upload for large files
- ✅ File organization by property
- ✅ Secure file access control

### 🔧 **System Administration**
- ✅ Database optimization tools
- ✅ Cache management
- ✅ System health monitoring
- ✅ Backup and recovery
- ✅ Performance analytics

## 🏗️ Technology Stack

### **Frontend**
- **Next.js 15** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript** - Type safety and better DX
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **SWR** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation

### **Backend**
- **Node.js 18+** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Type safety on backend
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **JWT** - Authentication tokens
- **Knex.js** - Database query builder
- **Joi** - Input validation
- **Multer** - File upload handling
- **Sharp** - Image processing

### **DevOps & Infrastructure**
- **Docker** - Containerization
- **Docker Compose** - Local development
- **Kubernetes** - Production orchestration
- **Nginx** - Reverse proxy & load balancer
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards
- **Loki** - Log aggregation

### **Testing**
- **Jest** - Unit testing framework
- **Playwright** - E2E testing
- **React Testing Library** - Component testing
- **Supertest** - API testing

## 📚 Documentation

### 🔗 **Quick Links**
- [**API Documentation**](http://localhost:8000/api/docs) - Interactive Swagger UI
- [**Deployment Guide**](./docs/deployment-guide.md) - Complete deployment instructions
- [**Architecture Analysis**](./docs/architecture_analysis.md) - System architecture overview
- [**Database Schema**](./docs/database-schema.md) - Database design and relationships

### 📖 **Developer Guides**
- [Getting Started](./docs/getting-started.md)
- [Development Workflow](./docs/development.md)
- [API Reference](./docs/api-documentation.md)
- [Frontend Components](./docs/components.md)
- [Database Operations](./docs/database.md)
- [Testing Guide](./docs/testing.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🗂️ Project Structure

```
rea-invest/
├── 🎨 frontend/                 # Next.js application
│   ├── app/                    # App Router pages
│   ├── components/             # Reusable UI components
│   ├── lib/                    # Utilities and hooks
│   ├── types/                  # TypeScript definitions
│   └── tests/                  # Frontend tests
├── 🚀 backend/                  # Express.js API
│   ├── routes/                 # API endpoints
│   ├── middleware/             # Express middleware
│   ├── migrations/             # Database migrations
│   ├── seeds/                  # Database seeders
│   ├── services/               # Business logic
│   ├── config/                 # Configuration files
│   └── tests/                  # Backend tests
├── 🐳 docker-compose.yml       # Development environment
├── 🔧 kubernetes/              # K8s deployment manifests
├── 📊 monitoring/              # Prometheus & Grafana config
├── 🌐 nginx/                   # Nginx configuration
├── 📝 scripts/                 # Utility scripts
└── 📚 docs/                    # Documentation
```

## 🔧 Development Scripts

### **General**
```bash
./start-dev.sh        # Start development environment
./stop-dev.sh         # Stop development environment
./run-tests.sh        # Run all tests
./deploy.sh           # Deploy to production
```

### **Backend**
```bash
cd backend
npm run dev           # Start with nodemon
npm run migrate       # Run database migrations
npm run seed          # Seed sample data
npm run test          # Run unit tests
npm run test:watch    # Run tests in watch mode
```

### **Frontend**
```bash
cd frontend
npm run dev           # Start development server
npm run build         # Build for production
npm run start         # Start production server
npm run lint          # Run ESLint
npm run test:e2e      # Run E2E tests
npm run test:e2e:ui   # Run E2E tests with UI
```

### **Database**
```bash
cd backend
npm run migrate                    # Run migrations
npm run rollback                  # Rollback last migration
npm run make-migration <name>     # Create new migration
npm run analyze-tables            # Analyze database performance
```

## 🚀 Deployment

### **Development**
```bash
docker-compose up -d
```

### **Production**
```bash
# Using deployment script
./deploy.sh production deploy

# Manual deployment
docker-compose --env-file .env.production up -d --build
```

### **Kubernetes**
```bash
# Deploy all services
kubectl apply -f kubernetes/

# Check deployment status
kubectl get pods -n rea-invest
```

## 📊 Monitoring

### **Health Checks**
```bash
# Automated health check
./scripts/health-check.sh

# Manual checks
curl http://localhost:8000/health      # Backend
curl http://localhost:3000/api/health  # Frontend
```

### **Monitoring Dashboards**
- **Grafana**: http://localhost:3001 (monitoring.rea-invest.com in production)
- **Prometheus**: http://localhost:9090
- **Database Admin**: http://localhost:8080

### **Logs**
```bash
# Docker Compose logs
docker-compose logs -f

# Specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Kubernetes logs
kubectl logs -f deployment/backend -n rea-invest
```

## 🛡️ Security

### **Authentication & Authorization**
- JWT-based authentication
- Role-based access control (RBAC)
- Secure password hashing with bcrypt
- Session management with Redis

### **Security Headers**
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)  
- X-Frame-Options, X-XSS-Protection
- Rate limiting and CORS protection

### **Data Protection**
- Environment variable encryption
- Secure file upload handling
- SQL injection prevention
- Input validation and sanitization

## 🧪 Testing

### **Backend Tests**
```bash
cd backend
npm test                    # Unit tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### **Frontend Tests**
```bash
cd frontend
npm test                    # Component tests
npm run test:e2e           # E2E tests
npm run test:e2e:ui        # E2E with Playwright UI
```

### **Integration Tests**
```bash
cd frontend
npm run test:e2e           # Full integration test suite
```

## 🔄 Backup & Recovery

### **Automated Backup**
```bash
# Create backup
./scripts/backup.sh backup

# Schedule daily backups (crontab)
0 2 * * * /path/to/rea-invest/scripts/backup.sh backup
```

### **Manual Backup**
```bash
# Database backup
docker-compose exec postgres pg_dump -U postgres rea_invest_prod > backup.sql

# File backup
tar -czf uploads-backup.tar.gz backend/uploads/
```

### **Recovery**
```bash
# Restore from backup
./scripts/backup.sh restore /path/to/backup.tar.gz

# Database restore
cat backup.sql | docker-compose exec -T postgres psql -U postgres rea_invest_prod
```

## 🤝 Contributing

### **Development Workflow**
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Create** Pull Request

### **Code Standards**
- **TypeScript** for type safety
- **ESLint** for code linting
- **Prettier** for code formatting
- **Conventional Commits** for commit messages
- **Unit tests** for all new features

### **Before Submitting PR**
```bash
# Run all checks
npm run lint           # Check code style
npm run test           # Run all tests
npm run build          # Verify build works
./run-tests.sh         # Full test suite
```

## 📞 Support & Contact

### **Documentation**
- **API Docs**: http://localhost:8000/api/docs
- **GitHub Wiki**: [Project Wiki](https://github.com/your-org/rea-invest/wiki)
- **Troubleshooting**: [Common Issues](./docs/troubleshooting.md)

### **Community**
- **Issues**: [GitHub Issues](https://github.com/your-org/rea-invest/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/rea-invest/discussions)
- **Email**: dev@rea-invest.com

### **Professional Support**
- **Technical Support**: support@rea-invest.com
- **Business Inquiries**: business@rea-invest.com
- **Partnership**: partners@rea-invest.com

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

## 🏆 Acknowledgments

### **Core Technologies**
- [Next.js](https://nextjs.org/) - The React Framework for Production
- [React](https://reactjs.org/) - A JavaScript library for building user interfaces
- [Node.js](https://nodejs.org/) - JavaScript runtime built on Chrome's V8 JavaScript engine
- [PostgreSQL](https://www.postgresql.org/) - The World's Most Advanced Open Source Relational Database

### **UI & Styling**
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful designed components
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons

### **Development Tools**
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with syntax for types
- [Docker](https://www.docker.com/) - Containerization platform
- [Playwright](https://playwright.dev/) - Reliable end-to-end testing
- [Jest](https://jestjs.io/) - JavaScript Testing Framework

---

<div align="center">

**⭐ Star this repo if you found it helpful! ⭐**

Made with ❤️ by the REA INVEST team

[🏠 Website](https://rea-invest.com) • [📧 Contact](mailto:dev@rea-invest.com) • [📚 Docs](./docs/)

</div>