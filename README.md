# Fireact.dev Source Code

This repository contains the complete source code for the Fireact.dev project, combining the React frontend application and Firebase Cloud Functions backend code into a single, unified repository.

## Overview

This repository is the main development workspace for the fireact.dev framework. It contains all the source code, development tools, and configurations needed to build and test the complete SaaS application framework locally.

The source code is organized using a **symlink-based monorepo architecture**, which allows for efficient code sharing between the main source and NPM packages while maintaining a single source of truth.

## Development Environment

This repository is configured for local development and testing. To ensure the Firebase emulators work correctly, you need to build both the React application and the Cloud Functions.

It uses:
- **Firestore emulators** for local database testing and development
- **Stripe CLI** for testing payment flows and webhook handling locally
- **Firebase emulators** for authentication and cloud functions testing
- **Vite** for fast development server with hot module replacement

## Project Structure

This repository follows a **symlink-based monorepo** structure, combining the React application and Firebase Cloud Functions into a single codebase. The core components are organized into the following main packages:

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

## Understanding the Symlink Architecture

This repository uses **symbolic links (symlinks)** to create a single source of truth while supporting multiple package outputs:

```
source/
├── src/                        # ⭐ Main source code (SINGLE SOURCE OF TRUTH)
│   ├── components/            # React components
│   ├── contexts/              # React contexts
│   ├── hooks/                 # Custom hooks
│   ├── config/                # Configuration files
│   ├── layouts/               # Page layouts
│   └── utils/                 # Utility functions
│
├── functions/src/             # ⭐ Cloud Functions source (SINGLE SOURCE OF TRUTH)
│   └── functions/            # Individual function modules
│
└── packages/                  # NPM packages (use symlinks)
    ├── app/
    │   └── src/              # 🔗 Symlinks to ../../src/
    │       ├── components -> ../../../src/components
    │       ├── contexts -> ../../../src/contexts
    │       ├── hooks -> ../../../src/hooks
    │       └── ...
    │
    └── functions/
        └── src/              # 🔗 Symlinks to ../../functions/src/
            └── functions -> ../../../functions/src/functions
```

### Why Symlinks?

**Benefits:**
- ✅ **Single source of truth**: All code lives in one place (`src/` and `functions/src/`)
- ✅ **No duplication**: Changes are immediately reflected in all packages
- ✅ **Easy maintenance**: Update once, affects everywhere
- ✅ **NPM publishing**: Packages can be independently published
- ✅ **Clean separation**: Packages organized for distribution

**Development Workflow:**
1. Edit files in `src/` or `functions/src/`
2. Changes automatically available in `packages/app/` and `packages/functions/`
3. Build and test as usual
4. No manual copying or synchronization needed

## Getting Started

