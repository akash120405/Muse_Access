# Muse Access Review

Muse is a lightweight, static access-review dashboard. It helps a team keep an inventory of app connections, their owners, business purpose, permissions, last-used evidence, exceptions, and next review date.

## Features

- Responsive dashboard with high-priority, review-soon, and safe-to-leave summaries
- Searchable connection inventory with risk filters and detail drawer
- Add and edit connection records, plus a draft change proposal with workflow impact and recovery guidance
- CSV report export
- Review history, owner overview, and configurable review cadence
- Local browser storage; no backend, analytics, account connection, or credential storage
- GitHub Pages deployment through GitHub Actions

## Run locally

Open `index.html` in a browser, or start a static server from this folder:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Publish on GitHub Pages

1. Create a new GitHub repository and upload or push the contents of this folder to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Push a commit to `main` or run **Deploy Muse to GitHub Pages** from the Actions tab.
5. GitHub will show the published URL under **Settings → Pages** after the deployment completes.

The included workflow uploads the repository root as a static site. No build step or secret is required.

## Data and privacy

The initial entries are illustrative sample data. Replace them before using Muse for a real review. Records are saved in `localStorage` on the current browser and device. Clearing browser storage removes them. CSV exports are downloaded to the user's device.

Muse does not connect to providers or verify their actual authorization settings. Confirm scope, expiry, owner, and last-used details in the provider's security or admin console. Record permission names and review metadata only. Never enter passwords, API keys, OAuth tokens, payment details, or private message contents.

## Risk guide

- **High priority:** access can send, buy, delete, publish, change permissions, or expose highly sensitive data.
- **Review soon:** access is broader than needed, dormant, or shared across unrelated workflows.
- **Safe to leave:** access is justified for a named workflow and limited to what it needs.

## Built with

HTML, CSS, and vanilla JavaScript. No framework or package install is required.
