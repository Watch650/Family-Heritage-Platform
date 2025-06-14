# Week 1 - Detailed Project Setup Guide
**Digital Family Heritage Platform**

## Pre-Setup Checklist
Before starting, ensure you have:
- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed and running
- [ ] Git configured with GitHub account
- [ ] VS Code or preferred IDE
- [ ] Terminal access

---

## Day 1: Environment Setup & Project Initialization

### Step 1: Create Next.js Project
```bash
# Create new Next.js project with TypeScript
npx create-next-app@latest family-heritage-platform --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# Navigate to project directory
cd family-heritage-platform

# Install additional dependencies
npm install @prisma/client prisma @types/bcryptjs bcryptjs next-auth
npm install react-flow-renderer react-hook-form @hookform/resolvers zod
npm install @tanstack/react-query lucide-react
npm install -D @types/node

# Start development server to test
npm run dev
```

### Step 2: Configure TypeScript & ESLint
**Create `tsconfig.json` updates:**
```json
{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**Update `.eslintrc.json`:**
```json
{
  "extends": [
    "next/core-web-vitals",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error"
  }
}
```

### Step 3: Project Structure Setup
```bash
# Create directory structure
mkdir -p src/components/ui
mkdir -p src/components/family-tree
mkdir -p src/lib
mkdir -p src/types
mkdir -p src/hooks
mkdir -p src/utils
mkdir -p prisma
mkdir -p public/uploads

# Create initial type definitions
touch src/types/index.ts
touch src/types/family.ts
touch src/types/auth.ts
```

### Step 4: Environment Configuration
**Create `.env.local`:**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/family_heritage_db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# App
NODE_ENV="development"
```

**Create `.env.example`:**
```env
# Copy this file to .env.local and fill in your values
DATABASE_URL="postgresql://username:password@localhost:5432/family_heritage_db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key"
NODE_ENV="development"
```

### Step 5: Git Repository Setup
```bash
# Initialize git (if not already done)
git init

# Create .gitignore additions
echo "
# Environment variables
.env.local
.env

# Uploads
public/uploads/*
!public/uploads/.gitkeep

# Database
prisma/dev.db
prisma/dev.db-journal
" >> .gitignore

# Create uploads directory placeholder
touch public/uploads/.gitkeep

# Initial commit
git add .
git commit -m "Initial project setup with Next.js, TypeScript, and Tailwind"

# Connect to GitHub (replace with your repo URL)
git remote add origin https://github.com/yourusername/family-heritage-platform.git
git push -u origin main
```

---

## Day 2: Database Setup with Prisma

### Step 1: Initialize Prisma
```bash
# Initialize Prisma
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env file (if it doesn't exist)
```

### Step 2: Configure Prisma Schema
**Update `prisma/schema.prisma`:**
```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts Account[]
  sessions Session[]
  persons  Person[]

  @@map("users")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Person {
  id          String    @id @default(cuid())
  firstName   String
  lastName    String?
  middleName  String?
  birthDate   DateTime?
  deathDate   DateTime?
  birthPlace  String?
  biography   String?   @db.Text
  photoUrl    String?
  gender      Gender?
  isAlive     Boolean   @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  // Foreign keys
  createdById String
  createdBy   User @relation(fields: [createdById], references: [id])

  // Self-referencing relationships
  parentRelationships Relationship[] @relation("PersonAsParent")
  childRelationships  Relationship[] @relation("PersonAsChild")

  @@map("persons")
}

model Relationship {
  id        String           @id @default(cuid())
  type      RelationshipType
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  // Parent-Child relationship
  parentId String
  childId  String
  parent   Person @relation("PersonAsParent", fields: [parentId], references: [id], onDelete: Cascade)
  child    Person @relation("PersonAsChild", fields: [childId], references: [id], onDelete: Cascade)

  @@unique([parentId, childId, type])
  @@map("relationships")
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

enum RelationshipType {
  BIOLOGICAL_PARENT
  ADOPTIVE_PARENT
  STEP_PARENT
  GUARDIAN
}
```

### Step 3: Database Setup & Migration
```bash
# Create and setup PostgreSQL database
createdb family_heritage_db

# Generate Prisma client
npx prisma generate

# Create and run initial migration
npx prisma migrate dev --name init

# Optional: Open Prisma Studio to view database
npx prisma studio
```

### Step 4: Create Database Client
**Create `src/lib/db.ts`:**
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

