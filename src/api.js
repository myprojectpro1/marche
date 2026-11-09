import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export async function byIds(table, ids, cols = '*') {
  const list = [...new Set(ids.filter(Boolean))]
  if (!list.length) return {}
  const { data } = await supabase.from(table).select(cols).in('id', list)
  return Object.fromEntries((data || []).map((r) => [r.id, r]))
}

export function useFavs(session) {
  const [favs, setFavs] = useState(new Set())
  const uid = session?.user.id
  useEffect(() => {
    if (!uid) return setFavs(new Set())
    supabase.from('favorites').select('listing_id').eq('user_id', uid)
      .then(({ data }) => setFavs(new Set((data || []).map((r) => r.listing_id))))
  }, [uid])
  async function toggle(id, on) {
    setFavs((s) => {
      const n = new Set(s)
      on ? n.delete(id) : n.add(id)
      return n
    })
    if (on) await supabase.from('favorites').delete().match({ user_id: uid, listing_id: id })
    else await supabase.from('favorites').insert({ user_id: uid, listing_id: id })
  }
  return [favs, toggle]
}

export async function uploadImage(uid, file, prefix = '') {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${uid}/${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('listings').upload(path, file)
  if (error) throw error
  return supabase.storage.from('listings').getPublicUrl(path).data.publicUrl
}
