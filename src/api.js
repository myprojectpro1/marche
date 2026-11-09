import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export async function byIds(table, ids, cols = '*') {
  const list = [...new Set(ids.filter(Boolean))]
  if (!list.length) return {}
  const { data } = await supabase.from(table).select(cols).in('id', list)
  return Object.fromEntries((data || []).map((r) => [r.id, r]))
}

let catCache = null
export function useCategories() {
  const [c, setC] = useState(catCache || [])
  useEffect(() => {
    if (catCache) return
    supabase.from('categories').select('*').order('id').then(({ data }) => {
      catCache = data || []
      setC(catCache)
    })
  }, [])
  return c
}

export function useDebounced(value, ms = 300) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
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

// Réduit les photos (1280 px max, JPEG 80 %) avant envoi : bien plus rapide en 3G/4G
async function compress(file, max = 1280, q = 0.8) {
  try {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
    const bmp = await createImageBitmap(file)
    const r = Math.min(1, max / Math.max(bmp.width, bmp.height))
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * r)
    c.height = Math.round(bmp.height * r)
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', q))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' })
  } catch {
    return file
  }
}

export async function uploadImage(uid, file, prefix = '') {
  const f = await compress(file)
  const ext = (f.name.split('.').pop() || 'jpg').toLowerCase()
  const path = `${uid}/${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('listings').upload(path, f, { cacheControl: '31536000' })
  if (error) throw error
  return supabase.storage.from('listings').getPublicUrl(path).data.publicUrl
}
