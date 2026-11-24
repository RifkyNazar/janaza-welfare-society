This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Employee PIN rollout

The two existing additive employee PIN migrations must be applied. Keep a stable `EMPLOYEE_PIN_PEPPER` and `AUTH_SECRET` across all application instances. Set `AUTH_URL` to the canonical HTTPS origin. The reverse proxy must replace `X-Real-IP` with the trusted client address and block direct public access to the Next.js origin.

Use **Admin ? Employees ? Add Employee** to create an account with a verified Sri Lankan phone number and a six-digit login code. Edit an account to assign a new code or update its profile. A code reset or deactivation revokes its existing sessions. Employees with a valid existing PIN can continue using it. Employees who lack a valid credential need an Admin-assigned code. Admin and Supervisor email/password sign-in remains available through their respective portals.

Employee sessions last 12 hours, or up to 90 days with Remember Device, and follow the absolute database deadline. Valid-format employee login submissions are limited to five attempts per normalized phone and 30 per client IP in 15 minutes. The deployed platform must include its Argon2 native binary.

See [Workflow rollout and operational-team photo recovery](JWS-WORKFLOW-DEPLOYMENT.md) for storage, cleanup and migration preflight.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
