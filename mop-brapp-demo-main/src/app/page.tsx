import { SocketDemo } from "./socket-demo";

const DEFAULT_SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? "wss://socket.momentofpeople.com";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">MoP × Botón Rojo App — demo</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Cliente de referencia para integrarse con{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
            mop-socket-server
          </code>
          . Pegá la API key (la entrega el equipo MoP), conectá, y emití /
          recibí eventos en tiempo real. Útil para validar el contrato BRAPP v1
          antes de armar el cliente en producción.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Server target:{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
            {DEFAULT_SOCKET_URL}/v1/socket/
          </code>
        </p>
      </header>

      <SocketDemo socketUrl={DEFAULT_SOCKET_URL} />

      <footer className="mt-12 border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">
        <p>
          Doc completo del contrato:{" "}
          <a
            href="https://github.com/MomentOfPeople/mop-docs/blob/main/decisions/2026-06-02-respuesta-brapp-integracion.md"
            target="_blank"
            rel="noreferrer"
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            mop-docs/decisions/2026-06-02-respuesta-brapp-integracion.md
          </a>
        </p>
        <p className="mt-1">
          Source: <code>mop-brapp-demo</code> · Stack: Next.js 16 + Socket.IO ·
          Server: Cloud Run · No persistencia.
        </p>
      </footer>
    </main>
  );
}