### Step 5: Create Seed Data
**Create `prisma/seed.ts`:**
```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 12)
  
  const testUser = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
    },
  })

  // Create sample family members
  const grandpa = await prisma.person.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      birthDate: new Date('1940-01-15'),
      gender: 'MALE',
      birthPlace: 'New York, USA',
      biography: 'Family patriarch, served in the military.',
      createdById: testUser.id,
    },
  })

  const grandma = await prisma.person.create({
    data: {
      firstName: 'Mary',
      lastName: 'Doe',
      birthDate: new Date('1942-03-22'),
      gender: 'FEMALE',
      birthPlace: 'Boston, USA',
      biography: 'Beloved grandmother, worked as a teacher.',
      createdById: testUser.id,
    },
  })

  const father = await prisma.person.create({
    data: {
      firstName: 'Michael',
      lastName: 'Doe',
      birthDate: new Date('1970-07-10'),
      gender: 'MALE',
      birthPlace: 'Chicago, USA',
      createdById: testUser.id,
    },
  })

  // Create relationships
  await prisma.relationship.create({
    data: {
      type: 'BIOLOGICAL_PARENT',
      parentId: grandpa.id,
      childId: father.id,
    },
  })

  await prisma.relationship.create({
    data: {
      type: 'BIOLOGICAL_PARENT',
      parentId: grandma.id,
      childId: father.id,
    },
  })

  console.log('Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
```

**Update `package.json` to include seed script:**
```json
{
  "scripts": {
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "npx prisma migrate reset && npm run db:seed"
  }
}
```

```bash
# Install tsx for running TypeScript files
npm install -D tsx

# Run the seed
npm run db:seed
```

---

## Day 3-4: Authentication System Setup

### Step 1: NextAuth Configuration
**Create `src/lib/auth.ts`:**
```typescript
import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import { db } from './db'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    signUp: '/auth/signup',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email
          }
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      }
    })
  ],
  callbacks: {
    session: ({ session, token }) => {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
        },
      }
    },
    jwt: ({ token, user }) => {
      if (user) {
        const u = user as unknown as any
        return {
          ...token,
          id: u.id,
        }
      }
      return token
    },
  },
}
```

### Step 2: API Route Setup
**Create `src/app/api/auth/[...nextauth]/route.ts`:**
```typescript
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
```

**Create `src/app/api/auth/register/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password } = registerSchema.parse(body)

    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 3: Authentication Components
**Create `src/components/auth/SignInForm.tsx`:**
```typescript
'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type SignInFormData = z.infer<typeof signInSchema>

export default function SignInForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            {...register('email')}
            type="email"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <input
            {...register('password')}
            type="password"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center">{error}</div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
```

### Step 5: Documentation & Testing
**Create `README.md`:**
```markdown
# Digital Family Heritage Platform

A modern web application for creating, visualizing, and managing family trees with collaborative features.

## Technology Stack

- **Frontend:** Next.js 14, React, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL
- **Authentication:** NextAuth.js
- **Visualization:** React Flow (planned for Week 2)

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
- **Relationship**: Parent-child relationships between persons

### Key Features

- User authentication and authorization
- Person management (CRUD operations)
- Relationship tracking
- Biographical information storage
- Photo upload support (planned)

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
```

## Week 1 Accomplishments

- [x] Project setup with Next.js, TypeScript, and Tailwind CSS
- [x] Database schema design and implementation
- [x] User authentication system with NextAuth.js
- [x] Basic CRUD operations for family members
- [x] Dashboard with family statistics
- [x] API endpoints for person management
- [x] Type safety with TypeScript throughout
- [x] Development environment setup

## Next Steps (Week 2)

- [ ] Integrate React Flow for family tree visualization
- [ ] Create interactive family tree component
- [ ] Implement drag-and-drop family member creation
- [ ] Add relationship management UI
- [ ] Photo upload functionality
- [ ] Enhanced person profile pages

## Testing

Create test user credentials:
- Email: `test@example.com`
- Password: `password123`

Or register a new account at `/auth/signup`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
```

