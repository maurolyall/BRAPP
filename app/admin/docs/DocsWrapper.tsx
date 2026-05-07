'use client'

import dynamic from 'next/dynamic'

const DocsClient = dynamic(() => import('./DocsClient'), { ssr: false })

export default function DocsWrapper({ content }: { content: string }) {
  return <DocsClient content={content} />
}
