# EduSphere - Multi-Tenant School ERP System

> ✅ **Status: PRODUCTION READY (v1.1)** - Complete full-stack implementation with Admin Portal + School ERP

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/postgresql-15%2B-blue)
![Status](https://img.shields.io/badge/status-production--ready-success)

A comprehensive, production-ready multi-tenant School ERP (Enterprise Resource Planning) system with centralized admin portal and isolated school instances. Features RFID-integrated attendance, academic management, fee tracking, and more.

## 🎉 Complete Feature Set

**40+ Pages Built | 75+ API Endpoints | 34 Database Tables | 16 Modules**

- ✅ **Admin Portal** (12 pages) - School provisioning, subscriptions, billing
- ✅ **School ERP** (28 pages) - Complete school operations dashboard
- ✅ **Backend APIs** (75+ endpoints) - RESTful APIs for all modules
- ✅ **Modern UI** - Next.js 15+ (React 19) compatible
- ✅ **Localization** - Fully localized for Indian schools (₹ Currency)
- ✅ **Automated Workflows** - Real-time fee enrollment and background data syncing

## Features

### Admin Portal
- School registration and management
- Database provisioning per school
- License and subscription management
- Cross-school analytics and reporting
- User management
- System monitoring and health checks

### School ERP System
- **Student Management**: Complete student lifecycle management
- **Teacher Management**: Staff profiles, qualifications, assignments
- **RFID Attendance**: Real-time attendance tracking with RFID cards
- **Academic Management**: Classes, sections, subjects, timetables
- **Examination System**: Exam scheduling, grading, report cards
- **Fee Management**: Flexible fee structures, real-time payment tracking, detailed fee head breakdown, automated student enrollment, and professional receipts (₹)
- **Library System**: Book inventory, issue/return tracking
- **Inventory Management**: Asset and stock management
- **Communication**: Centralized announcement system, targeted notifications, and system-wide messaging
- **Real-time Sync**: Automated background data refreshing for student lists and financial summaries

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Next.js 15+, React 19, TypeScript |
| UI Framework | TailwindCSS, shadcn/ui |
| Backend | Express.js, Node.js 20+ |
| Database | PostgreSQL 15+, Prisma ORM |
| Authentication | JWT, bcrypt |
| Real-time | Socket.io (WebSocket) |
| Containerization | Docker, Docker Compose |
| Cloud | AWS/GCP/Azure compatible |

## Architecture

EduSphere uses a **database-per-tenant** architecture where:
- Each school has its own isolated PostgreSQL database
- Admin portal manages all schools centrally
- Complete data isolation and security
- Independent scaling per school

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## Project Structure

```
EduSphere/
├── Admin/              # Admin Portal
│   ├── client/        # Next.js Frontend
│   ├── server/        # Express Backend
│   └── prisma/        # Database Schema
├── erp/               # School ERP System
│   ├── client/        # Next.js Frontend
│   ├── server/        # Express Backend
│   └── prisma/        # Database Schema
├── shared/            # Shared code
├── infra/             # Infrastructure configs
└── docs/              # Documentation
```

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v20.0.0 or higher
- **npm**: v10.0.0 or higher
- **PostgreSQL**: v15.0 or higher
- **Docker**: v24.0 or higher (for containerized deployment)
- **Git**: Latest version

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/EduSphere.git
cd EduSphere
```

### 2. Install Dependencies

#### Admin Portal
```bash
cd Admin/server
npm install
cd ../client
npm install
```

#### School ERP
```bash
cd ../../erp/server
npm install
cd ../client
npm install
```

### 3. Database Setup

#### Create PostgreSQL Databases

```sql
-- Admin Database
CREATE DATABASE edusphere_admin;

-- Example School Database
CREATE DATABASE edusphere_school_demo;
```

#### Configure Environment Variables

**Admin Server** (`Admin/server/.env`):
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/edusphere_admin"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3000

# Admin Config
ADMIN_EMAIL=admin@edusphere.com
ADMIN_PASSWORD=changeme
```

**School ERP Server** (`erp/server/.env`):
```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database (Will be dynamically set per school)
DATABASE_URL="postgresql://username:password@localhost:5432/edusphere_school_demo"

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=http://localhost:3001

# School Config
SCHOOL_ID=demo-school
SCHOOL_NAME="Demo School"

# RFID Configuration
RFID_ENABLED=true
RFID_READER_PORT=/dev/ttyUSB0
RFID_READER_BAUDRATE=9600
```

**Admin Client** (`Admin/client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**School ERP Client** (`erp/client/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SCHOOL_ID=demo-school
```

### 4. Initialize Prisma

#### Admin Database
```bash
cd Admin/server
npx prisma generate
npx prisma db push
npx prisma db seed  # Optional: seed initial data
```

#### School Database
```bash
cd ../../erp/server
npx prisma generate
npx prisma db push
npx prisma db seed  # Optional: seed demo data
```

### 5. Run Development Servers

Open 4 terminal windows:

**Terminal 1: Admin Backend**
```bash
cd Admin/server
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2: Admin Frontend**
```bash
cd Admin/client
npm run dev
# Runs on http://localhost:3000
```

**Terminal 3: School ERP Backend**
```bash
cd erp/server
npm run dev
# Runs on http://localhost:5001
```

**Terminal 4: School ERP Frontend**
```bash
cd erp/client
npm run dev
# Runs on http://localhost:3001
```

### 6. Access the Application

- **Admin Portal**: http://localhost:3000
- **School ERP**: http://localhost:3001

Default admin credentials (if seeded):
- Email: `admin@edusphere.com`
- Password: `changeme` (change immediately!)

## Docker Deployment

### Using Docker Compose

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

See [docs/deployment/DOCKER.md](./docs/deployment/DOCKER.md) for detailed Docker setup.

## RFID Attendance Integration

EduSphere supports RFID-based attendance tracking.

### Supported RFID Readers
- Mifare/ISO14443A compatible readers
- USB/Serial connection
- Network-based TCP/IP readers

### Setup Guide

1. **Hardware Connection**
   - Connect RFID reader via USB or network
   - Note the device port (e.g., `/dev/ttyUSB0`)

2. **Configuration**
   - Update `RFID_READER_PORT` in `.env`
   - Set `RFID_ENABLED=true`

3. **Card Assignment**
   - Navigate to Student Management
   - Assign RFID card IDs to students
   - Test card scanning

See [docs/RFID_INTEGRATION.md](./docs/RFID_INTEGRATION.md) for complete guide.

## API Documentation

API documentation is available via Swagger UI:

- **Admin API**: http://localhost:5000/api-docs
- **School ERP API**: http://localhost:5001/api-docs

See [docs/api/](./docs/api/) for detailed API specifications.

## Database Schema

### Admin Database
- Schools registry and configuration
- Subscription and license management
- Admin users and audit logs

### School Database
- Students, teachers, and staff
- Academic structure (classes, subjects)
- Attendance records (RFID integrated)
- Examinations and grades
- Fee management
- Library and inventory

See [docs/DATABASE_SCHEMA.md](./docs/DATABASE_SCHEMA.md) for complete schema.

## Security

- **Authentication**: JWT-based with role-based access control
- **Data Isolation**: Separate database per school
- **Encryption**: SSL/TLS for data in transit, encryption at rest
- **Password Security**: bcrypt hashing with salt
- **API Security**: Rate limiting, input validation, CORS
- **Audit Logs**: Complete activity tracking

## Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Generate coverage report
npm run test:coverage
```

## Production Deployment

### Cloud Options

1. **AWS**
   - EC2 for servers
   - RDS for PostgreSQL
   - S3 for file storage
   - CloudFront for CDN

2. **Google Cloud**
   - Compute Engine
   - Cloud SQL
   - Cloud Storage
   - Cloud CDN

3. **DigitalOcean**
   - Droplets
   - Managed Databases
   - Spaces (object storage)

See [docs/deployment/CLOUD_DEPLOYMENT.md](./docs/deployment/CLOUD_DEPLOYMENT.md) for step-by-step guides.

### Performance Optimization

- Enable database connection pooling (PgBouncer)
- Implement Redis caching
- Use CDN for static assets
- Enable gzip compression
- Set up load balancing for multiple schools

## Monitoring & Maintenance

- **Health Checks**: Automated endpoint monitoring
- **Logging**: Centralized logging with Winston
- **Metrics**: Prometheus + Grafana dashboards
- **Backups**: Automated daily database backups
- **Updates**: Zero-downtime rolling updates

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## Support

- **Documentation**: [docs/](./docs/)
- **Issues**: [GitHub Issues](https://github.com/yourusername/EduSphere/issues)
- **Email**: support@edusphere.com
- **Discord**: [Join our community](https://discord.gg/edusphere)

## Roadmap

### Version 1.1 (✅ RECENT UPDATES)
- [x] **Next.js 15 Compatibility** - Refactored `params` Promise unwrapping
- [x] **Indian Rupee Localization** - Switched from $ to ₹ across all modules
- [x] **Real-time Synchronization** - Automated background polling for Student lists
- [x] **Automated Fee Enrollment** - Retrospective synchronization for all class students
- [x] **Enhanced Financial Tracking** - Total paid columns and accurate fee statuses (N/A)

### Version 2.0 (Planned)
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced analytics and AI insights
- [ ] Multi-language support
- [ ] Biometric attendance (fingerprint/face)
- [ ] SMS/Email notifications
- [ ] Payment gateway integration
- [ ] Parent mobile app
- [ ] Learning Management System (LMS)

### Version 3.0 (Future)
- [ ] AI-powered student performance prediction
- [ ] Automated report card generation
- [ ] Video conferencing integration
- [ ] Blockchain certificates
- [ ] Advanced data analytics

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database toolkit [Prisma](https://www.prisma.io/)
- Icons by [Lucide](https://lucide.dev/)

---

Made with ❤️ for schools worldwide