
import { setGlobalOptions } from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";

import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { randomBytes } from "node:crypto";

setGlobalOptions({
  maxInstances: 10,
});

initializeApp();

// ======================================================
// VERIFICAR ADMINISTRADOR
// ======================================================

async function verificarAdmin(uid: string): Promise<void> {
  const adminDoc = await getFirestore()
    .collection("usuarios")
    .doc(uid)
    .get();

  if (!adminDoc.exists || adminDoc.data()?.rol !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "No tenés permisos para realizar esta operación."
    );
  }
}

// ======================================================
// ELIMINAR USUARIO
// ======================================================

export const eliminarUsuario = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Debés estar autenticado."
    );
  }

  const uid = request.data?.uid;

  if (!uid || typeof uid !== "string") {
    throw new HttpsError(
      "invalid-argument",
      "No se recibió un UID válido."
    );
  }

  const adminDoc = await getFirestore()
    .collection("usuarios")
    .doc(request.auth.uid)
    .get();

  if (!adminDoc.exists || adminDoc.data()?.rol !== "admin") {
    throw new HttpsError(
      "permission-denied",
      "No tenés permisos para eliminar usuarios."
    );
  }

  try {
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

// ======================================================
// CREAR CLIENTE Y GENERAR QR PERMANENTE
// ======================================================

export const crearClienteConQR = onCall(
  { region: "us-central1" },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "Debés iniciar sesión."
      );
    }

    await verificarAdmin(request.auth.uid);

    const {
      nombre,
      email,
      telefono,
      direccion,
      origin,
    } = request.data ?? {};

    if (typeof nombre !== "string" || !nombre.trim()) {
      throw new HttpsError(
        "invalid-argument",
        "El nombre del cliente es obligatorio."
      );
    }

    if (
      email !== undefined &&
      email !== null &&
      typeof email !== "string"
    ) {
      throw new HttpsError(
        "invalid-argument",
        "El correo electrónico no es válido."
      );
    }

    if (typeof origin !== "string" || !origin.trim()) {
      throw new HttpsError(
        "invalid-argument",
        "No se recibió la dirección de la aplicación."
      );
    }

    let baseUrl: string;

    try {
      const parsedUrl = new URL(origin);

      if (
        parsedUrl.protocol !== "https:" &&
        parsedUrl.protocol !== "http:"
      ) {
        throw new Error("Protocolo no permitido.");
      }

      // En producción acepta solamente el dominio oficial.
      // En desarrollo permite localhost para probar.
      const hostname = parsedUrl.hostname;
      const esDominioPermitido =
        hostname === "www.moramecanica.com.ar" ||
        hostname === "moramecanica.com.ar" ||
        hostname === "localhost" ||
        hostname === "127.0.0.1";

      if (!esDominioPermitido) {
        throw new Error("Dominio no permitido.");
      }

      // Evitar HTTP en dominios públicos.
      if (
        parsedUrl.protocol === "http:" &&
        hostname !== "localhost" &&
        hostname !== "127.0.0.1"
      ) {
        throw new Error("Se requiere HTTPS.");
      }

      baseUrl = parsedUrl.origin;
    } catch {
      throw new HttpsError(
        "invalid-argument",
        "La dirección de la aplicación no es válida o no está permitida."
      );
    }

    const nombreLimpio = nombre.trim();
    const emailLimpio =
      typeof email === "string" ? email.trim() : "";
    const telefonoLimpio =
      typeof telefono === "string" ? telefono.trim() : "";
    const direccionLimpia =
      typeof direccion === "string" ? direccion.trim() : "";

    const db = getFirestore();
    const authAdmin = getAuth();

    let uid: string | undefined;

    try {
      const nuevoUsuario = await authAdmin.createUser({
        displayName: nombreLimpio,
        ...(emailLimpio ? { email: emailLimpio } : {}),
      });

      uid = nuevoUsuario.uid;

      await db.collection("usuarios").doc(uid).set({
        nombre: nombreLimpio,
        email: emailLimpio,
        telefono: telefonoLimpio,
        direccion: direccionLimpia,
        rol: "cliente",
        activo: true,
        creadoEn: Timestamp.now(),
      });

      // Generar una llave permanente para el QR.
      const token = randomBytes(32).toString("hex");

      // El QR no vence ni se consume. Puede revocarse manualmente.
      await db.collection("activacionesQR").doc(token).set({
        uid,
        creadoEn: Timestamp.now(),
        revocado: false,
      });

      // Generar enlace usando la URL recibida y validada.
      const qrUrl = new URL("/acceso-qr", baseUrl);
      qrUrl.searchParams.set("token", token);

      return {
        success: true,
        uid,
        qrUrl: qrUrl.toString(),
      };
    } catch (error: any) {
      console.error("Error creando cliente con QR:", error);

      if (uid) {
        try {
          await db.collection("activacionesQR")
            .where("uid", "==", uid)
            .get()
            .then(async (snapshot) => {
              const batch = db.batch();
              snapshot.docs.forEach((doc) => batch.delete(doc.ref));
              await batch.commit();
            });
        } catch (cleanupError) {
          console.error(
            "Error limpiando QR del cliente:",
            cleanupError
          );
        }

        try {
          await db.collection("usuarios").doc(uid).delete();
        } catch (cleanupError) {
          console.error(
            "Error limpiando datos del cliente:",
            cleanupError
          );
        }

        try {
          await authAdmin.deleteUser(uid);
        } catch (cleanupError) {
          console.error(
            "Error limpiando usuario de Authentication:",
            cleanupError
          );
        }
      }

      if (error instanceof HttpsError) {
        throw error;
      }

      if (error?.code === "auth/email-already-exists") {
        throw new HttpsError(
          "already-exists",
          "Ya existe un usuario con ese correo electrónico."
        );
      }

      throw new HttpsError(
        "internal",
        "No se pudo crear el cliente y generar su QR."
      );
    }
  }
);

