# Smart Scan Backend

Express.js backend API server for Smart Scan application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Update `.env` with your configuration:
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Strong random string for JWT tokens
- `FRONTEND_URL`: Frontend application URL (for CORS)
- `PORT`: Backend server port (default: 5000)
- `GEMINI_API_KEY`: Google Gemini API key
- `OCR_SPACE_API_KEY`: OCR Space API key

4. Generate Prisma Client:
```bash
npx prisma generate
```

5. Run migrations (if needed):
```bash
npx prisma migrate dev
```

## Running

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Contacts
- `GET /api/contacts` - Get all contacts (with pagination)
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/:id` - Get single contact
- `PUT /api/contacts/:id` - Update contact
- `DELETE /api/contacts/:id` - Delete contact

### Upload
- `POST /api/upload` - Upload and process visiting card image

### Export
- `GET /api/export?filter=all|unsent|sent` - Export contacts as VCF

### Stats
- `GET /api/stats` - Get dashboard statistics

### Profile
- `PATCH /api/profile` - Update user profile
- `GET /api/user` - Get current user data

## Authentication

All protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

Tokens are issued on login and expire after 7 days.

