# Digital Family Heritage Platform

A modern web application for creating, visualizing, and managing family trees with collaborative features.

## Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** NextAuth.js
- **Visualization:** React Flow

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/family-heritage-platform.git
cd family-heritage-platform
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your database credentials
```

4. Set up the database:
```bash
npx prisma migrate dev
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Project Structure

```
src/
├── app/                    # Next.js 13+ app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Dashboard pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── auth/              # Authentication components
│   ├── family-tree/       # Family tree components (Week 2)
│   └── ui/                # Reusable UI components
├── lib/                   # Utility libraries
│   ├── auth.ts            # NextAuth configuration
│   ├── db.ts              # Database client
│   └── services/          # Business logic services
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## Database Schema

### Core Models

- **User**: Application users with authentication
- **Person**: Family members with biographical information
- **Relationship**: Parent-child, Married relationships between people

### Key Features

- User authentication and authorization
- Person management (CRUD operations)
- Relationship tracking
- Biographical information storage
- Photo upload support

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/signin` - User sign in (NextAuth)

### Family Management
- `GET /api/persons` - Get user's family members
- `POST /api/persons` - Create new family member
- `GET /api/persons/[id]` - Get specific person details
- `PUT /api/persons/[id]` - Update person information
- `DELETE /api/persons/[id]` - Delete person

### Relationships
- `PUT /api/relationships` - Update person relationship
- `POST /api/relationships` - Create parent-child relationship
- `DELETE /api/relationships` - Remove relationship

## Development Commands

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run start              # Start production server

# Database
npx prisma studio          # Open database GUI
npx prisma migrate dev     # Create and apply migrations
npm run db:seed            # Seed database with test data
npm run db:reset           # Reset database and re-seed

# Code Quality
npm run lint               # Run ESLint
npm run type-check         # Run TypeScript compiler check