// Se ejecuta una vez al arrancar el servidor, antes de atender el primer request.
//
// El socket de MoP es la única vía por la que llegan las respuestas del bot. Si
// no lo abrimos acá, la conexión solo nace cuando alguien manda un mensaje
// (getMopSocket() dentro de /api/support/message), y toda respuesta que llegue
// mientras no hay conexión se pierde.
export async function register() {
  // El runtime edge (middleware) no soporta sockets — solo nos interesa Node.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  if (!process.env.MOP_API_KEY) {
    console.warn('[mop] MOP_API_KEY no configurada — no se abre el socket al arrancar')
    return
  }

  const { getMopSocket } = await import('@/lib/mop-socket')
  getMopSocket()
  console.log('[mop] socket inicializado al arrancar el servidor')
}
