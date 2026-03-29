import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export function useUnreadTotal() {
  const user = useAuthStore((s) => s.user)
  const [total, setTotal] = useState(0)

  const reload = useCallback(async () => {
    if (!user) {
      setTotal(0)
      return
    }

    const { data: matches, error: matchesErr } = await supabase
      .from('matches')
      .select('id')
      .limit(200)
    if (matchesErr) {
      setTotal(0)
      return
    }
    const matchIds = (matches ?? []).map((m) => m.id)
    if (matchIds.length === 0) {
      setTotal(0)
      return
    }

    const { data: unread, error: unreadErr } = await supabase
      .from('messages')
      .select('id,match_id')
      .in('match_id', matchIds)
      .is('read_at', null)
      .neq('sender_id', user.id)
      .limit(5000)
    if (unreadErr) {
      setTotal(0)
      return
    }
    setTotal(unread?.length ?? 0)
  }, [user])

  useEffect(() => {
    void reload()
  }, [reload])

  return { total, reload }
}

