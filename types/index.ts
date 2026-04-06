export type UserRole = 'user' | 'provider' | 'admin'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Booking {
  id: string
  user_id: string
  category_id: string | null
  provider_id: string | null
  status: 'searching' | 'pending' | 'confirmed' | 'completed' | 'cancelled'
  description: string | null
  image_url: string | null
  scheduled_date: 'today' | 'coordinate' | null
  payment_method: 'coordinate' | 'prepaid' | null
  address: string | null
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  read: boolean
  created_at: string
}

export interface ChatRoom {
  id: string
  participant_ids: string[]
  last_message: string | null
  updated_at: string
}
