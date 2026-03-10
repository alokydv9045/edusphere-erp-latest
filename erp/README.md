# EduSphere ERP

EduSphere ERP is a comprehensive, full-stack school management system designed to streamline administration, academics, HR, and student services.

## Architecture

The system is split into two primary applications:
1. **Frontend (Client)**: A modern, responsive dashboard built with Next.js 14 (App Router), React, Tailwind CSS, and shadcn/ui.
2. **Backend (Server)**: A robust Express.js REST API with Prisma ORM, providing real-time data to the client.

## Features

- **Responsive Dashboard Layouts**: A unified, mobile-first dashboard experience using flexible grid and flexbox wrappers for seamless layouts across viewports.
- **Academics & Admissions**: Registration systems, class management, scheduling, exams, and detailed results processing.
- **Human Resources (HR)**: Employee directory, integrated payroll management, leave tracking, and attendance handling.
- **Inventory & Services**: Library issue tracking, general school inventory, transport services, and hostel management.
- **Real-Time Announcements**: A dynamic global notification bar with modal pop-ups for critical school updates.

## Getting Started

To get started with development, you will need to run both the server and client applications simultaneously.

### 1. Start the Server

Navigate to the `server` directory, install dependencies, and start the development server:

```bash
cd server
npm install
npm run dev
```

### 2. Start the Client

In a separate terminal, navigate to the `client` directory:

```bash
cd client
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

## Production Build

To prepare the application for production, run the build scripts in both environments:

**Server**:
```bash
cd server
npm run build 
```
*(This will generate the Prisma client).*

**Client**:
```bash
cd client
npm run build
```
*(This will create an optimized Next.js production build).*
