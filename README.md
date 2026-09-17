# Workout Tracker

A personal, offline-first workout log built as an installable web app (PWA) for iPhone. No App Store, no backend, no account — everything is stored locally in your phone's browser via IndexedDB.

## Features

- Log a workout **session** (date + one or more exercises, each with weight/reps/optional note)
- Manage your **exercise** list (add, rename, archive)
- Per-exercise **progress graph** (weight, reps, or combined) across all sessions
- **Export/import** your data as a JSON backup
- Fully offline after installing to your Home Screen

## Development

```bash
npm install
npm run dev
```

## Deploying to GitHub Pages

1. Create a GitHub repo named `workout-tracker` and push this project to it (`git remote add origin <url>`, `git push -u origin main`).
2. In the repo's **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push to `main` — the included workflow (`.github/workflows/deploy.yml`) builds and deploys automatically.
4. Visit `https://<your-username>.github.io/workout-tracker/` on your iPhone in Safari, tap **Share → Add to Home Screen**.

The app then works fully offline — you only need to reopen the URL again if you want to pick up a future update.

## Backups

Since all data lives only in this phone's browser storage, use **Settings → Export backup** regularly to save a JSON file you can restore later via **Settings → Import backup**.

### Automatic backups on iPhone

You can make this happen on its own, without opening the app:

1. **Send Safari downloads to iCloud Drive.** In iOS **Settings → Apps → Safari → Downloads**, pick an iCloud Drive folder. Every backup you export from then on is automatically synced/backed up.
2. **Set up a scheduled automation.** Visiting the app with `?autobackup=1` appended to the URL (e.g. `https://<your-username>.github.io/workout-tracker/?autobackup=1`) triggers an export immediately on load, no taps required. In the iOS **Shortcuts** app:
   - Go to **Automation → + → Create Personal Automation → Time of Day**, pick a daily time.
   - Add action **Open URLs**, set it to that `?autobackup=1` URL.
   - Turn off **Ask Before Running** so it fires without a confirmation prompt.
   - Safari will briefly open, run the export, and save the JSON to the iCloud Drive folder from step 1.

This keeps a rolling JSON snapshot in iCloud with no server and no account involved.
