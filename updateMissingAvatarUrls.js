// One-time script to backfill missing avatarUrl fields in Firestore.
// Usage: set GOOGLE_APPLICATION_CREDENTIALS to a service account JSON file
// and run `node updateMissingAvatarUrls.js`.

import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp({
  credential: applicationDefault(),
});

const db = getFirestore();

async function updateAvatars() {
  const snap = await db.collection("streamers").get();
  const updates = [];

  snap.forEach((doc) => {
    const data = doc.data();
    if (!data.avatarUrl || data.avatarUrl.trim() === "") {
      const avatarUrl = `https://decapi.me/twitch/avatar/${data.twitchHandle}`;
      updates.push(doc.ref.update({ avatarUrl }));
      console.log(`Updated ${doc.id} -> ${avatarUrl}`);
    }
  });

  await Promise.all(updates);
  console.log("Avatar URL backfill complete.");
}

updateAvatars().catch((err) => {
  console.error(err);
  process.exit(1);
});
