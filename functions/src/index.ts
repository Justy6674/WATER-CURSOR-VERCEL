import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

export const logHydration = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { userId, amount, timestamp } = req.body;

  if (!userId || amount === undefined) {
    res.status(400).send('Missing required fields: userId, amount.');
    return;
  }

  try {
    const hydrationData = {
      userId: userId,
      amount: amount,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (timestamp) {
 hydrationData.timestamp = new Date(timestamp);
    } else {
 hydrationData.timestamp = admin.firestore.FieldValue.serverTimestamp();
    }

    await db.collection('hydration_logs').add(hydrationData);
    res.status(200).send('Hydration log recorded successfully.');
  } catch (error) {
    console.error('Error writing hydration log to Firestore:', error);
    res.status(500).send('Error recording hydration log.');
  }
});