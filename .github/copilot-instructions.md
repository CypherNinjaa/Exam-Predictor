# AmityMate.ai - GitHub Copilot Instructions

## Project Overview

AmityMate.ai is an AI-powered exam question prediction system built for Amity University Patna students. The application uses **Gemini 3.0** to analyze syllabi and past papers, predicting likely exam questions.

## Memory Management

**IMPORTANT**: Always use the Memory MCP tool to persist and retrieve project context:

1. **Before starting work**: Read memory with `mcp_memory_read_graph` to get project context
2. **After important decisions**: Save observations with `mcp_memory_create_entities` or add to existing entities
3. **Key entities to remember**:
   - `AmityMate.ai` - Main project entity with deployment and feature info
   - `TechStack` - All technologies and versions
   - `DesignSystem` - UI/UX guidelines and component structure
   - `DatabaseSchema` - Prisma models and relationships
   - `FileStructure` - Project organization

## Tech Stack

- **Framework**: Next.js 14.2.33 with App Router (`src/app` directory)
- **Language**: TypeScript (strict mode)
- **Database**: PostgreSQL on Railway with Prisma ORM v5.22.0
- **Authentication**: Clerk (`@clerk/nextjs`, `@clerk/themes` with dark theme)
- **AI Model**: Gemini 3.0 (Google AI)
- **Styling**: TailwindCSS with custom design system
- **Animations**: Framer Motion
- **Icons**: Lucide React (NEVER use emojis)
- **File Uploads**: React Dropzone

## Design System Rules

### Colors

- Background: `#0f0f23` (bg-background)
- Primary: `violet-500` (#8b5cf6)
- Accent: `purple-600`
- Text: White on dark backgrounds
- Muted: `gray-400`, `gray-500`

### Components

Use components from `@/components/ui`:

- `Button` - variants: primary, secondary, ghost, outline, danger
- `Card` - variants: default, glass, gradient
- `Input` - with label, error, and icon support
- `Badge` - color variants: default, violet, green, red, yellow, blue

### Layout Components (`@/components/layout`)

- `Navbar` - Desktop floating navbar (hidden on mobile)
- `MobileHeader` - Mobile top header
- `BottomNav` - Mobile bottom navigation

### Responsive Design

- Desktop: Floating rounded navbar at top
- Mobile: Small header + bottom navigation bar (like modern apps)
- Use `md:` breakpoint for desktop-specific styles
- Use `pt-safe` and `pb-safe` for mobile safe areas

### Strict Rules

1. **NEVER use emojis** - Always use Lucide React icons
2. **Dark theme only** - No light mode
3. **Consistent spacing** - Use Tailwind spacing utilities
4. **Rounded corners** - Use `rounded-xl` or `rounded-2xl`

## File Structure

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard (protected)
│   ├── dashboard/         # User dashboard
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout with Clerk
│   ├── page.tsx           # Landing page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── badge.tsx
│   │   └── index.ts
│   └── layout/            # Navigation components
│       ├── navbar.tsx
│       ├── bottom-nav.tsx
│       ├── mobile-header.tsx
│       └── index.ts
├── lib/
│   ├── prisma.ts          # Prisma client
│   └── utils.ts           # Utility functions (cn)
└── types/                 # TypeScript types
```

## Database Schema (Prisma)

Key models and relationships:

- `User` - Clerk user sync
- `College` - Has many semesters and subjects
- `Subject` - Requires `collegeId`, has offerings
- `SubjectOffering` - Links subject to semester
- `Syllabus` - Has `version` (nullable), NO `title` field
- `Exam` - Has `examType`, `examDate`, `totalMarks`
- `Question` - Linked to topic and unit
- `Prediction` - AI-generated predictions

**Always read `prisma/schema.prisma` before database operations.**

## Code Conventions

### Imports

```typescript
// UI Components
import { Button, Card, Input, Badge } from "@/components/ui";

// Layout Components
import { Navbar, BottomNav, MobileHeader } from "@/components/layout";

// Utilities
import { cn } from "@/lib/utils";

// Icons (always from lucide-react)
import { Sparkles, Home, Upload } from "lucide-react";
```

### Server Actions

- Place in `actions.ts` files within route directories
- Always use `"use server"` directive
- Handle errors gracefully with try-catch
- Return typed responses

### API Routes

- Use Next.js App Router API routes
- Handle database errors with fallback values
- Always return JSON responses

## Deployment

- **Platform**: Railway
- **Database**: PostgreSQL on Railway
- **URL**: exam-predictor-production.up.railway.app
- **Build**: `npm run build`
- **Start**: `npm run start`

## Common Tasks

### Adding a new page

1. Create file in `src/app/[route]/page.tsx`
2. Use `"use client"` for client components
3. Include `Navbar`, `MobileHeader`, and `BottomNav` for navigation
4. Use `pt-safe` and `pb-safe` for mobile spacing

### Adding a new component

1. Create in `src/components/ui/[component].tsx`
2. Export from `src/components/ui/index.ts`
3. Use `cn()` utility for className merging
4. Support variants with TypeScript discriminated unions

### Database changes

1. Update `prisma/schema.prisma`
2. Run `npx prisma generate`
3. Run `npx prisma db push` (development)
4. Update related actions and API routes

## Error Handling

- Railway DB may not be accessible locally - use fallback values
- Always wrap Prisma calls in try-catch
- Log errors with descriptive messages
- Return user-friendly error messages

## Remember

1. Check memory before starting: `mcp_memory_read_graph`
2. Save important context to memory after decisions
3. Read Prisma schema before database work
4. Use existing UI components from `@/components/ui`
5. Follow the design system strictly
6. No emojis - only Lucide icons
7. Test responsive design (mobile bottom nav)
