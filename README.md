# NestJS Backend Codebase

My implementation of a codebase in NestJS for a project quick start.

Give me a **Star** if you like it!

## Features

The codebase natively support:

- **JWT-based** authentication with access and refresh token flow
- **Google OAuth 2.0** integration for social login
- **Role-based access control** (RBAC) with granular permissions
- **TypeORM** integration with PostgreSQL
- Structured **Logging** service with configurable log levels and possibilities for extensions
- **Pagination**
- **Swagger/OpenAPI** documentation with detailed annotations
- Robust **Exception Filters** and response interceptors
- **Input validation** using class-validator
- **Healthcheck** endpoints
- Multi-stage **Docker** containerization for optimized production images
- **ESLint** and **Prettier** for code quality enforcement
- **Git hooks** with Husky and lint-staged for pre-commit validation
- Flexible **Environment Config** for development, testing, and production by changing .env file

## Usage

Create a `.env` file similar to `.env.example`

### Development

```bash
yarn install
yarn run start:dev
```

### Docker for production

```bash
docker build -t nestjs-app .
docker run --network=ipv6-enabled -p 3000:3000 --env-file .env --name my-nestjs-app nestjs-app
```
