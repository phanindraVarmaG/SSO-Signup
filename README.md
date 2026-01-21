# SSO Sign-In Application

A Single Sign-On authentication application with NextJS frontend and NestJS backend.

## Project Structure

```
SSO-signin/
├── frontend/          # NextJS TypeScript frontend
│   ├── src/
│   │   └── app/      # App router pages
│   ├── package.json
│   ├── tsconfig.json
│   └── next.config.ts
│
└── backend/          # NestJS TypeScript backend
    ├── src/
    │   ├── auth/     # Authentication module
    │   ├── app.controller.ts
    │   ├── app.service.ts
    │   ├── app.module.ts
    │   └── main.ts
    ├── package.json
    ├── tsconfig.json
    └── nest-cli.json
```

## Getting Started

### Frontend (NextJS)

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on http://localhost:3000

### Backend (NestJS)

```bash
cd backend
npm install
npm run start:dev
```

The backend API will run on http://localhost:4000

## Features

### Frontend

- NextJS 14 with App Router
- TypeScript configuration
- Responsive design with CSS modules
- Basic landing page structure

### Backend

- NestJS framework
- TypeScript support
- RESTful API endpoints
- Authentication module structure
- CORS enabled for frontend communication
- Health check endpoint

## API Endpoints

- `GET /` - Welcome message
- `GET /health` - Health check
- `GET /auth/status` - Authentication status
- `POST /auth/login` - Login endpoint
- `POST /auth/logout` - Logout endpoint

## Next Steps

1. Implement SSO provider integration (OAuth2, SAML, etc.)
2. Add database configuration (PostgreSQL, MongoDB, etc.)
3. Implement JWT token management
4. Add authentication guards and middleware
5. Create login/signup pages in frontend
6. Add state management (Redux, Zustand, etc.)
7. Implement protected routes
8. Add unit and e2e tests
