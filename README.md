# MyLibrary Android

Proyecto React + Vite preparado para compilarse como APK Android con Capacitor y GitHub Actions.

## Generar APK desde GitHub (sin ordenador)

1. Sube todos los archivos de este proyecto a la raíz de un repositorio GitHub.
2. Abre **Actions** en el repositorio.
3. Entra en **Build MyLibrary APK** y pulsa **Run workflow** (o espera a que termine la ejecución automática al subir a `main`).
4. Cuando termine correctamente, abre la ejecución y descarga el artefacto **MyLibrary-debug-APK**.
5. Descomprime el ZIP y abre `app-debug.apk` en Android para instalarlo.

Este flujo genera un APK de depuración instalable, no firmado para Google Play.

Los datos actuales se guardan localmente en IndexedDB.
