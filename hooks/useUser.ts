'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import type { Profile } from '@/types'
import type { User } from '@supabase/supabase-js'

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    }

    fetchUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) setProfile(null)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  return { user, profile, loading }
}
