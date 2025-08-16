# @fireact.dev/functions

This package contains the Firebase Cloud Functions backend code for Fireact.dev. It provides the server-side logic and API endpoints necessary for a complete Fireact application.

## Overview

The `@fireact.dev/functions` package handles critical backend operations, including:

- Processing Stripe webhooks for subscription management
- Managing database interactions with Firebase Firestore
- Implementing server-side business logic
- Handling payment processing

This package is built with Firebase Cloud Functions and TypeScript, ensuring a robust and scalable backend solution.

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

-   Firebase Cloud Functions
-   TypeScript
-   Firebase Firestore
-   Stripe API

## License

This package is open source and available under the [MIT License](LICENSE).
