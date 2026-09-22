# welthtrack.v4 GitHub Pages Guide

1. Push all project files to your repository default branch (`main`).
2. Open **Settings → Pages** and select **GitHub Actions** as the source.
3. Open **Actions** and wait for `Deploy welthtrack.v4 to GitHub Pages` to finish.
4. Open the URL shown in the deployment job.

The Vite app uses a relative asset base (`./`) so it works whether the repository is served from a project URL or a custom domain.

Note: GitHub Pages hosts the frontend only. The local Vite API routes, Gemini key, and Yahoo Finance proxy do not run on GitHub Pages. Do not commit a real API key.
