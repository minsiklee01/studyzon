/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {Timestamp} from "firebase-admin/firestore";
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import {Expo} from "expo-server-sdk";
import {onSchedule} from "firebase-functions/scheduler";

const expo = new Expo();
admin.initializeApp();


export const sendPushNotification = onRequest(async (req, res) => {
  const {token, title, body} = req.body;

  if (!Expo.isExpoPushToken(token)) {
    res.status(400).send("Invalid Expo Push Token");
    return;
  }

  const messages = [
    {
      to: token,
      sound: "default",
      title,
      body,
      data: {sentFrom: "firebase-functions"},
    },
  ];

  try {
    const receipts = await expo.sendPushNotificationsAsync(messages);
    res.status(200).json(receipts);
  } catch (error) {
    logger.error("Error sending push notification:", error);
    res.status(500).send("Failed to send notification");
  }
});

export const autoLeaveChecker = onSchedule("0 * * * *", async () => {
  const now = Date.now();
  const thirthyMinutesAgo = Timestamp.fromMillis(now - 60 * 60 * 1000);

  const usersSnapshot = await admin.firestore()
    .collection("users")
    .where("currentRoomId", "!=", "")
    .where("lastActive", "<", thirthyMinutesAgo)
    .get();

  const updates = usersSnapshot.docs.map(async (doc) => {
    const roomId = doc.data().currentRoomId;

    if (!roomId) {
      console.warn(`Skipping user ${doc.id} with no roomId`);
      return;
    }

    await admin.firestore()
      .doc(`rooms/${roomId}/users/${doc.id}`)
      .delete();

    return admin.firestore()
      .doc(`users/${doc.id}`)
      .update({currentRoomId: null});
  });

  await Promise.all(updates);
  console.log(`Auto-removed ${updates.length} inactive users.`);
});
