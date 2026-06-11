"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type LogEntry = {
  ts: string;
  kind:
    | "info"
    | "ok"
    | "warn"
    | "err"
    | "in"
    | "out"
    | "hello"
    | "event"
    | "ack";
  msg: string;
  data?: unknown;
};

type HelloPayload = {
  service?: string;
  clientId?: string;
  capabilities?: {
    allowedWorkspaceIds?: string[];
    allowedSchemas?: string[];
  };
  catalogUrl?: string;
};

const KIND_CLASS: Record<LogEntry["kind"], string> = {
  info: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  ok: "bg-emerald-200 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  warn: "bg-amber-200 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  err: "bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-300",
  in: "bg-blue-200 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  out: "bg-purple-200 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  hello: "bg-teal-200 text-teal-800 dark:bg-teal-900 dark:text-teal-300",
  event: "bg-sky-200 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  ack: "bg-indigo-200 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
};

function nowHms(): string {
  const d = new Date();
  return (
    d.toLocaleTimeString("es-AR", { hour12: false }) +
    "." +
    String(d.getMilliseconds()).padStart(3, "0")
  );
}

type Props = {
  socketUrl: string;
};

export function SocketDemo({ socketUrl }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [text, setText] = useState("hola desde el demo brapp");
  const [externalUserId, setExternalUserId] = useState("demo-user-001");
  const [connected, setConnected] = useState(false);
  const [hello, setHello] = useState<HelloPayload | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  function append(entry: Omit<LogEntry, "ts">) {
    setLog((prev) => [...prev, { ...entry, ts: nowHms() }]);
  }

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [log]);

  useEffect(
    () => () => {
      socketRef.current?.disconnect();
    },
    [],
  );

  function connect() {
    if (!apiKey.trim()) {
      alert("Pegá la API key primero");
      return;
    }
    if (socketRef.current?.connected) return;

    append({ kind: "info", msg: `Conectando a ${socketUrl}/v1/socket/...` });

    const socket = io(socketUrl, {
      path: "/v1/socket/",
      transports: ["websocket"],
      auth: { key: apiKey.trim() },
      reconnection: false,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      append({ kind: "ok", msg: `connected (id: ${socket.id})` });
    });
    socket.on("disconnect", (reason) => {
      setConnected(false);
      append({ kind: "warn", msg: `disconnect: ${reason}` });
    });
    socket.on("connect_error", (err) => {
      setConnected(false);
      append({ kind: "err", msg: `connect_error: ${err.message}` });
    });
    socket.on("hello", (data: HelloPayload) => {
      setHello(data);
      append({ kind: "hello", msg: "hello", data });
    });
    socket.on("event", (data) => {
      const schema =
        (data as { schema?: string })?.schema ?? "(no schema)";
      append({ kind: "event", msg: schema, data });
    });
  }

  function disconnect() {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
    setHello(null);
  }

  function emitInbound() {
    if (!socketRef.current?.connected) return;
    const payload = {
      schema: "mop.client.message.inbound/v1",
      idempotencyKey: crypto.randomUUID(),
      payload: {
        externalUserId,
        user: {
          name: "Demo User",
          phone: "+5491100000000",
        },
        text,
      },
    };
    append({ kind: "out", msg: "emit client_event", data: payload });
    socketRef.current.emit("client_event", payload, (ack: unknown) => {
      append({ kind: "ack", msg: "ack received", data: ack });
    });
  }

  function clearLog() {
    setLog([]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
      {/* Left: form + capabilities */}
      <div className="space-y-4">
        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold">Conexión</h2>
          <label className="block">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              API key plaintext
            </span>
            <input
              type="password"
              placeholder="br_..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={connected}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-950"
            />
            <span className="mt-1 block text-[11px] text-zinc-500">
              No se persiste. Vive en memoria del browser hasta cerrar la
              pestaña.
            </span>
          </label>

          <div className="mt-3 flex gap-2">
            {connected ? (
              <button
                onClick={disconnect}
                className="flex-1 rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
              >
                Desconectar
              </button>
            ) : (
              <button
                onClick={connect}
                className="flex-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                Conectar
              </button>
            )}
          </div>

          <p className="mt-3 text-[11px] text-zinc-500">
            Estado:{" "}
            <span
              className={
                connected
                  ? "font-medium text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-500"
              }
            >
              {connected ? "conectado" : "desconectado"}
            </span>
          </p>
        </section>

        {hello ? (
          <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="mb-2 text-sm font-semibold">Capabilities</h2>
            <p className="text-xs">
              <span className="text-zinc-500">Cliente: </span>
              <code>{hello.clientId}</code>
            </p>
            <p className="mt-1 text-xs">
              <span className="text-zinc-500">Workspaces: </span>
              <code>{hello.capabilities?.allowedWorkspaceIds?.join(", ")}</code>
            </p>
            <div className="mt-2 text-xs">
              <span className="text-zinc-500">Schemas:</span>
              <ul className="ml-3 mt-1 list-disc">
                {hello.capabilities?.allowedSchemas?.map((s) => (
                  <li key={s}>
                    <code className="text-[11px]">{s}</code>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}

        <section className="rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-3 text-sm font-semibold">Emitir mensaje</h2>
          <label className="block">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              externalUserId
            </span>
            <input
              value={externalUserId}
              onChange={(e) => setExternalUserId(e.target.value)}
              disabled={!connected}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm font-mono dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <label className="mt-3 block">
            <span className="text-xs text-zinc-600 dark:text-zinc-400">
              Texto
            </span>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={!connected}
              className="mt-1 w-full rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </label>
          <button
            onClick={emitInbound}
            disabled={!connected}
            className="mt-3 w-full rounded bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Emitir client_event
          </button>
          <p className="mt-2 text-[11px] text-zinc-500">
            Envía un <code>mop.client.message.inbound/v1</code>. El bot del
            workspace lo procesa contra Voiceflow y devuelve la respuesta vía{" "}
            <code>mop.message.outbound/v1</code>.
          </p>
        </section>
      </div>

      {/* Right: log */}
      <section className="flex flex-col rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex items-center justify-between border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-sm font-semibold">Log de eventos</h2>
          <button
            onClick={clearLog}
            disabled={log.length === 0}
            className="text-xs text-zinc-500 hover:text-zinc-900 disabled:opacity-40 dark:hover:text-zinc-100"
          >
            Limpiar
          </button>
        </header>
        <div className="max-h-[600px] flex-1 overflow-y-auto p-4 font-mono text-xs">
          {log.length === 0 ? (
            <div className="py-12 text-center text-zinc-500">
              Conectá para empezar a ver eventos.
            </div>
          ) : (
            <div className="space-y-2">
              {log.map((entry, i) => (
                <div key={i} className="flex gap-2">
                  <span className="shrink-0 text-zinc-500">{entry.ts}</span>
                  <span
                    className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase ${KIND_CLASS[entry.kind]}`}
                  >
                    {entry.kind}
                  </span>
                  <div className="flex-1 break-all">
                    <div>{entry.msg}</div>
                    {entry.data !== undefined ? (
                      <pre className="mt-1 overflow-x-auto rounded bg-zinc-100 p-2 text-[11px] dark:bg-zinc-950">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
