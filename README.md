# Drippy — Android wrapper

This folder turns the Drippy reminder web app into a real Android APK using Capacitor. The Android build adds **native local notifications** that fire reliably even when the app is closed, the phone is locked, and the screen is off (using Android's `AlarmManager` under the hood).

You have two ways to build the APK. Pick one.

---

## Option A — Cloud build (recommended, ~10 min, no installs)

Build the APK on GitHub's servers using the included workflow. No need to install Android Studio, Java, or Node.js on your computer.

### Step 1. Create a free GitHub account
If you don't already have one, sign up at https://github.com — it's free.

### Step 2. Create a new repository
- Click the **+** icon top-right → **New repository**.
- Name it `drippy-android` (anything works).
- Set it to **Private** (or public if you don't mind).
- **Don't** add a README or .gitignore — we already have them.
- Click **Create repository**.

### Step 3. Upload this folder
On the new repo's page you'll see "uploading an existing file". Click that link.
- Open this `DrippyAndroid` folder on your computer.
- Drag **everything inside it** (not the folder itself) into the GitHub upload page. Make sure the `.github` folder is included — that's where the build workflow lives.
- Scroll down, click **Commit changes**.

### Step 4. Watch the build run
- Click the **Actions** tab at the top of your repo.
- You'll see a workflow run called "Build Drippy APK" — click it.
- Wait ~5-7 minutes for it to finish (green checkmark).
- If it fails: click the failed step to read the log, or message me with what it said.

### Step 5. Download the APK
- Inside the workflow run page, scroll to the bottom — there's an **Artifacts** section.
- Download `drippy-debug-apk` (it's a zip).
- Extract the zip — inside is `app-debug.apk`.

### Step 6. Install on your S25 Ultra
- Transfer `app-debug.apk` to your phone (USB cable, email, Google Drive, anything).
- On your phone, open the APK file.
- Android will warn that it's from an "unknown source" — that's normal for sideloaded apps. Tap **Settings** → enable **Allow from this source** → go back → **Install**.
- Open Drippy from your app drawer.
- When it asks for notification permission, tap **Allow**.

Done. Reminders will now fire reliably even when the app is closed.

---

## Option B — Local build (for power users)

Use this if you'd rather build on your own computer.

### Requirements
- **Node.js 20+** — https://nodejs.org (LTS installer for Windows)
- **Android Studio** — https://developer.android.com/studio (large download, ~3 GB)
- **Java JDK 17** — comes bundled with Android Studio

### Build steps
Open Command Prompt or PowerShell in this `DrippyAndroid` folder, then run:

```
npm install
npx cap add android
npx cap sync android
npx cap open android
```

The last command opens the project in Android Studio. Wait for Gradle sync to finish, then:
- Menu: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**.
- When the popup appears in the bottom-right, click **locate** to find the APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

Then follow Step 6 above to install it on your S25.

---

## Files in this project

- `www/index.html` — the Drippy app, with native notification integration. Edit this if you want to change the look or behavior.
- `package.json` — Capacitor + plugin dependencies.
- `capacitor.config.json` — Android app ID and config.
- `.github/workflows/build-apk.yml` — the cloud build pipeline.
- `.gitignore` — keeps `node_modules` and the generated `android/` folder out of the repo.

---

## How the native scheduling works

When the app starts on Android:

1. It asks for notification permission.
2. It schedules the **next 7 days** of enabled reminders as native Android notifications via the LocalNotifications plugin (which uses `AlarmManager` behind the scenes).
3. Every time you add, edit, delete, or toggle a reminder, it cancels the old schedule and reschedules.
4. When you tap a notification, it auto-logs the action (drank water, took vitamins, etc.) into Drippy's progress rings.
5. When you reopen the app, it reschedules again to make sure the next 7 days are always covered.

On the web (just opening `index.html` in a browser), all of that native code is skipped — the original web-based reminders still work.

---

## Troubleshooting

**Reminders aren't firing on my phone**
- Open Android Settings → Apps → Drippy → Notifications → make sure they're enabled.
- Same Settings page → Battery → set to **Unrestricted**. Samsung's One UI aggressively kills background apps; this stops it from killing Drippy's alarms.
- Make sure your phone isn't in Do Not Disturb mode when expected.

**GitHub Actions build failed**
- Most common cause: the `.github` folder didn't get uploaded. Check your repo — if you don't see a `.github/workflows/build-apk.yml`, re-upload it.
- Click into the failed run, expand the failing step, copy the error and we can debug.

**APK won't install on phone**
- Android 13+: Settings → Apps → Special access → Install unknown apps → enable for whichever app you used to download (Chrome, Files, etc.).
- Make sure the file extension is `.apk` (some download managers add `.txt`).

**I want to change the app name or icon**
- Edit `capacitor.config.json` → change `appName` and rerun `npx cap sync`.
- To change the icon, drop a 1024×1024 PNG into `android/app/src/main/res/` after the first build, or use Android Studio's Image Asset Studio.

---

## Updating Drippy later

When you tweak `www/index.html` and want a fresh APK:
- **Cloud build**: just push the new `index.html` to your repo. GitHub Actions auto-builds a new APK on every push.
- **Local build**: rerun `npx cap sync android` then rebuild in Android Studio.

Sideload the new APK over the old one — your data (streaks, reminders) is preserved by Android since the app ID (`com.zulfaqar.drippy`) stays the same.
