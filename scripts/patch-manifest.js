// Adds the Android permissions Drippy needs for reliable lock-screen reminders.
// Runs after `npx cap sync android` in the CI workflow.

const fs = require('fs');
const path = require('path');

const manifestPath = path.join('android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.error('AndroidManifest.xml not found at', manifestPath);
  process.exit(1);
}

let m = fs.readFileSync(manifestPath, 'utf8');

const PERMS = [
  'android.permission.POST_NOTIFICATIONS',     // Android 13+ notification permission
  'android.permission.SCHEDULE_EXACT_ALARM',   // exact-time alarms (Android 12+)
  'android.permission.USE_EXACT_ALARM',        // exact-alarm fallback for Android 13+ alarm/reminder apps
  'android.permission.VIBRATE',                // vibration on notification
  'android.permission.RECEIVE_BOOT_COMPLETED', // re-schedule alarms after reboot
  'android.permission.WAKE_LOCK',              // wake device to fire reminders
];

let added = 0;
for (const p of PERMS) {
  if (!m.includes(p)) {
    m = m.replace('</manifest>', `    <uses-permission android:name="${p}" />\n</manifest>`);
    added++;
  }
}

fs.writeFileSync(manifestPath, m);
console.log(`Patched AndroidManifest.xml — added ${added} permissions.`);
