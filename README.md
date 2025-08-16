# Fireact.dev Source Code

This repository contains the complete source code for the Fireact.dev project, combining the React frontend application and Firebase Cloud Functions backend code into a single, unified repository.

## Overview

This repository is the main development workspace for the fireact.dev framework. It contains all the source code, development tools, and configurations needed to build and test the complete SaaS application framework locally.

## Development Environment

This repository is configured for local development and testing. To ensure the Firebase emulators work correctly, you need to build both the React application and the Cloud Functions.

It uses:
- **Firestore emulators** for local database testing and development
- **Stripe CLI** for testing payment flows and webhook handling locally
- **Firebase emulators** for authentication and cloud functions testing

## Project Structure

This repository follows a monorepo structure, combining the React application and Firebase Cloud Functions into a single codebase. The core components are organized into the following main packages:

### Main Packages

- **`packages/app/`**: The React application package
  - Contains the complete React frontend application.
  - Built with Vite, TypeScript, and TailwindCSS.
  - Includes all UI components, pages, and client-side logic for authentication, user management, and subscription interfaces.

- **`packages/functions/`**: The Cloud Functions package
  - Contains all backend logic and API endpoints.
  - Built with Firebase Cloud Functions and TypeScript.
  - Handles server-side operations, Stripe webhooks, and database interactions, including subscription and payment processing.

### Root Directories

In addition to the main packages, the repository includes the following important root-level directories:

- **`functions/`**: Contains Firebase Cloud Functions configuration and deployment files.
- **`src/`**: The main source directory for the React application, containing its entry points and global styles.
- **`public/`**: Stores static assets for the React application.

### Configuration Files

- `firebase.json`: Firebase project configuration.
- `firestore.rules`: Firestore security rules.
- `firestore.indexes.json`: Database indexes configuration.
- `package.json`: Main project dependencies and scripts.
- `vite.config.ts`: Vite build configuration for the React application.
- `tailwind.config.js`: TailwindCSS configuration.
- `tsconfig.app.json`: TypeScript configuration for the React application.
- `tsconfig.json`: Base TypeScript configuration for the monorepo.
- `tsconfig.node.json`: TypeScript configuration for Node.js environment.

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Firebase CLI
- Stripe CLI (for payment testing)

### Development Setup

1. **Install dependencies**:
   ```bash
   npm install && cd functions && npm install && cd ..
   ```

2. **Build the application and functions**:
   ```bash
   npm run build && cd functions && npm run build && cd ..
   ```

3. **Start Firebase emulators**:
   ```bash
   firebase emulators:start
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
