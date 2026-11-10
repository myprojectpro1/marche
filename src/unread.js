import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useUnread(session, pathname) {
  const [n, setN] = useState(0)
  const uid = session?.user.id
  useEffect(() => {
    if (!uid) { setN(0); return }
    let live = true
    const load = () =>
      supabase.from('messages').select('id', { count: 'exact', head: true })
        .eq('receiver_id', uid).is('read_at', null)
        .then(({ count }) => { if (live) setN(count || 0) })
    load()
    const t = setInterval(load, 15000)
    return () => { live = false; clearInterval(t) }
  }, [uid, pathname])
  return n
}
