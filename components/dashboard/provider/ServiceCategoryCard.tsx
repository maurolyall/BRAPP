import Link from 'next/link'

interface Category {
  id: string
  name: string
  icon_url: string | null
}

interface Props {
  category: Category
}

export default function ServiceCategoryCard({ category }: Props) {
  return (
    <Link
      href={`/dashboard/provider/services/${category.id}`}
      className="dash-card flex flex-col items-center justify-center gap-3 py-6 transition-opacity active:opacity-70"
    >
      {category.icon_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={category.icon_url} alt={category.name} style={{ width: 120, height: 120, objectFit: 'contain' }} />
      ) : (
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="var(--text-dark)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      )}
      <span className="font-semibold text-sm text-center" style={{ color: 'var(--text-dark)' }}>
        {category.name}
      </span>
    </Link>
  )
}
