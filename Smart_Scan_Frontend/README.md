# Smart Scan Frontend

Next.js frontend application for Smart Scan - a modern visiting card management system.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

3. Generate Prisma Client (if needed):
```bash
npx prisma generate
```

4. Run development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
Smart_Scan_Frontend/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/              # Utility functions and API client
├── public/           # Static assets
├── types/            # TypeScript type definitions
└── prisma/           # Prisma schema (shared with backend)
```

## Features

- Modern, responsive UI built with Tailwind CSS
- JWT-based authentication
- Contact management with search and filters
- AI-powered OCR for visiting card extraction
- VCF export functionality
- Duplicate detection
- Notes and address management

## Technology Stack

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Prisma ORM
