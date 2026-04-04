# My Fullstack App

A production-oriented cross-platform fullstack application built as a monorepo with a shared backend API, a mobile client built with Expo / React Native, and a web delivery pipeline. The project demonstrates practical fullstack engineering across backend architecture, authentication, media uploads, mobile-first UI development, testing, and automated deployment.

## Overview

`My Fullstack App` is a social-style multi-platform application where users can:

- sign up and log in securely;
- manage their profile and privacy settings;
- create posts with uploaded images;
- like and comment on posts;
- follow other users;
- handle private accounts and follow request flows;
- discover recommended users;
- use the product on mobile and web through the same backend platform.

The repository is structured as a monorepo with three main parts:

- `server/` — backend API;
- `mobile/` — main client application built with Expo / React Native;
- `client/` — legacy Vite-based web client.

In the current architecture, the production web version is built from the `mobile/` app using Expo Web, which keeps the product aligned across platforms.

---

## Key Features

### User Features

- JWT-based authentication
- Sign up and login flows
- Current user profile retrieval
- Username update
- Account privacy toggle
- User search
- Followers / followings management
- Private account follow request workflow
- Recommended users feed
- Post creation with image uploads
- Post likes and comments
- Avatar upload and deletion

### Backend Features

- REST API built with Express 5
- Layered backend architecture
- MySQL database with Sequelize ORM
- Secure password hashing with `bcrypt`
- JWT authentication and protected routes
- File uploads with Multer
- Global error handling
- Request logging with Pino
- Security middleware with Helmet and CORS
- Rate limiting for general API traffic and auth endpoints
- Health check endpoints for deployment and monitoring
- Integration tests with Vitest and Supertest

### Frontend / Mobile Features

- Cross-platform app built with Expo and React Native
- Shared product direction for native mobile and web
- Secure token persistence
- Theme handling and persistent preferences
- Responsive API client configuration for local, LAN, and production environments
- Animated onboarding and navigation flows
- Store-build readiness with EAS configuration

---

## Tech Stack

### Backend

- Node.js
- Express 5
- Sequelize
- MySQL
- JWT
- bcrypt
- Multer
- Helmet
- CORS
- express-rate-limit
- Pino / pino-http
- Vitest
- Supertest

### Frontend / Mobile

- React
- React Native
- Expo
- Expo Secure Store
- Expo Image Picker
- Expo Blur
- Expo Audio
- React Navigation
- React Native Reanimated
- Moti
- TypeScript in selected modules

### DevOps / Deployment

- GitHub Actions
- PM2
- Nginx
- AWS EC2
- Expo Web export
- EAS build configuration

---

## Architecture

### Monorepo Structure

```text
my-fullstack-app/
├── server/      # Express API + Sequelize + MySQL
├── mobile/      # Expo / React Native app + Expo Web
├── client/      # legacy Vite web client
├── docs/        # deployment-related snippets
└── .github/     # CI/CD workflows
Backend Design
The backend follows a layered architecture:

router — route registration and middleware composition
controller — request / response handling
service — business logic
model — Sequelize models and associations
This separation improves maintainability, scalability, and testability.

Core Backend Modules
auth — signup, login, current user, username change, privacy update
account — profile data, user search, followers, followings, follow requests, avatar management
post — create posts, list posts, post detail, like handling
comment — add comments to posts
follow — follow relationship model and logic
recommended — recommended users logic
Data Model
Main domain entities include:

User
Post
PostImage
Like
Comment
Follow
The project includes associations for:

users and follower/following relationships;
users and posts;
posts and uploaded images;
posts and likes;
posts and comments;
users and comments.
Security and Reliability
The backend includes a number of production-focused practices:

helmet for HTTP hardening
configurable cors policy
global and auth-specific rate limiting
password hashing via bcrypt
JWT-protected routes
centralized error middleware
health check endpoints:
/api/health
/health
The application also exposes database health through the health endpoint, which is useful for deployment verification and runtime monitoring.

Testing
The backend includes integration tests covering key API flows, including:

signup and login
JWT token issuance
authenticated current-user retrieval
post listing
private account access restrictions
private post access for approved followers
Testing stack:

Vitest
Supertest
isolated test environment configuration
MySQL service in CI
CI/CD and Deployment
Continuous Integration
The repository includes a GitHub Actions workflow that:

starts a MySQL service;
creates a test environment file;
runs database migrations;
executes backend integration tests.
Production Deployment
Production deployment is automated through GitHub Actions and includes:

building the web version from mobile/ using expo export --platform web;
deploying the web build to the Nginx-served frontend directory;
installing backend dependencies;
deploying backend code to the server;
preserving uploaded user media between deployments;
generating the production .env;
running database migrations;
reloading the backend with PM2;
reloading Nginx;
verifying application health after deployment.
Infrastructure
AWS EC2 for hosting
PM2 for process management
Nginx for reverse proxying and static asset delivery
The project also includes Nginx configuration support for /uploads, allowing avatar and post media to work correctly in production and on mobile clients.

Local Development
Backend
bash

cd server
npm install
npm run migrate
npm run dev
A valid .env file is required for database and JWT configuration.

Mobile App
bash

cd mobile
npm install
cp .env.example .env
npm start
Set EXPO_PUBLIC_API_URL to the correct backend URL:

local machine / browser
LAN IP for physical device testing
production API URL for deployed environments
Legacy Web Client
bash

cd client
npm install
npm run dev
Note: client/ is a legacy web client and is no longer the main production frontend. The deployed web build is generated from mobile/ via Expo Web.

Environment Configuration
Backend
Typical backend environment variables include:

PORT
NODE_ENV
DB_HOST
DB_USER
DB_PASSWORD or DB_PASS
DB_NAME
JWT_SECRET
CORS_ORIGIN
LOG_LEVEL
Test configuration uses dedicated variables such as:

DB_HOST_TEST
DB_USER_TEST
DB_PASSWORD_TEST
DB_NAME_TEST
Mobile
EXPO_PUBLIC_API_URL
What This Project Demonstrates
This project reflects practical experience in:

designing fullstack application architecture;
building REST APIs for real product workflows;
structuring backend code with a layered approach;
working with relational data models using MySQL and Sequelize;
implementing authentication and protected access;
handling file uploads and user-generated media;
building cross-platform mobile-first interfaces with Expo / React Native;
integrating web and mobile clients with a single backend platform;
writing integration tests for critical flows;
setting up CI/CD pipelines;
deploying production workloads with EC2, PM2, and Nginx.
Project Status
The project already includes a solid production-ready foundation and is designed for further growth, including expanded social features, deeper test coverage, enhanced UI/UX, and future mobile distribution through EAS builds.

Contact
If you would like to discuss this project, collaboration opportunities, or engineering roles, please use the contact information provided in my GitHub profile, CV, or LinkedIn.


######