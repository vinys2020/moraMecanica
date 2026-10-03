import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

setGlobalOptions({
  maxInstances: 10,
});

initializeApp();

export const eliminarUsuario = onCall(async (request) => {
  // Verificar que haya un usuario autenticado
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Debés estar autenticado."
    );
  }

  const uid = request.data?.uid;

  // Verificar que se haya enviado el UID
  if (!uid || typeof uid !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "No se recibió un UID válido."
    );
  }

  // Verificar que quien ejecuta la función sea administrador
  const adminDoc = await getFirestore()
    .collection("usuarios")
    .doc(request.auth.uid)
    .get();

  if (
    !adminDoc.exists ||
    adminDoc.data()?.rol !== "admin"
  ) {
    throw new HttpsError(
      "permission-denied",
      "No tenés permisos para eliminar usuarios."
    );
  }

  try {
    // Eliminar usuario de Firebase Authentication
    await getAuth().deleteUser(uid);

    return {
      success: true,
      message: "Usuario eliminado correctamente de Authentication.",
    };
  } catch (error: any) {
    console.error(
      "Error eliminando usuario de Authentication:",
      error
    );

    // Si ya no existe en Auth, consideramos la operación correcta
    if (error?.code === "auth/user-not-found") {
      return {
        success: true,
        message: "El usuario ya no existía en Authentication.",
      };
    }

    throw new HttpsError(
      "internal",
      "No se pudo eliminar el usuario de Authentication."
    );
  }
});