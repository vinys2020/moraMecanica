import { initializeApp } from 'firebase/app'

import { getAuth } from 'firebase/auth'

import { getFirestore } from 'firebase/firestore'

import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyCO4H9KdAQl4flyaiiAIDFlDLpz8Qa6Yng',

  authDomain: 'moramecanica1.firebaseapp.com',

  projectId: 'moramecanica1',

  storageBucket: 'moramecanica1.firebasestorage.app',

  messagingSenderId: '33041550886',

  appId: '1:33041550886:web:a1cabba0ec167fa921a0e7',

  measurementId: 'G-HY21WCXKVB',
}

export const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const db = getFirestore(app)

export const storage = getStorage(app)