# @fireact.dev/app

This package contains the core React frontend application for Fireact.dev. It is designed to be a comprehensive foundation for building modern SaaS applications with Firebase, React, TypeScript, and TailwindCSS.

## Overview

The `@fireact.dev/app` package provides all the necessary UI components, pages, and client-side logic for a Fireact application. It handles key functionalities such as:

- User authentication and management
- Role-based access control
- Team member invitations
- Subscription interfaces and management

This package is built with Vite, TypeScript, and TailwindCSS, ensuring a modern and efficient development experience.

## Installation

This package is primarily intended to be used as part of a complete Fireact application created via the `create-fireact-app` CLI tool. It is not typically installed or used in isolation.

To create a new Fireact application that includes this package, follow these steps:

1.  **Install the CLI (if you haven't already)**:
    ```bash
    npm install -g create-fireact-app
    ```

2.  **Create a new project**:
    ```bash
    create-fireact-app <your-project-name>
    ```
    Replace `<your-project-name>` with the desired name for your new application.

3.  **Follow the prompts**: The CLI will guide you through selecting your Firebase project and configuring Stripe.

4.  **After creation**:
    Navigate into your new project directory:
    ```bash
    cd <your-project-name>
    ```
    Then, build the application and functions, and start the emulators:
    ```bash
    npm run build && cd functions && npm run build && cd ..
    firebase emulators:start
    ```
    For Stripe webhook testing, in a separate terminal:
    ```bash
    stripe listen --forward-to http://127.0.0.1:5001/<your-firebase-project-id>/us-central1/stripeWebhook
    ```
    Remember to update `functions/src/config/stripe.config.json` with the new webhook endpoint secret and rebuild functions (`cd functions && npm build`) if the webhook secret changes.

## Development

When developing within the main Fireact.dev source repository, changes to this package are managed as part of the monorepo. Refer to the root `source/README.md` for detailed development setup and testing instructions.

## Tech Stack

-   React
-   TypeScript
-   Vite
-   TailwindCSS
-   Firebase (Auth, Firestore)
-   Stripe React SDK

## License

This package is open source and available under the [MIT License](LICENSE).
