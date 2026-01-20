# JP Secure Staff - Complete Folder Structure

## Backend Structure

```
backend/
├── config/
│   └── index.js                 # Centralized configuration
├── controllers/                 # Business logic controllers
├── middleware/
│   ├── auth.js                  # JWT authentication middleware
│   ├── rbac.js                  # Permission-based authorization
│   └── errorHandler.js          # Global error handler
├── models/                      # Mongoose data models
├── routes/                      # API route definitions
├── services/                    # Service layer (business logic)
├── validators/                  # Input validation schemas
├── utils/
│   └── logger.js                # Winston logger
├── uploads/                     # File upload storage
├── logs/                        # Application logs
├── server.js                    # Express server entry point
├── package.json                 # Dependencies
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── Dockerfile                   # Production Docker image
└── .dockerignore                # Docker ignore rules
```

## Frontend Structure

```
frontend/
├── public/                      # Static assets
├── src/
│   ├── components/
│   │   ├── common/              # Common UI components
│   │   └── features/            # Feature-specific components
│   ├── layouts/
│   │   ├── PublicLayout.jsx    # Unauthenticated layout
│   │   └── ProtectedLayout.jsx # Authenticated layout
│   ├── pages/
│   │   ├── auth/
│   │   │   └── LoginPage.jsx   # Login page
│   │   ├── dashboard/
│   │   │   └── DashboardPage.jsx # Dashboard
│   │   └── NotFoundPage.jsx    # 404 page
│   ├── routes/                  # Route configuration
│   ├── services/
│   │   └── api.js              # Axios API service
│   ├── store/
│   │   └── authStore.js        # Zustand auth store
│   ├── utils/
│   │   └── rbac.js             # Permission utilities
│   ├── hooks/                   # Custom React hooks
│   ├── App.jsx                  # Main app component
│   ├── main.jsx                 # Application entry point
│   └── index.css                # Global styles
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js               # Vite configuration
├── .env.example                 # Environment variables template
├── .gitignore                   # Git ignore rules
├── Dockerfile                   # Production Docker image
└── nginx.conf                   # Nginx configuration
```

## Root Files

```
.
├── docker-compose.yml           # Docker Compose configuration
├── .gitignore                   # Root git ignore
├── README.md                    # Project documentation
└── STRUCTURE.md                 # This file
```

## Module Purpose Summary

### Backend Modules

| Module | Purpose |
|--------|---------|
| `config/` | Centralized configuration with environment variable support and production validation |
| `controllers/` | Request handlers that process business logic and return HTTP responses |
| `middleware/` | Express middleware for auth, RBAC, error handling, and request processing |
| `models/` | Mongoose schemas defining data structures, validation, and relationships |
| `routes/` | API endpoint definitions organized by feature/module |
| `services/` | Reusable business logic layer, separate from controllers for testability |
| `validators/` | Input validation using express-validator for data integrity |
| `utils/` | Shared utilities (logger, helpers, formatters) |
| `uploads/` | Secure file storage for document uploads |
| `logs/` | Application logs with rotation and retention policies |

### Frontend Modules

| Module | Purpose |
|--------|---------|
| `components/` | Reusable React components (common vs feature-specific) |
| `layouts/` | Layout wrappers for different route types (public/protected) |
| `pages/` | Full page components corresponding to routes |
| `routes/` | Route configuration and route guards |
| `services/` | API communication layer with axios, interceptors, error handling |
| `store/` | Zustand state management for global state (auth, user, permissions) |
| `utils/` | Helper functions including RBAC utilities for permission checking |
| `hooks/` | Custom React hooks for reusable logic |

## Key Features

✅ **Production-Ready**: Security headers, rate limiting, error handling
✅ **RBAC**: Permission-based authorization (no hardcoded roles)
✅ **Docker Support**: Full Docker Compose setup for development and production
✅ **Environment-Based Config**: All configuration via environment variables
✅ **Structured Logging**: Winston logger with file rotation
✅ **Type Safety**: Ready for TypeScript migration
✅ **Scalable Architecture**: Clear separation of concerns

