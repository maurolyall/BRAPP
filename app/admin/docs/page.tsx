import { readFile } from 'fs/promises'
import path from 'path'
import DocsWrapper from './DocsWrapper'

export default async function AdminDocsPage() {
  const filePath = path.join(process.cwd(), 'docs', 'estado-del-proyecto.md')
  const content = await readFile(filePath, 'utf-8')

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>
          Estado del proyecto
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Documento técnico completo — lo que está implementado y lo que sigue.
        </p>
      </div>

      <div
        className="rounded-2xl p-8"
        style={{ backgroundColor: 'var(--bg-cards)', border: '1px solid #e5e7eb' }}
      >
        <DocsWrapper content={content} />
      </div>
    </div>
  )
}
