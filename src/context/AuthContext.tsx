
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import {
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth'

import { auth } from '../config/firebase'

import {
  obtenerDatosUsuario,
  loginWithEmail,
  logout as firebaseLogout,
  type UserData,
  type UserRole,
} from '../services/auth'

interface AuthContextType {
  user: FirebaseUser | null
  userData: UserData | null
  rol: UserRole | null
  loading: boolean

  login: (
    email: string,
    pass: string
  ) => Promise<{
    user: FirebaseUser
    rol: UserRole | null
    activo: boolean
  }>

  logout: () => Promise<void>
}

const AuthContext =
  createContext<AuthContextType | undefined>(
    undefined
  )

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [user, setUser] =
    useState<FirebaseUser | null>(null)

  const [userData, setUserData] =
    useState<UserData | null>(null)

  const [rol, setRol] =
    useState<UserRole | null>(null)

  const [loading, setLoading] =
    useState(true)

  const loginInProgress =
    useRef(false)

  /* =========================================================
     SESIÓN INICIAL
  ========================================================= */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (currentUser) => {

          /*
           * Si login() está trabajando,
           * no interferimos.
           */
          if (loginInProgress.current) {
            return
          }

          try {
            setLoading(true)

            /* -------------------------
               SIN SESIÓN
            ------------------------- */

            if (!currentUser) {
              setUser(null)
              setUserData(null)
              setRol(null)

              return
            }

            console.log(
              '🔐 Sesión encontrada:',
              currentUser.uid
            )

            /* -------------------------
               FIRESTORE
            ------------------------- */

            const data =
              await obtenerDatosUsuario(
                currentUser.uid
              )

            console.log(
              '👤 Datos Firestore:',
              data
            )

            /* -------------------------
               SIN DOCUMENTO
            ------------------------- */

            if (!data) {
              await firebaseLogout()

              setUser(null)
              setUserData(null)
              setRol(null)

              return
            }

            /* -------------------------
               CUENTA INACTIVA
            ------------------------- */

            if (data.activo !== true) {
              await firebaseLogout()

              setUser(null)
              setUserData(null)
              setRol(null)

              return
            }

            /* -------------------------
               CUENTA ACTIVA
            ------------------------- */

            setUser(currentUser)
            setUserData(data)
            setRol(data.rol ?? null)

            console.log(
              '✅ SESIÓN ACTIVA',
              {
                rol: data.rol,
                activo: data.activo,
              }
            )

          } catch (error) {
            console.error(
              '❌ Error verificando sesión:',
              error
            )

            setUser(null)
            setUserData(null)
            setRol(null)

          } finally {
            setLoading(false)
          }
        }
      )

    return () => unsubscribe()
  }, [])

  /* =========================================================
     LOGIN
  ========================================================= */

  const login = async (
    email: string,
    pass: string
  ) => {
    loginInProgress.current = true

    try {
      setLoading(true)

      const result =
        await loginWithEmail(
          email,
          pass
        )

      console.log(
        '🔑 LOGIN RESULT:',
        result
      )

      /*
       * SOLAMENTE si está activo
       * guardamos la sesión en React.
       */

      if (result.activo === true) {
        const data: UserData = {
          uid: result.user.uid,
          email: result.user.email,
          rol: result.rol,
          activo: true,
          nombre:
            result.user.displayName ?? '',
        }

        setUser(result.user)
        setUserData(data)
        setRol(result.rol)

        console.log(
          '✅ USUARIO ACTIVO',
          {
            rol: result.rol,
            activo: result.activo,
          }
        )
      }

      /*
       * Si está inactivo NO hacemos logout.
       * Login.tsx lo enviará a:
       *
       * /registro-pendiente
       */

      return result

    } catch (error) {
      setUser(null)
      setUserData(null)
      setRol(null)

      throw error

    } finally {
      loginInProgress.current = false
      setLoading(false)
    }
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  const logout = async () => {
    await firebaseLogout()

    setUser(null)
    setUserData(null)
    setRol(null)
  }

  /* =========================================================
     PROVIDER
  ========================================================= */

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        rol,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/* =========================================================
   HOOK
========================================================= */

export function useAuth() {
  const context =
    useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth debe ser usado dentro de un AuthProvider'
    )
  }

  return context
}