// ======================================================
// VALIDAR QR E INICIAR SESIÓN DEL CLIENTE
// ======================================================

export const canjearQRCliente = onCall(
  { region: "us-central1" },
  async (request) => {
    const token = request.data?.token;

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/.test(token)
    ) {
      throw new HttpsError(
        "invalid-argument",
        "El código QR no es válido."
      );
    }

    const db = getFirestore();
    const activacionRef = db
      .collection("activacionesQR")
      .doc(token);

    const uid = await db.runTransaction(async (transaction) => {
      const activacionDoc = await transaction.get(activacionRef);

      if (!activacionDoc.exists) {
        throw new HttpsError(
          "not-found",
          "El QR no existe o ya no es válido."
        );
      }

      const activacion = activacionDoc.data()!;

      if (activacion.revocado === true) {
        throw new HttpsError(
          "permission-denied",
          "Este QR fue deshabilitado."
        );
      }

      if (
        typeof activacion.uid !== "string" ||
        !activacion.uid
      ) {
        throw new HttpsError(
          "failed-precondition",
          "El QR no está asociado a un cliente válido."
        );
      }

      const usuarioRef = db
        .collection("usuarios")
        .doc(activacion.uid);

      const usuarioDoc = await transaction.get(usuarioRef);
      const usuario = usuarioDoc.data();

      if (
        !usuarioDoc.exists ||
        usuario?.rol !== "cliente" ||
        usuario?.activo !== true
      ) {
        throw new HttpsError(
          "permission-denied",
          "La cuenta del cliente no está habilitada."
        );
      }

      return activacion.uid as string;
    });

    try {
      const customToken = await getAuth().createCustomToken(uid);

      return {
        success: true,
        customToken,
      };
    } catch (error) {
      console.error("Error generando token de acceso:", error);

      throw new HttpsError(
        "internal",
        "No se pudo generar el acceso del cliente."
      );
    }
  }
);
