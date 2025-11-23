# Moovly Telematics - Fleet Management System

## Overview
Moovly Telematics is a comprehensive full-stack fleet management platform featuring real-time tracking, job scheduling, driver management, and analytics. Built with modern web technologies for scalability and performance.

## System Components

### 1. **Moovly Business** (Web Dashboard)
- **Location**: `/frontend` and `/backend`
- **Purpose**: Main fleet management dashboard for dispatchers and administrators
- **Features**:
  - Real-time fleet tracking and monitoring
  - Job creation, assignment, and management
  - Driver and vehicle management
  - Analytics and reporting
  - Customer portal integration
  - Bulk Excel import with smart column mapping
  - Real-time messaging system
  - Route optimization

### 2. **Moovly Connect** (Driver Mobile App)
- **Location**: `/mobile`
- **Purpose**: React Native mobile application for drivers
- **Features**:
  - PIN-based authentication
  - Job acceptance and completion
  - Real-time GPS tracking
  - Offline-first capabilities
  - Vehicle checklists
  - Fuel reporting
  - Dispatcher messaging

### 3. **Shared**
- **Location**: `/shared`
- **Purpose**: Shared TypeScript schemas, types, and utilities
- **Contents**: Database schemas (Drizzle ORM), Zod validation schemas, common types

## Technology Stack

### Frontend (Web Dashboard)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI Components**: Shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Backend (API Server)
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL (Neon)
- **ORM**: Drizzle ORM
- **Real-time**: Socket.io for WebSocket connections
- **Authentication**: Session-based (express-session with PostgreSQL store)
- **File Processing**: XLSX for Excel imports, Multer for file uploads

### Mobile (Driver App)
- **Framework**: React Native
- **Platform**: Expo
- **Navigation**: React Navigation
- **State Management**: React Context + AsyncStorage

## Project Structure

```
moovly_telematics/
├── frontend/           # Web dashboard (React + Vite)
│   ├── src/
│   │   ├── pages/      # Route pages
│   │   ├── components/ # Reusable UI components
│   │   ├── lib/        # Utilities and helpers
│   │   └── hooks/      # Custom React hooks
│   ├── public/         # Static assets
│   └── index.html      # Entry point
│
├── backend/            # API server (Express + TypeScript)
│   ├── routes.ts       # API route definitions
│   ├── storage.ts      # Database interface and operations
│   ├── index.ts        # Server entry point
│   └── vite.ts         # Vite dev server integration
│
├── mobile/             # Driver mobile app (React Native + Expo)
│   ├── app/            # App screens and navigation
│   ├── components/     # Mobile UI components
│   └── package.json    # Mobile dependencies
│
├── shared/             # Shared code between frontend/backend
│   └── schema.ts       # Database schemas and types
│
├── package.json        # Root dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite build configuration
├── tailwind.config.ts  # Tailwind CSS configuration
├── drizzle.config.ts   # Database migration configuration
└── .env.example        # Environment variables template
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- (Optional) Expo CLI for mobile development

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd moovly_telematics
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and API keys
   ```

4. **Set up the database**
   ```bash
   # Push schema to database
   npm run db:push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   
   The application will be available at:
   - Frontend: http://localhost:5000
   - API: http://localhost:5000/api

### Mobile App Setup

1. **Navigate to mobile directory**
   ```bash
   cd mobile
   ```

2. **Install mobile dependencies**
   ```bash
   npm install
   ```

3. **Start Expo development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Scan QR code with Expo Go app (iOS/Android)
   - Or press `i` for iOS simulator, `a` for Android emulator

## Available Scripts

### Root Level
- `npm run dev` - Start development server (frontend + backend)
- `npm run build` - Build for production
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio (database GUI)

### Database Migrations
```bash
# Push schema changes directly (development)
npm run db:push

# Force push (bypass data loss warnings)
npm run db:push -- --force
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/database

# Session Secret
SESSION_SECRET=your-secure-random-string

# Object Storage (optional)
DEFAULT_OBJECT_STORAGE_BUCKET_ID=
PUBLIC_OBJECT_SEARCH_PATHS=
PRIVATE_OBJECT_DIR=

# Firebase (for push notifications - optional)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_PROJECT_ID=

# Web Push (for notifications - optional)
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

## Default Credentials

### Admin Dashboard
- **URL**: http://localhost:5000/login
- **Email**: admin@moovly.com
- **Password**: admin123

### Customer Portal
- **URL**: http://localhost:5000/login (Customer Login tab)
- **Email**: customer@test.com
- **Password**: test123

### Driver Mobile App
- **Username**: driver1
- **PIN**: 1234

## Key Features

### Dashboard Features
- Real-time fleet map with live driver locations
- Job creation with customer autocomplete
- Conditional address fields based on job type
- Bulk Excel import with smart column mapping
- Driver and vehicle management
- Maintenance tracking
- Analytics and reporting
- Real-time messaging between dispatchers and drivers

### Customer Portal
- Order placement with pickup/delivery details
- Real-time order tracking
- Direct messaging with dispatchers
- Order history and status updates

### Mobile App Features
- PIN-based secure login
- Job list with acceptance/completion workflows
- Real-time GPS tracking
- Vehicle inspection checklists
- Fuel reporting
- Offline-first data synchronization
- Push notifications for new jobs

## Database Schema

The application uses Drizzle ORM with PostgreSQL. Main entities:

- **Users**: Administrators, dispatchers, customers
- **Drivers**: Driver profiles with PIN authentication
- **Vehicles**: Fleet vehicles with maintenance tracking
- **Jobs**: Delivery/pickup jobs with status tracking
- **Routes**: Optimized delivery routes
- **Messages**: Real-time chat between users and drivers
- **Maintenance**: Vehicle maintenance records

## Architecture Notes

### Frontend-Backend Communication
- RESTful API for CRUD operations
- WebSocket (Socket.io) for real-time updates
- Session-based authentication with PostgreSQL storage

### Mobile-Backend Communication
- REST API for job data and updates
- Real-time location updates via HTTP polling or WebSocket
- Offline storage with AsyncStorage

### File Upload Flow
1. Frontend uploads Excel file via `/api/bulk-import/upload`
2. Backend processes and extracts columns
3. User maps columns via visual interface
4. Backend validates and imports data in bulk

## Deployment

### Production Build
```bash
npm run build
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy frontend + backend to hosting platform (Replit, Vercel, etc.)

### Mobile App Deployment
1. Configure `app.json` with production credentials
2. Build for iOS: `eas build --platform ios`
3. Build for Android: `eas build --platform android`
4. Submit to App Store / Play Store

## Support & Documentation

### Internal Documentation
- See `Moovly_Telematics_Complete_System_Documentation.md` for comprehensive system details
- Database schema defined in `shared/schema.ts`
- API routes documented in `backend/routes.ts`

### Development Tips
- Use `npm run db:studio` to visually inspect database
- Check browser console for frontend errors
- Check terminal logs for backend API errors
- Use React DevTools for component debugging

## Multi-Region Support

The system automatically detects user location and adjusts:
- Currency (USD, GBP, EUR, ZAR, AUD, NZD, CAD)
- Regional flags and locale
- Pricing based on geographic location

## Security Considerations

- Session-based authentication with secure cookies
- Password hashing for user accounts
- PIN-based driver authentication
- CORS protection
- SQL injection prevention via parameterized queries (Drizzle ORM)
- File upload validation and sanitization

## License

Proprietary - Moovly Telematics © 2025

## Contact

For support or inquiries, contact: support@moovly.com
