/**
 * Rutas que se muestran a pantalla completa (solo el header de Botón Rojo):
 * la vista de chat desde la que se generan las solicitudes.
 */
export function isChatRoute(pathname: string | null): boolean {
  return /^\/dashboard\/client\/services\/[^/]+$/.test(pathname ?? '')
}
