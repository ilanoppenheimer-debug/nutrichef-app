# Migration Plan from Vite to Next.js 16

## Phase 1: Project Assessment
- Review the current Vite project structure and its dependencies.
- Identify features and functionalities that need to be migrated.

## Phase 2: Setup Next.js 16 Environment
- Install Next.js 16 using the command:
  ```bash
  npx create-next-app@latest nutrichef-app-next
  ```
- Set up the project structure and install necessary dependencies.

## Phase 3: TypeScript Configuration
- Add TypeScript support:
  ```bash
  npm install --save-dev typescript @types/react @types/node
  ```
- Create a `tsconfig.json` file:
  ```json
  {
    "compilerOptions": {
      "target": "es5",
      "lib": ["dom", "dom.iterable", "esnext"],
      "allowJs": true,
      "skipLibCheck": true,
      "strict": true,
      "forceConsistentCasingInFileNames": true,
      "noEmit": true,
      "esModuleInterop": true,
      "module": "esnext",
      "moduleResolution": "node",
      "resolveJsonModule": true,
      "isolatedModules": true,
      "jsx": "preserve"
    },
    "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx"],
    "exclude": ["node_modules"]
  }
  ```

## Phase 4: API Routes Migration
- Convert existing API endpoints to Next.js API routes:
  - Create folders in the `pages/api` directory for each API route.
  - Rewrite endpoints using Next.js API route syntax.
  - Example: `pages/api/example.ts`
    ```typescript
    import type { NextApiRequest, NextApiResponse } from 'next';

    export default function handler(req: NextApiRequest, res: NextApiResponse) {
      res.status(200).json({ message: 'Hello from Next.js API!' });
    }
    ```

## Phase 5: Component Migration
- Migrate React components from the Vite project to Next.js pages and components:
  - Place components in the `components` folder.
  - Adjust import paths if necessary.

## Phase 6: TanStack Query Setup
- Install TanStack Query for data fetching:
  ```bash
  npm install @tanstack/react-query
  ```
- Set up QueryClient provider in `_app.tsx`:
  ```typescript
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

  const queryClient = new QueryClient();

  function MyApp({ Component, pageProps }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    );
  }

  export default MyApp;
  ```

## Phase 7: Styling Migration
- Migrate stylesheets and CSS modules:
  - Convert any global styles to a `global.css` file in `styles` folder.
  - Adjust any component-specific styles to use CSS Modules as needed.

## Phase 8: Testing & Verification
- Test the application thoroughly to ensure all features work as expected.
- Verify API routes and component rendering.
- Run any necessary unit and end-to-end tests.

## Phase 9: Deployment Steps
- Choose a deployment platform (e.g., Vercel, Netlify).
- Set up the platform according to their documentation for Next.js.
- Deploy the application and monitor for any issues post-deployment.

---

This migration plan outlines the steps necessary to successfully transition from a Vite-based project to a Next.js 16 application, ensuring a smooth and effective migration process.