**Create `DEVELOPMENT.md`:**
```markdown
# Development Guide

## Week 1 Development Log

### Day 1: Project Initialization
- Set up Next.js 14 with TypeScript and Tailwind CSS
- Configured ESLint and Prettier
- Created project structure and directories
- Set up Git repository and initial commit

**Key Files Created:**
- `package.json` with all dependencies
- `tsconfig.json` with path mapping
- `.eslintrc.json` with TypeScript rules
- Project directory structure

### Day 2: Database Setup
- Designed comprehensive database schema
- Set up Prisma ORM with PostgreSQL
- Created models for User, Person, Relationship
- Implemented database seeding with sample data

**Key Files Created:**
- `prisma/schema.prisma`
- `src/lib/db.ts`
- `prisma/seed.ts`
- Migration files

### Day 3-4: Authentication Implementation
- Implemented NextAuth.js with credentials provider
- Created registration and sign-in API endpoints
- Built authentication forms and pages
- Set up session management and protection

**Key Files Created:**
- `src/lib/auth.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/auth/register/route.ts`
- `src/components/auth/SignInForm.tsx`
- `src/app/auth/signin/page.tsx`

### Day 5: API Layer & Dashboard
- Created service layer for family operations
- Built API endpoints for person management
- Implemented basic dashboard with statistics
- Set up type definitions for family data

**Key Files Created:**
- `src/lib/services/familyService.ts`
- `src/app/api/persons/route.ts`
- `src/app/dashboard/page.tsx`
- `src/types/family.ts`

## Architecture Decisions

### Database Design
- **PostgreSQL**: Chosen for complex relationship handling and data integrity
- **Prisma**: Type-safe ORM with excellent Next.js integration
- **Self-referencing relationships**: Efficient parent-child relationship modeling

### Authentication Strategy
- **NextAuth.js**: Industry-standard authentication for Next.js
- **Credentials provider**: Simple email/password authentication
- **JWT sessions**: Stateless authentication for scalability

### API Design
- **RESTful endpoints**: Standard HTTP methods and status codes
- **Zod validation**: Runtime type checking and validation
- **Error handling**: Consistent error responses with proper status codes

## Code Quality Standards

### TypeScript Configuration
- Strict mode enabled for type safety
- Path mapping for clean imports
- Proper type definitions for all data structures

### Component Structure
- Functional components with hooks
- Props interfaces for type safety
- Separation of concerns (UI vs business logic)

### Error Handling
- Try-catch blocks in API routes
- Validation error responses
- User-friendly error messages

## Testing Strategy

### Manual Testing Checklist
- [ ] User registration works correctly
- [ ] User sign-in and sign-out functionality
- [ ] Protected routes redirect to sign-in
- [ ] Dashboard displays correct user data
- [ ] Person creation API endpoint
- [ ] Database relationships are maintained

### Automated Testing (Future)
- Unit tests for utility functions
- Integration tests for API endpoints
- Component testing with React Testing Library

## Performance Considerations

### Database Optimization
- Proper indexing on frequently queried fields
- Efficient relationship queries with includes
- Connection pooling with Prisma

### Frontend Optimization
- Next.js automatic code splitting
- Image optimization (planned for photo uploads)
- Static generation where possible

## Security Measures

### Authentication Security
- Password hashing with bcrypt
- JWT secret key management
- Session timeout handling

### API Security
- Input validation with Zod
- SQL injection prevention with Prisma
- Rate limiting (to be implemented)

## Development Workflow

### Git Workflow
1. Feature branches for new functionality
2. Descriptive commit messages
3. Regular commits with atomic changes
4. Pull request reviews (if team-based)

### Code Review Checklist
- [ ] TypeScript errors resolved
- [ ] ESLint warnings addressed
- [ ] Proper error handling implemented
- [ ] API endpoints tested manually
- [ ] Database migrations applied

## Troubleshooting Guide

### Common Issues

**Database Connection Errors:**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env.local
- Run `npx prisma generate` after schema changes

**Authentication Issues:**
- Verify NEXTAUTH_SECRET is set
- Check session configuration
- Clear browser cookies if needed

**Build Errors:**
- Run `npm run type-check` for TypeScript errors
- Check import paths are correct
- Verify all dependencies are installed

### Development Commands
```bash
# Reset everything and start fresh
npm run db:reset
npx prisma generate
npm run dev

