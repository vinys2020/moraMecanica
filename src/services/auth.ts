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
    uid: data.uid ?? uid,
    email: data.email ?? null,
    rol: data.rol ?? null,
    nombre: data.nombre ?? '',
    activo: data.activo === true,
  }
}

/* =========================================================
   REGISTRO CON EMAIL
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
  console.log('📝 Iniciando registro...')

  /* -------------------------------------------------------
     CREAR CUENTA EN FIREBASE AUTH
  ------------------------------------------------------- */

  const userCredential =
    await createUserWithEmailAndPassword(
      auth,
      email,
      password
    )

  const user = userCredential.user

  console.log(
    '✅ Usuario creado en Firebase Auth:',
    user.uid
  )

  /* -------------------------------------------------------
     GUARDAR NOMBRE EN FIREBASE AUTH
  ------------------------------------------------------- */

  await updateProfile(user, {
    displayName: nombre,
  })

  /* -------------------------------------------------------
     CREAR DOCUMENTO EN FIRESTORE
  ------------------------------------------------------- */

  const userRef = doc(
    db,
    'usuarios',
    user.uid
  )

  const userData = {
    uid: user.uid,
    email: user.email,
    nombre: nombre,
    rol: 'cliente' as UserRole,

    /*
     * IMPORTANTE:
     * El usuario queda pendiente hasta que
     * un administrador lo apruebe.
     */
    activo: false,

    creadoEn: serverTimestamp(),
  }

  console.log(
    '💾 Guardando usuario en Firestore:',
    userData
  )

  await setDoc(
    userRef,
    userData
  )

  console.log(
    '✅ Documento creado correctamente:',
    `usuarios/${user.uid}`
  )

  /* -------------------------------------------------------
     CERRAR SESIÓN
  ------------------------------------------------------- */

  /*
   * Firebase inicia sesión automáticamente
   * después de crear una cuenta.
   *
   * Como la cuenta todavía necesita aprobación,
   * cerramos la sesión.
   */

  await signOut(auth)

  console.log(
    '🔒 Sesión cerrada. Usuario pendiente de aprobación.'
  )

  /* -------------------------------------------------------
     RESULTADO
  ------------------------------------------------------- */

  return {
    user,
    rol: 'cliente',
    activo: false,
  }
}

/* =========================================================
   LOGIN CON EMAIL
========================================================= */

export async function loginWithEmail(
  email: string,
  pass: string
): Promise<{
  user: User
  rol: UserRole | null
  activo: boolean
}> {
  console.log(
    '🔑 Intentando iniciar sesión:',
    email
  )

  /* -------------------------------------------------------
     LOGIN FIREBASE AUTH
  ------------------------------------------------------- */

  const userCredential =
    await signInWithEmailAndPassword(
      auth,
      email,
      pass
    )

  const user = userCredential.user

  console.log(
    '✅ Firebase Auth autenticó:',
    user.uid
  )

  /* -------------------------------------------------------
     OBTENER DOCUMENTO FIRESTORE
  ------------------------------------------------------- */

  const userData =
    await obtenerDatosUsuario(user.uid)

  if (!userData) {
    console.error(
      '❌ El usuario existe en Auth pero no tiene documento en Firestore.'
    )

    await signOut(auth)

    throw new Error(
      'USER_DATA_NOT_FOUND'
    )
  }

  console.log(
    '👤 Datos encontrados en Firestore:',
    userData
  )

  /* -------------------------------------------------------
     VALIDAR ROL
  ------------------------------------------------------- */

  if (
    userData.rol !== 'admin' &&
    userData.rol !== 'empleado' &&
    userData.rol !== 'cliente'
  ) {
    console.error(
      '❌ Rol inválido:',
      userData.rol
    )

    await signOut(auth)

    throw new Error(
      'USER_ROLE_INVALID'
    )
  }

  /* -------------------------------------------------------
     COMPROBAR APROBACIÓN
  ------------------------------------------------------- */

  const activo =
    userData.activo === true

  console.log(
    '🔐 ESTADO DE CUENTA:',
    {
      uid: user.uid,
      rol: userData.rol,
      activoFirestore: userData.activo,
      activoCalculado: activo,
    }
  )

  /*
   * IMPORTANTE:
   *
   * NO hacemos signOut acá cuando activo === false.
   *
   * Login.tsx recibe:
   *
   * activo: false
   *
   * y se encarga de enviarlo a:
   *
   * /registro-pendiente
   *
   * Esto permite mantener todo el flujo
   * centralizado.
   */

  return {
    user,
    rol: userData.rol,
    activo,
  }
}

/* =========================================================
   LOGIN CON GOOGLE
========================================================= */

export async function loginWithGoogle(): Promise<{
  user: User
  rol: UserRole | null
  activo: boolean
}> {
  console.log(
    '🔑 Iniciando sesión con Google...'
  )

  const provider =
    new GoogleAuthProvider()

  const userCredential =
    await signInWithPopup(
      auth,
      provider
    )

  const user =
    userCredential.user

  console.log(
    '✅ Google autenticó:',
    user.uid
  )

  /* -------------------------------------------------------
     OBTENER DATOS FIRESTORE
  ------------------------------------------------------- */

  const userData =
    await obtenerDatosUsuario(
      user.uid
    )

  /* -------------------------------------------------------
     USUARIO SIN DOCUMENTO
  ------------------------------------------------------- */

  if (!userData) {
    console.error(
      '❌ Usuario de Google sin documento en Firestore.'
    )

    await signOut(auth)

    throw new Error(
      'USER_DATA_NOT_FOUND'
    )
  }

  /* -------------------------------------------------------
     VALIDAR ROL
  ------------------------------------------------------- */

  if (
    userData.rol !== 'admin' &&
    userData.rol !== 'empleado' &&
    userData.rol !== 'cliente'
  ) {
    await signOut(auth)

    throw new Error(
      'USER_ROLE_INVALID'
    )
  }

  /* -------------------------------------------------------
     COMPROBAR APROBACIÓN
  ------------------------------------------------------- */

  const activo =
    userData.activo === true

  console.log(
    '🔐 GOOGLE LOGIN:',
    {
      uid: user.uid,
      rol: userData.rol,
      activo,
    }
  )

  /*
   * Igual que con email:
   *
   * activo === false
   * → Login.tsx debe mandar a
   *   /registro-pendiente
   *
   * activo === true
   * → puede entrar al dashboard.
   */

  return {
    user,
    rol: userData.rol,
    activo,
  }
}

/* =========================================================
   LOGOUT
========================================================= */

export async function logout(): Promise<void> {
  console.log(
    '🔒 Cerrando sesión...'
  )

  await signOut(auth)

  console.log(
    '✅ Sesión cerrada.'
  )
}