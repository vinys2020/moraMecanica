import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'

import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

import { auth, db } from '../config/firebase'

export type UserRole = 'admin' | 'empleado' | 'cliente'

export interface UserData {
  uid: string
  email: string | null
  rol: UserRole | null
  nombre?: string
  activo?: boolean
}

/* =========================================================
   OBTENER DATOS DEL USUARIO
========================================================= */

export async function obtenerDatosUsuario(
  uid: string
): Promise<UserData | null> {
  const userRef = doc(db, 'usuarios', uid)
  const userSnapshot = await getDoc(userRef)

  if (!userSnapshot.exists()) {
    console.warn(
      `No existe el documento usuarios/${uid} en Firestore.`
    )

    return null
  }

  const data = userSnapshot.data()

  return {
    uid: data.uid || uid,
    email: data.email ?? null,
    rol: data.rol ?? null,
    nombre: data.nombre ?? '',
    activo: data.activo ?? false,
  }
}

/* =========================================================
   REGISTRO
========================================================= */

export async function registerWithEmail(
  nombre: string,
  email: string,
  password: string
): Promise<{
  user: User
  rol: UserRole
  activo: boolean
}> {
  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

  const user = userCredential.user

  await updateProfile(user, {
    displayName: nombre,
  })

  await setDoc(doc(db, 'usuarios', user.uid), {
    uid: user.uid,
    email: user.email,
    nombre,
    rol: 'cliente',
    activo: false,
    creadoEn: serverTimestamp(),
  })

  // Firebase inicia sesión automáticamente
  // después de crear la cuenta.
  // La cerramos porque necesita aprobación.
  await signOut(auth)

  return {
    user,
    rol: 'cliente',
    activo: false,
  }
}

/* =========================================================
   LOGIN EMAIL
========================================================= */
export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{
  user: User
  rol: UserRole | null
  activo: boolean
}> {
  const userCredential =
    await signInWithEmailAndPassword(
      auth,
      email,
      pass
    )

  const user = userCredential.user

  const userData =
    await obtenerDatosUsuario(user.uid)

  if (!userData) {
    await signOut(auth)
    throw new Error('USER_DATA_NOT_FOUND')
  }

  /*
   * El rol debe existir y ser válido.
   */

  if (
    userData.rol !== 'admin' &&
    userData.rol !== 'empleado' &&
    userData.rol !== 'cliente'
  ) {
    await signOut(auth)
    throw new Error('USER_ROLE_INVALID')
  }

  /*
   * IMPORTANTE:
   * Firestore debe tener:
   *
   * activo: true
   *
   * como booleano.
   */

  const activo =
    userData.activo === true

  console.log('LOGIN FIRESTORE:', {
    uid: user.uid,
    rol: userData.rol,
    activo: userData.activo,
    activoCalculado: activo,
  })

  /*
   * NO cerramos sesión acá.
   *
   * Login.tsx decide qué hacer:
   *
   * activo true  → dashboard
   * activo false → registro-pendiente
   */

  return {
    user,
    rol: userData.rol,
    activo,
  }
}


/* =========================================================
   LOGIN GOOGLE
========================================================= */

export async function loginWithGoogle(): Promise<{
  user: User
  rol: UserRole | null
  activo: boolean
}> {
  const provider = new GoogleAuthProvider()

  const userCredential =
    await signInWithPopup(
      auth,
      provider
    )

  const user = userCredential.user

  const userData = await obtenerDatosUsuario(
    user.uid
  )

  if (!userData) {
    await signOut(auth)

    throw new Error('USER_DATA_NOT_FOUND')
  }

  if (userData.activo !== true) {
    await signOut(auth)

    throw new Error('USER_NOT_ACTIVE')
  }

  return {
    user,
    rol: userData.rol,
    activo: true,
  }
}

/* =========================================================
   LOGOUT
========================================================= */

export async function logout(): Promise<void> {
  await signOut(auth)
}