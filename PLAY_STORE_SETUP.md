# Publishing Drippy to the Google Play Store

This guide walks you through everything between "I have a debug APK" and "Drippy is live on the Play Store". It's a real, multi-step process — budget a couple of focused evenings to get it done the first time.

## Big picture

The debug APK you're already building is for personal testing. The Play Store requires:

1. A **signed release APK** (or AAB), signed with **your own** keystore.
2. A **Google Play Console** developer account ($25 USD, one-time fee).
3. A **privacy policy** hosted at a public URL.
4. **App assets**: a 512×512 icon, feature graphic, screenshots, description.
5. Compliance with **Play Store policies** (target SDK level, declared data usage, etc.).

The rest of this doc explains each piece.

---

## Step 1 — Create your release signing key (one-time setup)

The signing key is what proves to Android that a release APK update was signed by *you*. **Lose this key and you can never update the app again** — back it up.

Easiest method: generate the keystore on your own computer with the Java JDK tool `keytool`, then upload it to GitHub as a secret so the cloud build can sign with it.

### Generate the keystore (Windows PowerShell)

You need Java installed. If you don't have it, install **Android Studio** which bundles Java, or download "JDK 17" from https://adoptium.net/.

In PowerShell, run (replace `YOUR_NAME` and the passwords with your own):

```
keytool -genkey -v -keystore drippy-release.keystore -alias drippy -keyalg RSA -keysize 2048 -validity 10000
```

It will ask several questions — answer them honestly (your name, your city, your country). Pick strong passwords for both the keystore and the key (it asks twice).

You should now have `drippy-release.keystore` in the folder you ran the command. **Back it up to two safe places** (e.g. a password manager, an encrypted USB stick).

### Upload it as a GitHub secret

1. Convert the keystore to base64 so GitHub can store it as a secret. In PowerShell:
   ```
   [Convert]::ToBase64String([IO.File]::ReadAllBytes("drippy-release.keystore")) | Out-File drippy-release.keystore.base64
   ```
2. Open `drippy-release.keystore.base64`. Copy all the text inside.
3. Go to your GitHub repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.
4. Create 4 secrets:

   | Name | Value |
   |---|---|
   | `RELEASE_KEYSTORE_BASE64` | paste the base64 text |
   | `RELEASE_KEYSTORE_PASSWORD` | the keystore password you chose |
   | `RELEASE_KEY_ALIAS` | `drippy` (or whatever alias you used) |
   | `RELEASE_KEY_PASSWORD` | the key password you chose |

### Add a release-build job to the workflow

Once secrets are uploaded, you can add a "release" job that signs the APK. Append this to `.github/workflows/build-apk.yml` (or ask me to do it):

```yaml
      - name: Decode keystore
        run: |
          echo "${{ secrets.RELEASE_KEYSTORE_BASE64 }}" | base64 -d > android/app/drippy-release.keystore

      - name: Build signed release APK
        working-directory: android
        env:
          KEYSTORE_PASSWORD: ${{ secrets.RELEASE_KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.RELEASE_KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.RELEASE_KEY_PASSWORD }}
        run: |
          ./gradlew assembleRelease \
            -Pandroid.injected.signing.store.file=$PWD/app/drippy-release.keystore \
            -Pandroid.injected.signing.store.password=$KEYSTORE_PASSWORD \
            -Pandroid.injected.signing.key.alias=$KEY_ALIAS \
            -Pandroid.injected.signing.key.password=$KEY_PASSWORD

      - name: Upload release APK
        uses: actions/upload-artifact@v4
        with:
          name: drippy-release-apk
          path: android/app/build/outputs/apk/release/app-release.apk
```

Push that change and the next build produces a signed `app-release.apk` you can upload to Play Console.

---

## Step 2 — Create a Google Play Console account

1. Go to https://play.google.com/console/.
2. Sign in with the Google account you want to publish under (this email becomes the developer contact).
3. Pay the **$25 one-time** registration fee.
4. Fill out the developer profile (your name or business name, address, phone).
5. Choose **App** as the account type (not "Organisation" unless you have a registered business).

This step usually takes Google a day or two to verify.

---

## Step 3 — Host your privacy policy

The Play Store **requires** every app to have a privacy policy at a public URL.

Easiest options:
- **GitHub Pages** (free): in your repo, go to Settings → Pages → enable Pages for the main branch. Your privacy policy at `PRIVACY_POLICY.md` becomes accessible at `https://<your-username>.github.io/<repo-name>/PRIVACY_POLICY` (you may need to rename it to `privacy.html` or set up a Jekyll site).
- **Google Sites** (free): create a Site, paste in `PRIVACY_POLICY.md` content, publish.
- **Notion** (free, public page): make a page, publish, copy the public URL.

