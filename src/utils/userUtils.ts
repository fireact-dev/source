import { type User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc, Firestore } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';

export async function saveUserToFirestore(user: User, displayName: string, db: Firestore) {
  try {
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
    
    const userData = {
      create_time: userDoc.exists() && userDoc.data()?.create_time ? userDoc.data().create_time : serverTimestamp(),
      display_name: displayName,
      avatar_url: user.photoURL,
      last_updated: serverTimestamp(),
    };
    
    await setDoc(userRef, userData, { merge: true });
    return true;
  } catch (error) {
    if (error instanceof FirebaseError) {
      console.error('Firebase Error saving user to Firestore:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
    } else {
      console.error('Unknown error saving user to Firestore:', error);
    }
    throw error;
  }
}