### Prerequisites
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Firebase CLI** - `npm install -g firebase-tools`
- **Stripe CLI** (for payment testing) - [Installation Guide](https://stripe.com/docs/stripe-cli)
- **Git** (for version control)

### Development Setup

1. **Clone the repository** (if not already cloned):
   ```bash
   git clone <repository-url>
   cd source
   ```

2. **Install dependencies**:
   ```bash
   # Install root dependencies
   npm install

   # Install functions dependencies
   cd functions
   npm install
   cd ..
   ```

3. **Configure Firebase**:
   ```bash
   # Login to Firebase
   firebase login

   # Select your Firebase project
   firebase use --add
   ```

4. **Set up configuration files**:

   **Firebase Configuration** (`src/config/firebase.config.json`):
   ```json
   {
     "firebase": {
       "apiKey": "your-api-key",
       "authDomain": "your-project.firebaseapp.com",
       "projectId": "your-project-id",
       "storageBucket": "your-project.appspot.com",
       "messagingSenderId": "123456789",
       "appId": "your-app-id"
     },
     "emulators": {
       "enabled": true,
       "auth": {
         "host": "localhost",
         "port": 9099
       },
       "firestore": {
         "host": "localhost",
         "port": 8080
       },
       "functions": {
         "host": "localhost",
         "port": 5001
       }
     }
   }
   ```

   **Stripe Configuration** (`functions/src/config/stripe.config.json`):
   ```json
   {
     "secretKey": "sk_test_...",
     "publishableKey": "pk_test_...",
     "endpointSecret": "whsec_..."
   }
   ```

5. **Build the application and functions**:
   ```bash
   # Build React application
   npm run build

   # Build Cloud Functions
   cd functions
   npm run build
   cd ..
   ```

6. **Start Firebase emulators**:
   ```bash
   firebase emulators:start
   ```

   This will start:
   - **Hosting**: http://localhost:5002 (your React app)
   - **Auth Emulator**: http://localhost:9099
   - **Firestore Emulator**: http://localhost:8080
   - **Functions Emulator**: http://localhost:5001
   - **Emulator UI**: http://localhost:4000

7. **Start Stripe CLI** (in a separate terminal):
   ```bash
   stripe listen --forward-to http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1/stripeWebhook
   ```

   **Important:** Copy the webhook signing secret (starts with `whsec_`) and update `functions/src/config/stripe.config.json`, then rebuild functions.

### Development Workflow

**Making Changes:**

1. **Edit source files** in `src/` or `functions/src/`
2. **For React app changes**:
   ```bash
   # Rebuild
   npm run build
   # Or use dev mode for hot reload
   npm run dev
   ```

3. **For Cloud Functions changes**:
   ```bash
   cd functions
   npm run build
   cd ..
   # Restart emulators
   firebase emulators:start
   ```

**Hot Reload Development:**

```bash
# Terminal 1: Watch and rebuild React app
npm run dev

# Terminal 2: Watch and rebuild functions
cd functions
npm run build -- --watch

# Terminal 3: Run emulators
firebase emulators:start

# Terminal 4: Stripe webhook forwarding
stripe listen --forward-to http://127.0.0.1:5001/YOUR_PROJECT_ID/us-central1/stripeWebhook
```

### Testing

The development environment provides:
- **Local Firestore database** with emulated data
- **Authentication emulator** for user management testing
- **Local cloud functions** for API testing
- **Stripe webhook testing** via Stripe CLI
- **Hot module replacement** for fast development

**Test Scenarios:**
- User sign-up and authentication
- Subscription creation and management
- Payment method handling
- User invitation and permissions
- Billing details updates

**Test Data:**
Use Stripe test card numbers:
- Success: `4242 4242 4242 4242`
- Requires authentication: `4000 0025 0000 3155`
- Declined: `4000 0000 0000 9995`

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Firebase Cloud Functions, TypeScript
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Payments**: Stripe
- **Development**: Firebase Emulators, Stripe CLI

## Documentation

For detailed setup instructions, API documentation, and deployment guides, visit the main project documentation at [fireact.dev](https://fireact.dev).

## Directory Structure Reference

```
source/
├── src/                           # Main React application source
│   ├── App.tsx                   # Main app component with routing
│   ├── components/               # React components
│   │   ├── auth/                # Authentication components
│   │   ├── common/              # Reusable UI components
│   │   └── navigation/          # Navigation components
│   ├── contexts/                 # React Context providers
│   │   ├── AuthContext.tsx      # Authentication state
│   │   ├── ConfigContext.tsx    # App configuration
│   │   ├── LoadingContext.tsx   # Loading states
│   │   └── SubscriptionContext.tsx  # Subscription data
│   ├── hooks/                    # Custom React hooks
│   ├── layouts/                  # Page layouts
│   ├── config/                   # Configuration files
│   ├── i18n/                     # Internationalization
│   └── utils/                    # Utility functions
│
├── functions/                    # Cloud Functions
│   └── src/
│       ├── functions/           # Function implementations
│       │   ├── subscription/    # Subscription management
│       │   ├── billing/         # Billing operations
│       │   └── invite/          # User invitations
│       └── config/              # Configuration files
│
├── packages/                     # NPM packages (symlinked)
│   ├── app/                     # @fireact.dev/app package
│   └── functions/               # @fireact.dev/functions package
│
├── public/                       # Static assets
├── firebase.json                 # Firebase configuration
├── firestore.rules              # Firestore security rules
├── firestore.indexes.json       # Firestore indexes
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # TailwindCSS configuration
└── package.json                 # Root package.json
```

## Common Tasks

### Adding a New Component

1. Create component in `src/components/`:
   ```bash
   # Example: Creating a new feature component
   touch src/components/MyFeature.tsx
   ```

2. Export from package index (if needed):
   ```typescript
   // packages/app/src/index.ts
   export { MyFeature } from './components/MyFeature';
   ```

3. Import and use:
   ```typescript
   import { MyFeature } from '@fireact.dev/app';
   ```

### Adding a New Cloud Function

1. Create function in `functions/src/functions/`:
   ```typescript
   // functions/src/functions/myFeature/myFunction.ts
   import * as functions from 'firebase-functions';

   export const myFunction = functions.https.onCall(
     async (data, context) => {
       // Implementation
     }
   );
   ```

2. Export from index:
   ```typescript
   // functions/src/index.ts
   export { myFunction } from './functions/myFeature/myFunction';
   ```

3. Build and deploy:
   ```bash
   cd functions
   npm run build
   firebase deploy --only functions:myFunction
   ```

### Updating Dependencies

```bash
# Update root dependencies
npm update

# Update functions dependencies
cd functions
npm update
cd ..

# Check for outdated packages
npm outdated
```

### Managing Emulator Data

```bash
# Export emulator data
firebase emulators:export ./emulator-data

# Start with exported data
firebase emulators:start --import=./emulator-data

# Start with data and auto-export on exit
firebase emulators:start --import=./emulator-data --export-on-exit
```

## Troubleshooting

### Symlinks Not Working

If symlinks are broken (common on Windows):

```bash
# Recreate symlinks (macOS/Linux)
cd packages/app/src
rm -rf components contexts hooks config layouts utils
ln -s ../../../src/components components
ln -s ../../../src/contexts contexts
ln -s ../../../src/hooks hooks
ln -s ../../../src/config config
ln -s ../../../src/layouts layouts
ln -s ../../../src/utils utils
```

For Windows, use administrator terminal:
```powershell
# In packages/app/src/
mklink /D components ..\..\..\src\components
mklink /D contexts ..\..\..\src\contexts
# ... repeat for other directories
```

### Build Errors

```bash
# Clean and rebuild
rm -rf node_modules dist
npm install
npm run build

cd functions
rm -rf node_modules lib
npm install
npm run build
```

### Emulator Issues

```bash
# Check Java version (required for Firestore emulator)
java -version

# Clear emulator cache
rm -rf ~/.cache/firebase/emulators

# Check port availability
lsof -i :5173  # Vite
lsof -i :9099  # Auth
lsof -i :8080  # Firestore
lsof -i :5001  # Functions
lsof -i :5002  # Hosting
```

For more troubleshooting, see [TROUBLESHOOTING.md](../TROUBLESHOOTING.md).

## Contributing

This is the main development repository for fireact.dev. When contributing:

1. **Make changes in the correct location:**
   - Edit actual source in `src/` or `functions/src/`
   - NOT in `packages/` (those are symlinks)

2. **Follow the development workflow:**
   - Create feature branch
   - Make changes
   - Build and test locally
   - Submit pull request

3. **Test locally using the emulator suite:**
   - Test with Firebase emulators
   - Test Stripe integration with Stripe CLI
   - Verify all features work as expected

4. **Code quality:**
   - Run linter: `npm run lint`
   - Fix TypeScript errors
   - Follow existing code patterns
   - Add comments for complex logic

For detailed contribution guidelines, see [CONTRIBUTING.md](../CONTRIBUTING.md).

## Additional Resources

- **Main Documentation**: [fireact.dev](https://fireact.dev)
- **API Documentation**: [docs.fireact.dev](https://docs.fireact.dev)
- **Architecture Guide**: [ARCHITECTURE.md](../ARCHITECTURE.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](../TROUBLESHOOTING.md)
- **GitHub Issues**: [Report bugs and request features](https://github.com/fireact-dev/source/issues)

## License

This project is open source and available under the [MIT License](../LICENSE).