# Check for issues
npm run lint
npm run type-check
npx prisma validate
```

## Week 1 Metrics

### Code Statistics
- TypeScript files: ~15
- API endpoints: 3
- Database models: 4
- React components: 5
- Lines of code: ~800

### Features Completed
- User authentication system
- Person management CRUD
- Basic dashboard interface
- Database schema implementation
- API layer foundation

### Technical Debt
- No automated tests yet
- Basic error handling (needs improvement)
- No input sanitization beyond validation
- Single user role (no admin features)

## Preparation for Week 2

### Dependencies to Install
```bash
npm install react-flow-renderer @reactflow/core @reactflow/controls @reactflow/minimap
npm install framer-motion # for animations
npm install react-dropzone # for file uploads
```

### Files to Create
- `src/components/family-tree/FamilyTree.tsx`
- `src/components/family-tree/PersonNode.tsx`
- `src/hooks/useFamilyTree.ts`
- `src/utils/treeLayout.ts`

### Research Tasks
- React Flow documentation and examples
- Tree layout algorithms (dagre, elk)
- File upload best practices
- Image optimization techniques
```

**Create `.github/workflows/ci.yml` (Optional CI Setup):**
```yaml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run database migration
      run: npx prisma migrate deploy
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Run build
      run: npm run build
```

---

## Week 1 Completion Checklist

### Technical Deliverables
- [ ] Next.js project with TypeScript setup
- [ ] Tailwind CSS configured and working
- [ ] PostgreSQL database connected
- [ ] Prisma ORM configured with migrations
- [ ] NextAuth.js authentication system
- [ ] User registration and login functionality
- [ ] Protected API routes
- [ ] Basic dashboard interface
- [ ] Person CRUD operations
- [ ] Database seeded with sample data

### Documentation Deliverables
- [ ] README.md with setup instructions
- [ ] DEVELOPMENT.md with technical decisions
- [ ] API documentation (basic)
- [ ] Database schema documentation
- [ ] Git repository with proper commit history

### Testing Deliverables
- [ ] Manual testing of all authentication flows
- [ ] API endpoints tested with sample data
- [ ] Database operations verified
- [ ] Error handling tested
- [ ] Cross-browser compatibility checked

### Deployment Readiness
- [ ] Environment variables properly configured
- [ ] Build process working without errors
- [ ] Database migrations ready for production
- [ ] Security considerations documented

## Post-Week 1 Review Questions

1. **Technical Architecture:**
   - Is the database schema scalable for complex family relationships?
   - Are the API endpoints following RESTful conventions?
   - Is the authentication system secure and user-friendly?

2. **Code Quality:**
   - Is TypeScript being used effectively throughout the codebase?
   - Are components properly structured and reusable?
   - Is error handling comprehensive and user-friendly?

3. **Documentation:**
   - Can a new developer set up the project from the README?
   - Are architectural decisions clearly documented?
   - Is the API documentation sufficient for frontend development?

4. **Project Management:**
   - Are we on track for the 4-week timeline?
   - What challenges were encountered and how were they resolved?
   - What should be prioritized for Week 2?

---

## Week 2 Preparation Tasks

### Before Starting Week 2:
1. **Code Review**: Review all Week 1 code for potential improvements
2. **Dependency Updates**: Install React Flow and related packages
3. **Design Planning**: Sketch out family tree visualization layouts
4. **Data Structure Planning**: Plan how to convert database relationships to tree nodes
5. **Performance Research**: Research best practices for large tree visualizations

### Week 2 Success Criteria:
- Interactive family tree visualization working
- Drag and drop family member creation
- Relationship management through UI
- Photo upload and display functionality
- Responsive design for mobile devices

This completes the comprehensive Week 1 setup guide with all necessary components for a successful foundation.
```

### Step 4: Authentication Pages
**Create `src/app/auth/signin/page.tsx`:**
```typescript
import SignInForm from '@/components/auth/SignInForm'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/auth/signup" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </Link>
          </p>
        </div>
        <SignInForm />
      </div>
    </div>
  )
}
```

### Step 5: Session Provider Setup
**Create `src/components/providers/SessionProvider.tsx`:**
```typescript
'use client'

import { SessionProvider } from 'next-auth/react'

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return <SessionProvider>{children}</SessionProvider>
}
```

**Update `src/app/layout.tsx`:**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/providers/SessionProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Family Heritage Platform',
  description: 'Digital family tree visualization and management platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

---

## Day 5: Basic Database Schema Testing & Documentation

### Step 1: Create Type Definitions
**Create `src/types/family.ts`:**
```typescript
import { Person, Relationship, Gender, RelationshipType } from '@prisma/client'

