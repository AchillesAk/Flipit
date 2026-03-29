export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
}

export type ProductCondition = 'novo' | 'seminovo' | 'usado'

export type Product = {
  id: string
  user_id: string
  title: string
  description: string | null
  category: string | null
  condition: ProductCondition
  price_cents: number
  accept_any: boolean
  accept_min_cents: number | null
  accept_max_cents: number | null
  image_url: string | null
  is_active: boolean
  created_at: string
}

export type SwipeDirection = 'like' | 'pass'

export type Swipe = {
  id: string
  swiper_product_id: string
  swiped_product_id: string
  direction: SwipeDirection
  created_at: string
}

export type MatchStatus = 'pending' | 'accepted' | 'rejected'

export type Match = {
  id: string
  product_a_id: string
  product_b_id: string
  status: MatchStatus
  created_at: string
}

export type Message = {
  id: string
  match_id: string
  sender_id: string
  content: string
  created_at: string
  read_at: string | null
}
