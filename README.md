# Fireact.dev Source Code

This repository contains the complete source code for the Fireact.dev project, including both the React frontend application and Firebase Cloud Functions backend code.

## Overview

The `/source` repository is the main development workspace for the fireact.dev framework. It contains all the source code, development tools, and configurations needed to build and test the complete SaaS application framework locally.

## Development Environment

This repository is configured for local development using:
- **Firestore emulators** for local database testing and development
- **Stripe CLI** for testing payment flows and webhook handling locally
- **Firebase emulators** for authentication and cloud functions testing

## Project Structure

The repository follows a monorepo structure with the following key packages and directories:

### Core Packages

- **`packages/app/`**: The React application package
  - Contains the main React frontend application
  - Built with Vite, TypeScript, and TailwindCSS
  - Includes all UI components, pages, and client-side logic
  - Handles authentication, user management, and subscription interfaces

- **`packages/functions/`**: The Cloud Functions package
  - Contains all backend logic and API endpoints
  - Built with Firebase Cloud Functions and TypeScript
  - Handles server-side operations, Stripe webhooks, and database operations
  - Manages subscription logic and payment processing

### Additional Directories

- **`functions/`**: Firebase Cloud Functions configuration and deployment files
- **`src/`**: React application source code (main app entry point)
- **`public/`**: Static assets for the React application
- **`docs/`**: Component and layout documentation

### Configuration Files

- `firebase.json`: Firebase project configuration
- `firestore.rules`: Firestore security rules
- `firestore.indexes.json`: Database indexes configuration
- `package.json`: Main project dependencies and scripts
- `vite.config.ts`: Vite build configuration
- `tailwind.config.js`: TailwindCSS configuration

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Firebase CLI
- Stripe CLI (for payment testing)

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start Firebase emulators**:
   ```bash
   npm run emulators
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Start Stripe CLI** (in a separate terminal):
   ```bash
   stripe listen --forward-to localhost:5001/your-project/us-central1/stripeWebhook
   ```

### Testing

The development environment provides:
- Local Firestore database with emulated data
- Authentication emulator for user management testing
- Local cloud functions for API testing
- Stripe webhook testing via Stripe CLI

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Firebase Cloud Functions, TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Development**: Firebase Emulators, Stripe CLI

## Documentation

For detailed setup instructions, API documentation, and deployment guides, visit the main project documentation at [fireact.dev](https://fireact.dev).

## Contributing

This is the main development repository for fireact.dev. When contributing:
1. Make changes in the appropriate package (`packages/app/` or `packages/functions/`)
2. Test locally using the emulator suite
3. Ensure all tests pass before submitting pull requests

## License

This project is open source and available under the [MIT License](../LICENSE).