Edit `PRIVACY_POLICY.md` in this repo first — fill in the date placeholder and double-check the email. Then host it and copy that URL — you'll paste it into Play Console.

---

## Step 4 — Prepare your app assets

You'll need to upload these to Play Console:

| Asset | Spec | Notes |
|---|---|---|
| App icon | 512×512 PNG, 32-bit, with alpha | Friendly Drippy-style water drop. See note below. |
| Feature graphic | 1024×500 PNG, no transparency | Banner image shown on your Play Store listing. |
| Screenshots | 1080×1920 PNG (portrait), 2–8 images | Open Drippy on your S25, swipe down for power menu → screenshot. Crop the status bar if you want. |
| Short description | 80 chars max | Example: "Friendly reminders for water, meals & vitamins with a mascot you'll love." |
| Full description | up to 4000 chars | Describe what the app does, key features, what makes it different. |

### About the icon

The current build uses the default Capacitor icon. To replace:

1. Make a 1024×1024 PNG of Drippy's water drop. You can use any tool — Figma, Canva, even Microsoft Paint. Keep the design simple and centered.
2. Once you have your `icon.png`:
   - **Easy way**: install Android Studio, open the project (`npx cap open android`), right-click `app/res` → **New** → **Image Asset** → **Launcher Icons**, pick your PNG, click Next/Finish.
   - **Manual way**: replace these files in `android/app/src/main/res/`:
     - `mipmap-mdpi/ic_launcher.png` (48×48)
     - `mipmap-hdpi/ic_launcher.png` (72×72)
     - `mipmap-xhdpi/ic_launcher.png` (96×96)
     - `mipmap-xxhdpi/ic_launcher.png` (144×144)
     - `mipmap-xxxhdpi/ic_launcher.png` (192×192)
     - Same paths for `ic_launcher_round.png` (just a circular crop).

---

## Step 5 — Create the Play Console listing

In Play Console, click **Create app**. You'll be asked about:

1. **App name**: "Drippy" (or "Drippy — Wellness Reminders" if you want to be searchable).
2. **Default language**: English.
3. **App or game**: App.
4. **Free or paid**: Free.
5. **Declarations**: confirm it complies with Play policies and US export laws.

Then you'll work through several sections in the left sidebar. The critical ones are:

- **App content** — declare target audience (everyone), data safety (link to your privacy policy, declare "no data collected"), ads (no), content rating (do the questionnaire — Drippy is for everyone).
- **Main store listing** — upload icon, feature graphic, screenshots, write description.
- **Pricing & distribution** — pick the countries you want to release in. "All countries" is fine.

---

## Step 6 — Upload your release APK

1. In Play Console, go to **Production** → **Create new release**.
2. Upload `app-release.apk` (the signed one from your GitHub Actions release job).
3. Write release notes (e.g. "Initial release. Reminders for water, meals, vitamins, and diet check-ins with friendly mascot.").
4. **Save**.

Google may warn you that Play prefers **Android App Bundles (.aab)** over APKs. To produce an AAB instead, change `assembleRelease` to `bundleRelease` in your workflow and upload `app-release.aab` instead. AAB is recommended but not required for your first release.

---

## Step 7 — Submit for review

Click **Submit for review** at the top. Google reviews submissions in 1–7 days for new apps. They look for:

- Privacy policy URL works.
- App doesn't crash on launch (Drippy is solid here).
- Declared permissions are justified (yours are — reminders need them).
- No misleading description or screenshots.
- Target SDK is reasonably recent (the build pipeline already targets a modern SDK).

If approved, Drippy goes live within hours. If rejected, you'll get an email explaining why — usually fixable in a few minutes.

---

## After publishing

- **Updates**: edit code → push to GitHub → cloud builds new signed APK → upload to Play Console → submit → Google reviews → users get the update.
- **Increment `versionCode` and `versionName`**: every release must have a higher `versionCode`. These are set in `android/app/build.gradle`. We can add an automatic version-bumping step to the workflow when you're ready.
- **Crashes & feedback**: Play Console shows you crash reports and user reviews. Respond to reviews — it boosts your store ranking.

---

## Realistic expectations

If you've never done this before, expect:
- **Day 1**: Account setup, keystore generation, privacy policy hosting, icon design.
- **Day 2**: Workflow tweaks, build the first signed APK, prepare screenshots and descriptions.
- **Day 3**: Submit. Wait for review.
- **Days 4–7**: Approved (most likely) or address feedback if rejected.

The hardest single step is usually the icon and screenshots — not because they're technical, but because deciding "what does Drippy look like in the store?" takes design thinking.

When you're ready for any of these steps, message me with what you've done and where you're stuck, and I'll walk you through the next part.
