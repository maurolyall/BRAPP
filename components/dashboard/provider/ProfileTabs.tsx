'use client'

import { useState } from 'react'
import ProfileForm from './ProfileForm'
import ServiceCategoryCard from './ServiceCategoryCard'
import AvatarUpload from './AvatarUpload'
import MenuCard from '@/components/ui/MenuCard'

interface ProfileData {
  full_name: string
  phone: string
  date_of_birth: string
  dni: string
  cuit: string
  business_name: string
  city: string
  address: string
  floor_apt: string
  lot: string
}

interface Category {
  id: string
  name: string
  icon_url: string | null
}

interface Props {
  userId: string
  avatarUrl: string | null
  profile: ProfileData
  categories: Category[]
}

type Tab = 'profile' | 'services'

export default function ProfileTabs({ userId, avatarUrl, profile, categories }: Props) {
  const [active, setActive] = useState<Tab>('services')

  return (
    <div className="flex flex-col gap-4">
      {/* Configuración */}
      <MenuCard
        href="/dashboard/provider/settings"
        label="Configuración"
        icon={
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        }
      />

      {/* Segmented control */}
      <div
        className="flex p-1 rounded-full"
        style={{ backgroundColor: 'var(--bg-cards)', boxShadow: '0 8px 20px rgba(0,0,0,0.04)' }}
      >
        <button
          onClick={() => setActive('services')}
          className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
          style={{
            backgroundColor: active === 'services' ? 'var(--primary-red)' : 'transparent',
            color: active === 'services' ? 'white' : 'var(--text-muted)',
          }}
        >
          Mis servicios
        </button>
        <button
          onClick={() => setActive('profile')}
          className="flex-1 py-2.5 rounded-full text-sm font-semibold transition-all"
          style={{
            backgroundColor: active === 'profile' ? 'var(--primary-red)' : 'transparent',
            color: active === 'profile' ? 'white' : 'var(--text-muted)',
          }}
        >
          Mi perfil
        </button>
      </div>

      {/* Content */}
      {active === 'profile' && (
        <>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>Mi perfil</h1>
          <AvatarUpload userId={userId} avatarUrl={avatarUrl} />
          <ProfileForm profile={profile} />
        </>
      )}
      {active === 'services' && (
        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>Mis servicios</h1>
          {categories.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
              Todavía no tenés servicios configurados.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat, i) => (
                <ServiceCategoryCard key={cat.id ?? i} category={cat} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