export type PersonWithRelationships = Person & {
  parentRelationships: (Relationship & {
    child: Person
  })[]
  childRelationships: (Relationship & {
    parent: Person
  })[]
}

export type FamilyTreeNode = {
  id: string
  firstName: string
  lastName?: string
  birthDate?: Date
  deathDate?: Date
  photoUrl?: string
  gender?: Gender
  isAlive: boolean
  position?: { x: number; y: number }
  children: FamilyTreeNode[]
  parents: FamilyTreeNode[]
}

export type CreatePersonInput = {
  firstName: string
  lastName?: string
  middleName?: string
  birthDate?: Date
  deathDate?: Date
  birthPlace?: string
  biography?: string
  gender?: Gender
  isAlive?: boolean
}

export type CreateRelationshipInput = {
  parentId: string
  childId: string
  type: RelationshipType
}
```

### Step 2: Create Database Service Layer
**Create `src/lib/services/familyService.ts`:**
```typescript
import { db } from '@/lib/db'
import { CreatePersonInput, CreateRelationshipInput, PersonWithRelationships } from '@/types/family'

export class FamilyService {
  static async createPerson(data: CreatePersonInput & { createdById: string }) {
    return db.person.create({
      data,
      include: {
        parentRelationships: {
          include: { child: true }
        },
        childRelationships: {
          include: { parent: true }
        }
      }
    })
  }

  static async getPersonById(id: string): Promise<PersonWithRelationships | null> {
    return db.person.findUnique({
      where: { id },
      include: {
        parentRelationships: {
          include: { child: true }
        },
        childRelationships: {
          include: { parent: true }
        }
      }
    })
  }

  static async getPersonsByUser(userId: string) {
    return db.person.findMany({
      where: { createdById: userId },
      include: {
        parentRelationships: {
          include: { child: true }
        },
        childRelationships: {
          include: { parent: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async createRelationship(data: CreateRelationshipInput) {
    return db.relationship.create({
      data,
      include: {
        parent: true,
        child: true
      }
    })
  }

  static async deleteRelationship(parentId: string, childId: string) {
    return db.relationship.deleteMany({
      where: {
        parentId,
        childId
      }
    })
  }

  static async getFamilyTree(userId: string) {
    const persons = await this.getPersonsByUser(userId)
    
    // Transform to tree structure
    const personMap = new Map(persons.map(p => [p.id, p]))
    const roots: PersonWithRelationships[] = []

    persons.forEach(person => {
      if (person.childRelationships.length === 0) {
        roots.push(person)
      }
    })

    return roots
  }
}
```

### Step 3: Create API Endpoints
**Create `src/app/api/persons/route.ts`:**
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { FamilyService } from '@/lib/services/familyService'
import { z } from 'zod'

const createPersonSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  middleName: z.string().optional(),
  birthDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  deathDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  birthPlace: z.string().optional(),
  biography: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  isAlive: z.boolean().default(true),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const persons = await FamilyService.getPersonsByUser(session.user.id)
    return NextResponse.json({ persons })

  } catch (error) {
    console.error('Error fetching persons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const data = createPersonSchema.parse(body)

    const person = await FamilyService.createPerson({
      ...data,
      createdById: session.user.id
    })

    return NextResponse.json({ person })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating person:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### Step 4: Create Test Dashboard
**Create `src/app/dashboard/page.tsx`:**
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FamilyService } from '@/lib/services/familyService'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  const persons = await FamilyService.getPersonsByUser(session.user.id)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Family Dashboard</h1>
        <div className="text-sm text-gray-600">
          Welcome, {session.user.name || session.user.email}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Family Members</h3>
          <p className="text-3xl font-bold text-blue-600">{persons.length}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Generations</h3>
          <p className="text-3xl font-bold text-green-600">
            {Math.max(...persons.map(p => 
              Math.max(p.parentRelationships.length, p.childRelationships.length)
            ), 1)}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Recent Updates</h3>
          <p className="text-3xl font-bold text-purple-600">
            {persons.filter(p => 
              new Date(p.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            ).length}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recent Family Members</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">Latest Additions</h3>
          </div>
          <ul className="divide-y divide-gray-200">
            {persons.slice(0, 5).map((person) => (
              <li key={person.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {person.birthDate ? 
                        `Born: ${person.birthDate.toLocaleDateString()}` : 
                        'Birth date not specified'
                      }
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {person.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div