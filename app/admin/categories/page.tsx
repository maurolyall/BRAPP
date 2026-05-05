import { createAdminClient } from '@/lib/supabaseAdmin'
import ToggleCategoryButton from './ToggleCategoryButton'
import AddCategoryForm from './AddCategoryForm'

export default async function AdminCategoriesPage() {
  const supabase = createAdminClient()

  const { data: categories } = await supabase
    .from('service_categories')
    .select('*')
    .order('name')

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-dark)' }}>Categorías</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Activá o desactivá las categorías de servicio disponibles en la app.
        </p>
      </div>

      <AddCategoryForm />

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              {['Nombre', 'Estado', 'Creada', 'Acción'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories && categories.length > 0 ? categories.map((cat, i) => (
              <tr key={cat.id} style={{ borderBottom: i < categories.length - 1 ? '1px solid #f7f7f7' : undefined }} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {cat.icon_url && (
                      <img src={cat.icon_url} alt={cat.name} className="w-8 h-8 object-contain" />
                    )}
                    <span className="font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>{cat.name}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: cat.active ? '#05966918' : '#dc262618',
                      color: cat.active ? '#059669' : '#dc2626',
                    }}
                  >
                    {cat.active ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {new Date(cat.created_at).toLocaleDateString('es-AR')}
                </td>
                <td className="px-5 py-4">
                  <ToggleCategoryButton id={cat.id} active={cat.active} />
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                  No hay categorías.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
