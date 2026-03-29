import { useCallback, useEffect, useState } from 'react'
import type { Product } from '../types'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useMyProducts() {
  const user = useAuthStore((s) => s.user)
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (err) {
      setError(err.message)
      setItems([])
      setLoading(false)
      return
    }
    setItems((data ?? []) as Product[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  const setActive = useCallback(
    async (id: string, is_active: boolean) => {
      const { error: err } = await supabase
        .from('products')
        .update({ is_active })
        .eq('id', id)
      if (err) throw err
      await reload()
    },
    [reload],
  )

  return { items, loading, error, reload, setActive }
}

