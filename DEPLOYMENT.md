# CloudNote Deployment Guide (GitHub Actions + Firebase Hosting)

This guide walks through deploying **CloudNote – Cloud-Based Notes Management System** to Firebase Hosting (`cloudnote-d9f26`) using GitHub and GitHub Actions.

---

## 1. Create a GitHub Repository

1. Sign in to [GitHub](https://github.com) and click **New repository**.
2. Name the repository `cloudnote` (or your preferred name).
3. Choose **Public** or **Private**, and leave **Initialize with README / .gitignore** unchecked so there are no merge conflicts when pushing your existing code.
4. Copy the repository URL (for example, `https://github.com/<your-username>/cloudnote.git`).

---

## 2. Push the CloudNote Project to GitHub

From your local project root directory, run:

```bash
git init
git add .
git status   # Verify .env, node_modules/, and dist/ are NOT staged
git commit -m "Initial CloudNote commit with CI/CD deployment config"
git branch -M main
git remote add origin https://github.com/<your-username>/cloudnote.git
git push -u origin main
```

> **Note:** Check `.gitignore` before committing. Never commit `.env` files or Firebase service account JSON keys.

---

## 3. Configure GitHub Secrets and Variables

Vite embeds `VITE_FIREBASE_*` environment variables into the JavaScript bundle **at build time**. Environment variables configured in Google AI Studio do **not** transfer automatically to GitHub, so you must configure them in GitHub.

### Step A: Generate a Firebase Service Account Secret (Recommended)

Run the Firebase CLI locally to generate or link a deployment service account, or create one in Google Cloud / Firebase Console:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting:github
```

Alternatively, to create the service account key manually:
1. Open [Firebase Console](https://console.firebase.google.com/) and select project **`cloudnote-d9f26`**.
2. Go to **Project Settings → Service accounts**.
3. Click **Generate new private key** and download the JSON file (keep it secure and never commit it to Git).

### Step B: Add Secrets in GitHub

Open your GitHub repository and navigate to **Settings → Secrets and variables → Actions → New repository secret**, then add all of the following secrets:

| Secret Name | Where to Find the Value |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_CLOUDNOTE_D9F26` | Full JSON contents of your Firebase service account key |
| `VITE_FIREBASE_API_KEY` | Firebase Console → Project Settings → Your Web App → `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `cloudnote-d9f26.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | `cloudnote-d9f26` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `cloudnote-d9f26.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console → Project Settings → Your Web App → `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | Firebase Console → Project Settings → Your Web App → `appId` |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | `(default)` (or your specific Firestore database ID if using a named database) |

---

## 4. Configure Firebase Hosting, Authentication & Firestore

Before users sign in on the live site, verify these settings in the Firebase Console for **`cloudnote-d9f26`**:

1. **Firebase Hosting**:
   - Ensure Firebase Hosting is initialized for project `cloudnote-d9f26`.
   - `firebase.json` is already configured with `"public": "dist"`, SPA rewrites (`**` → `/index.html`), and `"rules": "firestore.rules"`.
2. **Firebase Authentication**:
   - Go to **Build → Authentication → Sign-in method**.
   - Enable **Email/Password** and **Google**.
   - Go to **Build → Authentication → Settings → Authorized domains** and confirm that both:
     - `cloudnote-d9f26.web.app`
     - `cloudnote-d9f26.firebaseapp.com`
     are listed.
3. **Cloud Firestore & Security Rules**:
   - Deploy your Firestore security rules at least once via Firebase CLI (the Hosting GitHub Action deploys the `dist/` web app):
     ```bash
     firebase use cloudnote-d9f26
     firebase deploy --only firestore:rules
     ```
   - Confirm `users/{userId}/notes/{noteId}` remains protected by `request.auth != null && request.auth.uid == userId`.

---

## 5. Deploy Using GitHub Actions

Two automated workflows are included in `.github/workflows/`:

- **Production Deployment (`firebase-hosting-merge.yml`)**:
  - Automatically runs whenever you push or merge commits into the `main` branch.
  - Installs dependencies (`npm install`), runs `npm run lint`, builds `dist/` (`npm run build`), and deploys to the Firebase Hosting `live` channel.
- **Pull Request Preview (`firebase-hosting-pull-request.yml`)**:
  - Automatically runs when a pull request targeting `main` is opened or updated.
  - Deploys a temporary Firebase Hosting preview URL and posts it directly as a comment on the pull request.

You can monitor pipeline progress under the **Actions** tab in your GitHub repository.

---

## 6. Obtain the Public Application URL

Once `Deploy to Firebase Hosting on Merge` completes with a green checkmark:
1. Open the **Actions** run log and expand the **Deploy to Firebase Hosting (Live)** step to view the live URL, or check **Firebase Console → Hosting**.
2. Your default Firebase Hosting URLs will be:
   - `https://cloudnote-d9f26.web.app`
   - `https://cloudnote-d9f26.firebaseapp.com`

---

## 7. Troubleshooting Deployment Errors

- **Build fails with missing module or lockfile errors**:
  - Run `npm install` locally and commit `package-lock.json` if you later switch workflows to `npm ci`.
- **Blank page or `Firebase: Error (auth/invalid-api-key)` on the deployed site**:
  - Verify all `VITE_FIREBASE_*` repository secrets are spelled identically and have no extra quotes or trailing spaces, then re-run the workflow.
- **Google Sign-In popup fails with `auth/unauthorized-domain`**:
  - Add `cloudnote-d9f26.web.app` and `cloudnote-d9f26.firebaseapp.com` under **Firebase Console → Authentication → Settings → Authorized domains**.
- **Email/Password registration fails with `auth/operation-not-allowed`**:
  - Enable the **Email/Password** provider under **Firebase Console → Authentication → Sign-in method**.
- **GitHub Action fails during `Deploy to Firebase Hosting` with 403 / permission error**:
  - Confirm `FIREBASE_SERVICE_ACCOUNT_CLOUDNOTE_D9F26` belongs to project `cloudnote-d9f26` and has the **Firebase Hosting Admin** IAM role.
- **Firestore returns `Missing or insufficient permissions`**:
  - Ensure `firestore.rules` is deployed to the active Firestore database (`firebase deploy --only firestore:rules`) and `VITE_FIREBASE_FIRESTORE_DATABASE_ID` matches your database ID (`(default)` or your named database).

---

## 8. Post-Deployment Verification Checklist

1. Visit `https://cloudnote-d9f26.web.app` in an incognito browser window.
2. Register a new account with Email/Password (or sign in with Google).
3. Create a note, verify it appears immediately, refresh the page, and confirm the note loads from Cloud Firestore.
4. Test pinning, editing, searching, and deleting a note.
5. Open a second browser/device, log in with the same account, and confirm notes synchronize across sessions.
6. Confirm in **Firebase Console → Firestore Database → Data** that the document appears under `users/{userId}/notes/{noteId}`.
