# CloudNote Vercel Deployment Guide

This guide covers deploying **CloudNote – Cloud-Based Notes Management System** (React + TypeScript + Vite + Tailwind CSS + Firebase Auth + Cloud Firestore) to **Vercel** via **GitHub**.

---

## 1. Upload the Project to GitHub

1. Create a new repository on [GitHub](https://github.com/new) (leave **Add a README**, **.gitignore**, and **license** unchecked).
2. From your local project root directory, run:

```bash
git init
git add .
git status   # Confirm .env, .env.local, .vercel/, node_modules/, and dist/ are NOT staged
git commit -m "Prepare CloudNote for Vercel deployment"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

---

## 2. Import the GitHub Repository into Vercel

1. Sign in to [Vercel](https://vercel.com/) with your GitHub account.
2. Click **Add New… → Project**.
3. Select your **CloudNote** GitHub repository and click **Import**.

---

## 3. Build & Project Settings

Vercel reads `vercel.json` automatically, and you should verify these settings in the **Configure Project** screen:

| Setting | Value |
| --- | --- |
| **Framework Preset** | `Vite` |
| **Root Directory** | `./` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

> **Why `npm install`?** This repository includes `bun.lock` and does not include `package-lock.json`. Using `npm install` (or `bun install` if you select Bun) avoids lockfile mismatch errors during installation.

---

## 4. Configure Firebase Environment Variables in Vercel

In `src/firebase/config.ts`, CloudNote reads its Firebase Web SDK credentials from Vite `import.meta.env` variables (`VITE_FIREBASE_*`). Environment variables from local `.env` files or Google AI Studio do **not** transfer to Vercel automatically.

In Vercel, open **Project Settings → Environment Variables** (or expand **Environment Variables** during initial import) and add the following variables for **Production**, **Preview**, and **Development**:

| Variable Name | Value / Source |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your Web App → `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `cloudnote-d9f26.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `cloudnote-d9f26` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `cloudnote-d9f26.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → Your Web App → `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings → Your Web App → `appId` |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | `(default)` |

> **Security note:** Client `VITE_FIREBASE_*` values are public Web App identifiers for Firebase SDK initialization. Never place Firebase Admin SDK service-account private keys in `VITE_*` variables or commit them to Git.

---

## 5. Deploy to Vercel

1. Click **Deploy** in Vercel.
2. Vercel runs `npm install`, executes `npm run build`, publishes the `dist/` folder to its global edge network, and serves `index.html` for all SPA routes via `vercel.json` rewrites.
3. Once the build completes, Vercel provides your live URL (e.g., `https://<your-project>.vercel.app`).

---

## 6. Configure Firebase Authorized Domains & Auth Providers

After Vercel assigns your deployment domain, authorize it in Firebase so **Firebase Authentication** works in production:

1. Open the [Firebase Console](https://console.firebase.google.com/) and select project **`cloudnote-d9f26`**.
2. Go to **Build → Authentication → Sign-in method** and ensure **Email/Password** and **Google** are enabled.
3. Go to **Build → Authentication → Settings → Authorized domains**.
4. Click **Add domain** and add your Vercel production domain (for example, `<your-project>.vercel.app`, plus any custom domain if attached).
5. Ensure your Firestore security rules (`firestore.rules`) are deployed to `cloudnote-d9f26` so `users/{userId}/notes/{noteId}` remains protected by authentication.

---

## 7. Automatic Deployments from GitHub

Vercel's GitHub integration enables automatic CI/CD out of the box:

- **Production Deployments**: Every push or merged pull request to the `main` branch automatically triggers a fresh production build and deployment.
- **Preview Deployments**: Every pull request or push to a non-production branch automatically creates an isolated Vercel Preview URL for testing before merging.
- Verify or customize branch behavior anytime under **Vercel → Project Settings → Git**.

---

## 8. Troubleshooting Common Deployment Errors

- **404 NOT_FOUND on page refresh or direct URL access**:
  - Verify `vercel.json` is committed in the project root with the `"/(.*)" -> "/index.html"` rewrite rule.
- **Google Sign-In fails with `auth/unauthorized-domain`**:
  - Add your exact `*.vercel.app` domain (and custom domain, if any) under **Firebase Console → Authentication → Settings → Authorized domains**.
- **Email/Password sign-in fails with `auth/operation-not-allowed`**:
  - Enable the **Email/Password** provider under **Firebase Console → Authentication → Sign-in method**.
- **App uses old project or shows `auth/invalid-api-key`**:
  - Confirm all 7 `VITE_FIREBASE_*` environment variables are saved in Vercel for the **Production** environment and trigger a **Redeploy** (since Vite injects env vars at build time).
- **Firestore returns `Missing or insufficient permissions`**:
  - Verify `VITE_FIREBASE_FIRESTORE_DATABASE_ID` matches your Firestore database ID (`(default)`) and that `firestore.rules` has been deployed to `cloudnote-d9f26`.
- **`npm ci` fails during build**:
  - Set Vercel's **Install Command** to `npm install` (or commit a `package-lock.json` generated locally with `npm install --package-lock-only`).
