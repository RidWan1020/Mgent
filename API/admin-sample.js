// api/admin-sample.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  // FIREBASE_ADMIN_SERVICE_ACCOUNT is the full service-account JSON string in Vercel env.
  const raw = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT;
  if (!raw) {
    console.error("Missing FIREBASE_ADMIN_SERVICE_ACCOUNT env var");
  } else {
    const svc = JSON.parse(raw);
    admin.initializeApp({
      credential: admin.credential.cert(svc),
    });
  }
}

export default async function handler(req, res) {
  // Example: list memos (server-side)
  try {
    const db = admin.firestore();
    const snap = await db.collection("memos").limit(10).get();
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    res.status(200).json({ ok: true, list });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
}
