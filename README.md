# NestJS Backend Codebase

A comprehensive NestJS backend implementation with modern authentication, real-time features, and microservices architecture.

Give me a **Star** if you like it!

## Features

### 🔐 Authentication & Authorization

- **JWT-based authentication** with access and refresh token flow (stored in secure HTTP-only cookies)
- **Google OAuth 2.0** and **Facebook OAuth** integration for social login
- **Role-based access control (RBAC)** with granular permissions system
- Custom guards and decorators for route protection

### 🗄️ Database & Storage

- **MongoDB** integration with Mongoose ODM
- **AWS S3** integration for file storage with presigned URLs
- Flexible schema design with proper relationships

### 🌐 Real-time & Communication

- **WebSocket Gateway** for real-time AI assistant features
- **gRPC client integration** for microservices communication
- Support for transcription, note generation, and health check services

### 🏗️ Architecture & Development

- **Modular architecture** with feature-based modules
- **Structured logging** service with configurable log levels
- **Pagination** support with customizable query options
- **Input validation** using class-validator and DTOs
- **Exception handling** with custom filters for HTTP and WebSocket
- **Response transformation** with standardized API responses

### 📚 Documentation & Quality

- **Swagger/OpenAPI** documentation with detailed annotations
- **ESLint** and **Prettier** for code quality enforcement
- **Husky** git hooks with lint-staged for pre-commit validation
- Comprehensive **unit and e2e tests** with Jest

### 🚀 DevOps & Deployment

- **Multi-stage Docker** containerization for optimized production images
- **Health check endpoints** with system monitoring
- **Environment-based configuration** for all deployment stages
- **CI/CD pipeline** ready with GitHub Actions

## Quick Start

### Prerequisites

- Node.js (v18+ recommended)
- MongoDB instance
- AWS S3 bucket (for file storage)
- gRPC services (optional, for AI features)

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd nestjs-backend
```

2. Install dependencies

```bash
yarn install
```

3. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Development

```bash
# Start in development mode with hot reload
yarn start:dev

# Start with debug mode
yarn start:debug

# Build for production
yarn build

# Start production server
yarn start:prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t nestjs-app .

# Run container
docker run -p 3000:3000 --env-file .env --name my-nestjs-app nestjs-app
```

## API Endpoints

### Authentication

- `POST /auth/login` - Local authentication
- `POST /auth/refresh` - Refresh JWT tokens
- `POST /auth/logout` - Logout user
- `GET /auth/google` - Google OAuth login
- `GET /auth/facebook` - Facebook OAuth login

### User Management

- `GET /users` - List users (paginated)
- `POST /users` - Create user
- `GET /users/:id` - Get user details
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Roles & Permissions

- `GET /roles` - List roles
- `POST /roles` - Create role
- `GET /permissions` - List permissions
- `POST /permissions` - Create permission

### File Storage

- `POST /blob/presigned-url` - Generate S3 presigned URL

### Health & Monitoring

- `GET /health` - Application health check

## WebSocket Events

### AI Assistants (`/ws/ai-assistants`)

- `ping` - Connection health check
- `chat_message` - Send chat message
- `session_created` - Session establishment
- `session_closed` - Session termination

## Testing

```bash
# Run unit tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:cov

# Run e2e tests
yarn test:e2e
```

## Code Quality

```bash
# Lint code
yarn lint

# Format code
yarn format
```

## Environment Variables

Key environment variables to configure:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# Change to your PostgreSQL host
# Using host.docker.internal NOT localhost if you run the app in Docker and PostgreSQL on the host machine
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DATABASE=postgres

# JWT Authentication
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

# Swagger
SWAGGER_ENABLED=true
SWAGGER_TITLE=NestJS API
SWAGGER_DESCRIPTION=NestJS API Documentation
SWAGGER_VERSION=1.0

# AWS S3 settings
AWS_REGION=your-aws-region
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-s3-bucket-name
S3_PRESIGNED_URL_EXPIRATION=600

# OPTIONAL
# Google OAuth settings
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback
# Facebook OAuth settings
FACEBOOK_CLIENT_ID=your-facebook-client-id
FACEBOOK_CLIENT_SECRET=your-facebook-client-secret
FACEBOOK_CALLBACK_URL=http://localhost:3000/api/auth/facebook/callback

# Redirect URL after login
REDIRECT_URL_AFTER_LOGIN=http://localhost:3000/

# grpc settings
GRPC_SERVICES_URL=localhost:50051
GRPC_API_KEY=your-grpc-api-key
```

## Project Structure

```
src/
├── common/           # Shared utilities, decorators, filters
├── config/           # Configuration files
├── modules/          # Feature modules
│   ├── auth/         # Authentication & authorization
│   ├── users/        # User management
│   ├── roles/        # Role management
│   ├── permissions/  # Permission management
│   ├── ai-assistants/# WebSocket AI features
│   ├── grpc-clients/ # gRPC service clients
│   ├── s3/           # File storage
│   └── health/       # Health checks
├── app.module.ts     # Root application module
└── main.ts           # Application entry point
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED License.
