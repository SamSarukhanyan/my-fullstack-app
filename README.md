# My Fullstack App

Production-oriented fullstack monorepo with three application layers:

- `server/` — Express 5 REST API with Sequelize and MySQL
- `client/` — React 19 + Vite web frontend
- `mobile/` — Expo / React Native mobile app

This repository represents a social-style product architecture with authentication, profiles, privacy rules, follow relationships, posts with image uploads, comments, likes, testing, and deployment automation.

## Current Architecture

The repository is organized as a monorepo, but each app has a clear role:

- `server/` is the shared backend platform used by the web and mobile clients.
- `client/` is the current production web build target.
- `mobile/` is the native-first client for iOS/Android and can also be validated/exported separately with Expo.

Important: the current production deploy workflow builds and publishes the web app from `client/`, not from `mobile/`.

## What The Product Currently Does

Confirmed from the current codebase:

- user signup and login with JWT authentication
- authenticated current-user retrieval
- username change
- account privacy toggle
- user search
- followers / followings listing
- follow request flow for private accounts
- accept / decline follow requests
- recommended users endpoint
- profile fetch by user id
- avatar upload and avatar deletion
- post creation with image upload
- post feed / user post retrieval
- like toggle on posts
- comments on posts
- API and database health reporting

## System Design

### Backend

The backend in `server/` uses a layered module structure:

- `router` — route definitions and middleware composition
- `controller` — request / response handling
- `service` — business rules and data orchestration
- `model` — Sequelize models and associations

Main API areas:

- `auth` — signup, login, current user, username update, privacy update
- `account` — search, profile lookup, followers, followings, requests, avatar, recommendations
- `post` — feed retrieval, post creation, single post, likes
- `comment` — add comment to post

Backend runtime characteristics:

- Express 5
- MySQL + Sequelize
- JWT auth
- bcrypt password hashing
- Helmet
- CORS allowlist support via `CORS_ORIGIN`
- global rate limiting plus auth-specific rate limiting
- Multer uploads for `uploads/posts` and `uploads/avatars`
- Pino / pino-http logging
- centralized async error handling
- health endpoints at `/api/health` and `/health`
- static serving for `/uploads`
- optional SPA serving from `client/dist` when the web build exists

### Data Model

The current schema includes these main entities:

- `users`
- `followers`
- `posts`
- `post_images`
- `likes`
- `comments`

Relationship logic implemented in the code includes:

- user-to-user follow relationships with statuses such as requested / followed / unfollowed
- user-to-post ownership
- post-to-image attachments
- post likes by user
- post comments by user
- privacy-aware access checks for private accounts

### Web

The web app in `client/` is a React 19 + Vite frontend. In its current form, it serves mainly as a polished portfolio-style web entry point around the backend platform and runtime signal, including a live health check against the API.

### Mobile

The mobile app in `mobile/` is built with Expo and React Native and contains the broader product UI layer. The current codebase includes:

- onboarding / auth flow screens
- home and profile flows
- create-post flow
- comments screen
- messages / chat / notifications screens
- reels and music-oriented UI work
- theme persistence
- secure auth token storage
- upload helpers that support both native and web FormData behavior
- environment-aware API URL resolution for localhost, LAN device testing, and production URLs

The mobile app also includes `eas.json` profiles for development, preview, and production builds.

## Testing

Backend integration tests live in `server/tests/` and currently cover:

- signup and login
- JWT token issuance
- authenticated `/api/auth/user`
- post retrieval
- private account post restrictions
- private account post access for approved followers

Current test stack:

- Vitest
- Supertest
- MySQL test database

## CI/CD And Deployment

### CI

`.github/workflows/ci.yml` runs on push to `main` and on pull requests. It:

- starts MySQL 8 as a service
- writes `server/.env.test`
- installs server dependencies
- runs migrations
- executes backend tests

### Production Deploy

`.github/workflows/deploy.yml` currently deploys:

- `client/` as the production web frontend
- `server/` as the production API

The deploy pipeline currently:

- builds the Vite web frontend from `client/`
- copies the web build to the Nginx-served frontend directory
- installs backend dependencies
- copies backend code to the server
- preserves uploaded media across deploys
- writes the backend `.env` from GitHub Actions secrets
- runs Sequelize migrations
- reloads PM2 using `ecosystem.config.cjs`
- reloads Nginx
- verifies API health after deploy

### Mobile Validation Workflow

`.github/workflows/mobile-production.yml` is separate from the main production deploy flow. It is a manual workflow used to validate/export the Expo mobile app when needed.

### Infrastructure

The current deployment stack is aligned around:

- AWS EC2
- Nginx
- PM2 cluster mode
- GitHub Actions

## Repository Structure

```text
my-fullstack-app/
├── .github/workflows/   # CI, production deploy, mobile validation workflow
├── client/              # React + Vite web frontend
├── docs/                # deployment and infrastructure notes
├── mobile/              # Expo / React Native app
├── server/              # Express API + Sequelize + MySQL
└── ecosystem.config.cjs # PM2 process configuration
```

## Local Development

### Backend

```bash
cd server
npm install
cp .env.test.example .env.test   # for test reference only
npm run migrate
npm run dev
```

For normal local backend runtime, create `server/.env` with your development database and JWT values.

Typical backend variables used by the current code:

- `PORT`
- `NODE_ENV`
- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD` or `DB_PASS`
- `DB_NAME`
- `JWT_SECRET`
- `CORS_ORIGIN`
- `LOG_LEVEL`

### Web

```bash
cd client
npm install
npm run dev
```

The web app uses `VITE_REACT_APP_API_URL` when provided; otherwise it defaults to relative `/api`.

### Mobile

```bash
cd mobile
npm install
cp .env.example .env
npm start
```

Main mobile environment variable:

- `EXPO_PUBLIC_API_URL`

For real-device Expo Go testing, use your computer's LAN IP in `EXPO_PUBLIC_API_URL`. For browser testing, `localhost` is typically enough. For production mobile builds, use your public API URL.

## Professional Summary

This project demonstrates practical fullstack engineering across:

- backend API architecture
- relational data modeling
- auth and protected access
- media upload handling
- cross-platform mobile client work
- web delivery
- integration testing
- CI/CD automation
- EC2 / Nginx / PM2 deployment operations

## Current Notes

- `client/README.md` is no longer aligned with the real deploy workflow; the active production web deploy is `client/`.
- `docs/domain-https-migration-guide.md` correctly calls out that mismatch and other deployment improvements still worth making.
- The codebase already has a strong production-oriented foundation, but some docs and environment details were previously ahead of or behind the real implementation. This root README is now aligned to the current repository state.
