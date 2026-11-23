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

Apply the additive `20261123100000_add_employee_pin_auth` migration before starting the updated server. Configure a stable `EMPLOYEE_PIN_PEPPER` across all application instances, separate from `AUTH_SECRET`. Generate it with `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"` and store it in the deployment secret store. Keep the existing `AUTH_SECRET` and set `AUTH_URL` to the canonical HTTPS origin. The reverse proxy must replace `X-Real-IP` with the trusted client address and block direct public access to the Next.js origin. Employee login fails closed if the pepper is missing. Changing the pepper requires employees to reset their PINs.

Before switching traffic, identify active employees with missing or shared phones, confirm each has a unique verified number, and schedule staffed token issuance at cutover. Existing employees should use their original account instead of registering again. Keep the prior release available for rollback until the enrollment and credential smoke tests succeed. Employee passwords and old employee sessions stop working with the new release. Existing admin and supervisor credentials continue to work through their separate portals. New PIN-only accounts need separate staff password provisioning before they can be considered for a supervisor role.

Open the employee record in Admin, approve it if necessary, and verify the employee’s identity and control of their phone in person or through an established JWS contact. Issue a setup token and share it privately with the verified employee. The token is valid for 15 minutes and can be pasted into the employee PIN setup form. Do not put it in a URL or a shared message. Issuing a replacement revokes the previous PIN and sessions immediately. If two profiles share a phone number, verify which employee controls it and require a different verified number for the other. The migration does not assign any login phone numbers.

Employee sessions last 12 hours, or up to 90 days if the employee remembers the device. Employee cookies and session refreshes follow the absolute database deadline. Admin and Supervisor sessions keep their rolling 30-day duration. Valid-format submissions are limited to five attempts per normalized phone and 30 per client IP per 15-minute window for each of login and setup. Configure an upstream abuse limit as well for public authentication traffic and ensure the deployment includes the Argon2 native binary for its platform.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
