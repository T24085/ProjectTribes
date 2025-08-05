// Script to backfill streamer bios in Firestore.
// Requires firebase-admin package and service account credentials.
// Usage:
//   export FIREBASE_SERVICE_ACCOUNT='{"type":...}'
//   node scripts/backfillBios.js

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
if (!serviceAccountJson) {
  console.error('FIREBASE_SERVICE_ACCOUNT env var is required.');
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) });
const db = getFirestore();

// Map twitchHandle -> bio text
const bios = {
  // 'exampleHandle': 'Example bio',
};

async function run() {
  for (const [handle, bio] of Object.entries(bios)) {
    const snap = await db.collection('streamers').where('twitchHandle', '==', handle).get();
    snap.forEach(doc => doc.ref.update({ bio }));
  }
  console.log('Backfill complete');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
