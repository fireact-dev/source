import { https } from 'firebase-functions/v1';
import { getFirestore } from 'firebase-admin/firestore';
import type { SubscriptionData } from './types';

const defaultPermission = Object.entries(global.saasConfig.permissions)
  .find(([_, value]) => value.default)?.[0] || 'access';

export const getUserSubscriptions = https.onCall(async (_, context) => {
  if (!context.auth) {
    throw new https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const db = getFirestore();
  const uid = context.auth.uid;

  try {
    const snapshot = await db
      .collection('subscriptions')
      .where(`permissions.${defaultPermission}`, 'array-contains', uid)
      .get();

    return {
      subscriptions: snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as SubscriptionData)
      }))
    };
  } catch (error) {
    console.error('Error in getUserSubscriptions:', error);
    throw new https.HttpsError('internal', 'Internal server error');
  }
});
