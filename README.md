<div align="center">

# 🏫 EduSphere
**The Next-Gen Multi-Tenant School ERP System**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](#)
[![Version](https://img.shields.io/badge/version-1.1_PRODUCTION-success.svg)](#)
[![Developer](https://img.shields.io/badge/Developer-Vivek-blueviolet.svg)](#)

A centralized administrative platform seamlessly powering isolated, full-featured school instances.<br>
Designed for scale. Built for modern education.

[Get Started](#-quick-start) • [Architecture](#-architecture-overview) • [Features](#-core-modules) • [Documentation](./docs)

</div>

---

## ✨ Why EduSphere?

EduSphere transforms school management through a true **database-per-tenant architecture**. 
One central **Admin Portal** dynamically manages unlimited schools, each operating securely within its own isolated **School ERP** environment. 

### 🚀 Key Highlights
- **🏢 100% Data Isolation**: Every school operates in an independent PostgreSQL database.
- **⚡ Modern Tech Stack**: React 19, Next.js 15, Node.js 20+, and Prisma ORM.
- **🏗️ Enterprise Ready**: 16 robust modules, 40+ pages, 75+ REST APIs.
- **🧠 Smart Workflows**: RFID integration, auto-syncing APIs, and real-time backend updates.

---

## 🧩 Core Modules

<div align="center">

| 🏢 **Admin Portal** | 🎓 **School ERP** |
|:-----------------|:---------------|
| 🔄 **Provisioning**: 1-click database creation | 👥 **Student & Staff**: Complete lifecycle management |
| 📊 **Global Analytics**: Cross-school insights | 📅 **Academics**: From class routines to report cards |
| 💳 **Billing**: Built-in subscription management | 🕒 **RFID Integration**: Real-time physical attendance tracking |
| 🛡️ **Monitoring**: System health checks & audit logs | 💰 **Finance**: Advanced fee structures & dynamic receipts |
| 🔐 **Access Control**: Super Admin capabilities | 📚 **Assets**: Seamless Library and Inventory tracking |

</div>

---

## 🛠 Tech Stack

EduSphere decouples the client and server components to leverage the best modern web tools.

* **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui
* **Backend**: Express.js, Node.js 20+, JWT Auth, Socket.io (Real-time events)
* **Database**: PostgreSQL 15+, Prisma ORM (Database-per-tenant configuration)
* **Infrastructure**: Docker & Docker Compose integration for rapid multi-service setup.

---

## ⚡ Quick Start

Deploy locally in minutes! Ensure you have **Node.js 20+**, **PostgreSQL 15+**, and **Docker** ready.

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/EduSphere.git
cd EduSphere

# 2. Start PostgreSQL via Docker (or use your local instance)
docker-compose up -d
```

### 🚀 Launch Admin Portal
```bash
# Setup Backend
cd Admin/server
npm install && npx prisma db push && npm run dev

# Setup Frontend (In a new terminal)
cd Admin/client
npm install && npm run dev
```

### 🏫 Launch School ERP
```bash
# Setup Backend
cd erp/server
npm install && npx prisma db push && npm run dev

# Setup Frontend (In a new terminal)
cd erp/client
npm install && npm run dev
```

**Access Points**:
- **Admin Dashboard**: `http://localhost:3000` (API: `5000`)
- **School Workspace**: `http://localhost:3001` (API: `5001`)

---

## 🧬 Architecture Overview

EduSphere uses a dynamic tenant isolation model for maximum security and scalability:
1. **Master DB (`edusphere_admin`)**: Central hub for tenant metadata, subscriptions, and super-users.
2. **Tenant DBs (`edusphere_school_*`)**: Databases provisioned on the fly, ensuring 100% data partition between schools.

For a deeper dive, read the full [Architecture Guide](./ARCHITECTURE.md).

---

## 🤝 Support & Documentation

<div align="center">
Developed and maintained by <b>Team Edusphere </b>.
Made with ❤️ as part of the <b>EduSphere</b>suite.
<br><br>

[Deployment Docs](./docs/deployment/) • [Database Schema](./docs/DATABASE_SCHEMA.md) • [API Specs](./docs/api/) • [Contribute](./CONTRIBUTING.md)
</div>
