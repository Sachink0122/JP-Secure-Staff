# JP Secure Staff - Enterprise Internal Portal

Production-ready enterprise internal portal with role-based access control (RBAC) and comprehensive security features.

## Project Structure

### Backend Structure

```
backend/
├── config/              # Configuration management
│   └── index.js        # Centralized config with env vars
├── controllers/        # Business logic controllers
├── middleware/         # Express middleware
│   ├── auth.js        # JWT authentication
│   ├── rbac.js        # Permission-based authorization
│   └── errorHandler.js # Global error handling
├── models/             # Mongoose data models
├── routes/             # API route definitions
├── services/           # Service layer (business logic)
├── validators/         # Input validation schemas
├── utils/              # Utility functions
│   └── logger.js       # Winston logger configuration
├── uploads/            # File upload storage
├── logs/               # Application logs
├── server.js           # Express server entry point
├── package.json        # Dependencies
├── .env.example        # Environment variables template
├── Dockerfile          # Production Docker image
└── .dockerignore       # Docker ignore rules
```

**Backend Module Explanations:**

- **config/**: Centralized configuration management with environment variable support. Validates production settings.
- **controllers/**: Request handlers that process business logic and return responses.
- **middleware/**: Express middleware for authentication, authorization, error handling, and request processing.
- **models/**: Mongoose schemas defining data structures and validation rules.
- **routes/**: API endpoint definitions organized by feature/module.
- **services/**: Reusable business logic layer, separate from controllers for better testability.
- **validators/**: Input validation using express-validator, ensuring data integrity.
- **utils/**: Shared utility functions (logger, helpers, etc.).
- **uploads/**: Secure file storage for document uploads.
- **logs/**: Application logs with rotation and retention policies.

### Frontend Structure

```
frontend/
├── public/             # Static assets
├── src/
│   ├── components/     # Reusable UI components
│   │   ├── common/    # Common components (buttons, inputs, etc.)
│   │   └── features/  # Feature-specific components
│   ├── layouts/        # Layout components
│   │   ├── PublicLayout.jsx    # Unauthenticated layout
│   │   └── ProtectedLayout.jsx # Authenticated layout
│   ├── pages/          # Page components
│   │   ├── auth/      # Authentication pages
│   │   ├── dashboard/ # Dashboard pages
│   │   └── ...        # Other feature pages
│   ├── routes/         # Route configuration
│   ├── services/       # API service layer
│   │   └── api.js     # Axios configuration
│   ├── store/          # State management (Zustand)
│   │   └── authStore.js # Authentication state
│   ├── utils/          # Utility functions
│   │   └── rbac.js    # Permission checking helpers
│   ├── hooks/          # Custom React hooks
│   ├── App.jsx         # Main app component
│   ├── main.jsx        # Application entry point
│   └── index.css       # Global styles
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
├── .env.example        # Environment variables template
├── Dockerfile          # Production Docker image
└── nginx.conf          # Nginx configuration for production
```

**Frontend Module Explanations:**

- **components/**: Reusable React components organized by type (common vs feature-specific).
- **layouts/**: Layout wrappers for different route types (public/protected).
- **pages/**: Full page components corresponding to routes.
- **routes/**: Route configuration and route guards.
- **services/**: API communication layer with axios, interceptors, and error handling.
- **store/**: Zustand state management for global state (auth, user, permissions).
- **utils/**: Helper functions including RBAC utilities for permission checking.
- **hooks/**: Custom React hooks for reusable logic.

## Technology Stack

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web framework
- **MongoDB**: Database (via Mongoose ODM)
- **JWT**: Authentication tokens
- **Winston**: Logging
- **Helmet**: Security headers
- **Express Rate Limit**: API rate limiting

### Frontend
- **React 18**: UI library
- **React Router**: Client-side routing
- **Vite**: Build tool and dev server
- **Zustand**: State management
- **React Query**: Server state management
- **Axios**: HTTP client
- **React Hook Form**: Form handling
- **Yup**: Schema validation

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jp-secure-staff
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Servers**

   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

### Docker Deployment

1. **Build and start all services**
   ```bash
   docker-compose up -d
   ```

2. **View logs**
   ```bash
   docker-compose logs -f
   ```

3. **Stop services**
   ```bash
   docker-compose down
   ```

## Environment Variables

### Backend (.env)
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port (default: 5000)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `FRONTEND_URL`: Frontend URL for CORS

### Frontend (.env)
- `VITE_API_BASE_URL`: Backend API base URL
- `VITE_API_TIMEOUT`: API request timeout (ms)

## Security Features

- JWT-based authentication
- Permission-based authorization (RBAC)
- Rate limiting
- Security headers (Helmet)
- Input validation
- Error handling
- Audit logging (to be implemented)

## Development Guidelines

1. **Backend Validation**: All endpoints must have backend validation
2. **Error Handling**: Never skip error handling
3. **RBAC**: Use permission flags, never hardcode roles
4. **Production Ready**: Write production-ready code only
5. **No Business Logic**: This phase focuses on structure only

## Next Steps

- Implement authentication endpoints
- Create data models
- Build API routes
- Implement frontend pages
- Add business logic following guard rules

## License

Proprietary - JP Secure Staff

