# Frontend/Backend Separation Guide

This guide explains how the frontend and backend are separated for production deployment.

## Architecture

- **Frontend**: Next.js application (runs on one server)
- **Backend**: Express.js API server (runs on another server)
- **Communication**: HTTP REST API with JWT authentication

## Setup Instructions

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `backend/.env`:
```env
DATABASE_URL="mysql://root:@localhost:3306/visiting_card_db"
JWT_SECRET="your-super-secret-jwt-key"
FRONTEND_URL="http://localhost:3000"
PORT=5000
GEMINI_API_KEY="your_gemini_api_key"
OCR_SPACE_API_KEY="your_ocr_space_api_key"
```

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Start backend server:
```bash
npm run dev  # Development
# or
npm start   # Production
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Configure environment variable in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

2. Start frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## Production Deployment

### Backend Deployment

Deploy the `backend/` directory to a server (e.g., Railway, Render, AWS, etc.):

1. Set environment variables on your hosting platform
2. Run `npm install` and `npx prisma generate`
3. Start with `npm start`

### Frontend Deployment

Deploy the frontend to Vercel, Netlify, or any static hosting:

1. Set `NEXT_PUBLIC_API_URL` to your backend URL (e.g., `https://api.yourdomain.com`)
2. Build and deploy

## Key Changes Made

1. **Authentication**: Replaced NextAuth with JWT tokens
2. **API Client**: Created `lib/api-client.ts` for all API calls
3. **Auth Context**: Created `lib/auth-context.tsx` for authentication state
4. **Backend Routes**: All API routes moved to `backend/routes/`
5. **Middleware**: Updated to check JWT tokens instead of NextAuth sessions

## Testing Locally

1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Access frontend at `http://localhost:3000`
4. Frontend will communicate with backend at `http://localhost:5000`

## Important Notes

- The backend and frontend can now be deployed to different servers
- CORS is configured to allow requests from the frontend URL
- JWT tokens are stored in localStorage on the frontend
- All API calls automatically include the JWT token in the Authorization header

