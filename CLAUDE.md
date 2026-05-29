# VibeLink — Project Memory

## What this app is

**VibeLink** is a single-page Android app (Capacitor wrapper around a vanilla HTML/JS/CSS page) that lets you plan a hangout and send a compact invite link to someone. The recipient taps the link, sees the hangout details, and can accept or suggest a different time/place.

The repo is named `DrippyAndroid` (old name). The app was renamed to **VibeLink**. Do NOT rename the repo — GitHub Pages URL depends on it.

---

## Tech stack

| Layer | Tool |
|-------|------|
| App shell | Single file: `www/index.html` (all HTML + CSS + JS inline) |
| Android wrapper | Capacitor 6 (`@capacitor/core`, `@capacitor/android`) |
| Build | GitHub Actions → produces `vibelink-debug-apk` artifact |
| Web hosting | GitHub Pages → `https://zulfansar78-del.github.io/DrippyAndroid/` |
| Notifications | `@capacitor-community/local-notifications` |

No framework, no bundler, no backend. Everything is in `www/index.html`.

---

## Key files

```
www/
  index.html          ← entire app (all screens, styles, logic)
  icon.svg            ← VibeLink launcher icon (purple→pink→orange gradient + ⚡ bolt)
scripts/
  patch-manifest.js   ← adds Android permissions after cap sync
.github/workflows/
  build-apk.yml       ← CI: npm install → cap add android → cap sync → patch manifest
                         → generate icons from icon.svg → remove adaptive icon XMLs → build APK
  deploy-pages.yml    ← CI: deploys www/ to GitHub Pages on every push to main
capacitor.config.json ← appId: com.zulfaqar.vibelink, appName: VibeLink
```

---

## App screens (navigation flow)

```
Home (index)
  └─ Plan screen       ← fill in: name, date, time, location, food tab, activity, note
       └─ Preview screen   ← see the invite card + share link
            └─ Invite screen (recipient view)  ← opened via share link
                 └─ Suggest Alternative screen ← recipient proposes different time/place
```

Navigation uses a stack (`navStack`) + `← Back` buttons on every screen.
Android hardware back button is intercepted via the `backbutton` Capacitor event.

---

## Share link format

Links look like:
```
https://zulfansar78-del.github.io/DrippyAndroid/#invite=BASE64_JSON
```

The JSON payload uses short keys to keep the URL compact:
`t`=title, `n`=name, `d`=date, `tm`=time, `l`=location, `a`=activity, `f`=food, `nt`=note

When running on `localhost` / `file://` / `capacitor://` (i.e. inside the app), the share link still uses the GitHub Pages base URL so recipients can open it in any browser.

---

## CI / build process

### APK build (`build-apk.yml`) — triggers on push to `main`/`master`

1. `npm install` — installs Capacitor
2. `npx cap add android` — generates fresh Android project (android/ is gitignored)
3. `npx cap sync android` — copies www/ into Android assets
4. `node scripts/patch-manifest.js` — adds notification + alarm permissions
5. Install `rsvg-convert` (librsvg2-bin)
6. Generate PNG launcher icons from `www/icon.svg` into all `mipmap-*` densities
7. **Delete `mipmap-anydpi-v26/`** — removes Capacitor's adaptive icon XMLs that would override our PNGs on Android 8+ devices (this is why the icon showed as Drippy before)
8. `./gradlew assembleDebug` — builds the APK
9. Upload artifact: `vibelink-debug-apk`

### GitHub Pages (`deploy-pages.yml`) — triggers on push to `main`/`master`

Deploys `www/` to GitHub Pages with `enablement: true` (auto-enables Pages if not already on).
**One-time manual step**: repo Settings → Pages → Source → GitHub Actions → Save.

---

## Bugs fixed in this session

| Bug | Fix |
|-----|-----|
| App icon showed old Drippy icon | `icon.svg` created; adaptive icon dir deleted in CI |
| No back button / hardware back exits app | `navStack` + `← Back` buttons + `backbutton` event handler |
| Share link too long / broke on some apps | Compact key names + always use GH Pages base URL |
| Recipient couldn't suggest different time/place | "💡 Suggest different time/place" form on Invite screen |
| Food category tabs wouldn't scroll horizontally | `touch-action: pan-x` + `-webkit-overflow-scrolling: touch` |
| No Google Maps button next to location | 🗺️ button opens `maps.google.com/?q=` for location field |
| GitHub Pages deploy failed | Added `enablement: true` to `configure-pages` action |

---

## Active branch

Development branch: `claude/appointment-booking-program-aV1E0`

Always push to this branch. Merge to `main` triggers CI (APK build + Pages deploy).

---

## Important constants in index.html

```js
const GH_PAGES = 'https://zulfansar78-del.github.io/DrippyAndroid/';
// Used as the share link base URL even when running inside the Android app
```

---

## Things still to verify / potential issues

- GitHub Pages must be manually enabled in repo Settings → Pages → Source: GitHub Actions (one-time)
- The APK is a **debug** build (unsigned for production). For Play Store, a signed release build is needed
- `@capacitor-community/local-notifications` is installed but scheduling UI may need further testing
- The user reported "still problem with code" but did not specify — ask them to screenshot or describe the specific issue in the next session
