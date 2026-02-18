import {
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPhoneNumber
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase';

let recaptcha;

export function initializeRecaptcha(containerId = 'recaptcha-container') {
  if (recaptcha) return recaptcha;
  recaptcha = new RecaptchaVerifier(auth, containerId, { size: 'invisible' });
  return recaptcha;
}

export async function registerWithEmailAndPhone(formData) {
  const credentials = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
  await setDoc(doc(db, 'users', credentials.user.uid), {
    fullName: formData.fullName,
    phoneNumber: formData.phoneNumber,
    email: formData.email,
    role: 'user',
    kycStatus: 'pending',
    suspended: false,
    createdAt: serverTimestamp(),
    lastLoginAt: serverTimestamp()
  }, { merge: true });

  return credentials.user;
}

export function sendPhoneOtp(phoneNumber) {
  const verifier = initializeRecaptcha();
  return signInWithPhoneNumber(auth, phoneNumber, verifier);
}

export async function login(credentials) {
  return signInWithEmailAndPassword(auth, credentials.email, credentials.password);
}

export async function logout() {
  return signOut(auth);
}
