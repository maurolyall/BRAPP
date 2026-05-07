'use client'

import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import GithubSlugger from 'github-slugger'

type TocItem = { id: string; text: string; level: number }

function buildToc(markdown: string): TocItem[] {
  const items: TocItem[] = []
  const slugger = new GithubSlugger()
  for (const line of markdown.split('\n')) {
    const match = line.match(/^(#{1,4})\s+(.+)/)
    if (match) {
      const raw = match[2].replace(/`([^`]+)`/g, '$1')
      items.push({
        id: slugger.slug(raw),
        text: raw,
        level: match[1].length,
      })
    }
  }
  return items
}

function splitSections(markdown: string) {
  const lines = markdown.split('\n')
  const pendingStart = lines.findIndex(l => l.includes('Pendiente') && l.startsWith('#'))
  if (pendingStart === -1) return { done: markdown, pending: '' }
  return {
    done: lines.slice(0, pendingStart).join('\n'),
    pending: lines.slice(pendingStart).join('\n'),
  }
}

const SECTION_FILTERS = [
  { label: 'Todo', value: 'all' },
  { label: 'Implementado', value: 'done' },
  { label: 'Pendiente', value: 'pending' },
]

export default function DocsClient({ content }: { content: string }) {
  const [filter, setFilter] = useState('all')
  const [activeId, setActiveId] = useState('')
  const tocRef = useRef<HTMLDivElement>(null)

  const toc = buildToc(content)
  const { done, pending } = splitSections(content)
  const displayedContent = filter === 'done' ? done : filter === 'pending' ? pending : content

  const visibleToc = (
    filter === 'done'
      ? toc.slice(0, toc.findIndex(t => t.text.includes('Pendiente')) || toc.length)
      : filter === 'pending'
      ? toc.slice(toc.findIndex(t => t.text.includes('Pendiente')))
      : toc
  ).filter(item => item.level === 2)

  // Scrollspy
  useEffect(() => {
    function onScroll() {
      const headings = Array.from(document.querySelectorAll('.docs-content h2')) as HTMLElement[]
      let current = ''
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= 80) current = h.id
      }
      setActiveId(current)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [displayedContent])

  // Auto-scroll TOC to keep active item visible
  useEffect(() => {
    if (!activeId || !tocRef.current) return
    const btn = tocRef.current.querySelector(`[data-id="${activeId}"]`) as HTMLElement
    if (!btn) return
    const container = tocRef.current
    const btnTop = btn.offsetTop
    const btnBottom = btnTop + btn.offsetHeight
    if (btnTop < container.scrollTop) container.scrollTop = btnTop - 8
    else if (btnBottom > container.scrollTop + container.clientHeight)
      container.scrollTop = btnBottom - container.clientHeight + 8
  }, [activeId])

  return (
    <div className="flex gap-8 relative">
      {/* TOC sidebar */}
      <aside className="hidden xl:flex flex-col w-52 flex-shrink-0">
        <div className="sticky top-6 flex flex-col" style={{ maxHeight: 'calc(100vh - 3rem)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            En esta página
          </p>
          <div
            ref={tocRef}
            className="flex flex-col gap-0.5 overflow-y-auto pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}
          >
            {visibleToc.map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                data-id={item.id}
                className="text-left text-sm py-1 rounded-lg transition-all truncate"
                style={{
                  paddingLeft: 8,
                  paddingRight: 8,
                  color: activeId === item.id ? 'var(--primary-red)' : 'var(--text-muted)',
                  backgroundColor: activeId === item.id ? '#FFF0F0' : 'transparent',
                  fontWeight: 600,
                  display: 'block',
                  textDecoration: 'none',
                }}
              >
                {item.text}
              </a>
            ))}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex gap-2 mb-8">
          {SECTION_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={{
                backgroundColor: filter === f.value ? 'var(--primary-red)' : '#f0f0f0',
                color: filter === f.value ? 'white' : 'var(--text-muted)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="prose-docs docs-content">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeSlug]}
            components={{
              h1: ({ children, ...props }) => <h1 className="docs-h1" {...props}>{children}</h1>,
              h2: ({ children, ...props }) => <h2 className="docs-h2" {...props}>{children}</h2>,
              h3: ({ children, ...props }) => <h3 className="docs-h3" {...props}>{children}</h3>,
              h4: ({ children, ...props }) => <h4 className="docs-h4" {...props}>{children}</h4>,
              table: ({ children }) => (
                <div className="overflow-x-auto my-4">
                  <table className="docs-table">{children}</table>
                </div>
              ),
              th: ({ children }) => <th className="docs-th">{children}</th>,
              td: ({ children }) => <td className="docs-td">{children}</td>,
              tr: ({ children }) => <tr className="docs-tr">{children}</tr>,
              code: ({ children, className }) =>
                className?.includes('language-')
                  ? <code className="docs-code-block">{children}</code>
                  : <code className="docs-code-inline">{children}</code>,
              pre: ({ children }) => <pre className="docs-pre">{children}</pre>,
              blockquote: ({ children }) => <blockquote className="docs-blockquote">{children}</blockquote>,
              ul: ({ children }) => <ul className="docs-ul">{children}</ul>,
              ol: ({ children }) => <ol className="docs-ol">{children}</ol>,
              li: ({ children }) => <li className="docs-li">{children}</li>,
              p: ({ children }) => <p className="docs-p">{children}</p>,
              strong: ({ children }) => <strong className="docs-strong">{children}</strong>,
              hr: () => <hr className="docs-hr" />,
            }}
          >
            {displayedContent}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
