import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useFavs, useCategories, useDebounced } from '../api'
import { Tile, Empty, GridSkeleton } from '../ui'

const PAGE = 20
const memo = new Map() // affichage instantané des résultats déjà vus

export default function Home({ session }) {
  const nav = useNavigate()
  const cats = useCategories()
  const [cat, setCat] = useState(null)
  const [q, setQ] = useState('')
  const [n, setN] = useState(PAGE)
  const dq = useDebounced(q.trim(), 300)
  const key = `${cat || 0}|${dq}|${n}`
  const [items, setItems] = useState(memo.get(key) || null)
  const [favs, toggle] = useFavs(session)

  useEffect(() => {
    let live = true
    setItems(memo.get(key) || null)
    let r = supabase.from('listings').select('id,title,price,city,photos')
      .eq('status', 'active').order('created_at', { ascending: false }).limit(n)
    if (cat) r = r.eq('category_id', cat)
    if (dq) r = r.ilike('title', `%${dq}%`)
    r.then(({ data }) => {
      if (!live) return
      memo.set(key, data || [])
      setItems(data || [])
    })
    return () => { live = false }
  }, [key])

  const onFav = (id, on) => (session ? toggle(id, on) : nav('/login'))
  const pick = (c) => { setCat(c); setN(PAGE) }

  return (
    <>
      <input className="search glass" placeholder="🔍  Rechercher un article…" value={q}
        onChange={(e) => { setQ(e.target.value); setN(PAGE) }} />
      <div className="chips">
        <button className={!cat ? 'chip on' : 'chip'} onClick={() => pick(null)}>Tout</button>
        {cats.map((c) => (
          <button key={c.id} className={cat === c.id ? 'chip on' : 'chip'} onClick={() => pick(c.id)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>
      {items === null ? <GridSkeleton /> : items.length === 0 ? (
        <Empty text="Aucune annonce pour le moment. Sois le premier à vendre !" />
      ) : (
        <>
          <div className="grid">
            {items.map((l) => <Tile key={l.id} l={l} fav={favs.has(l.id)} onFav={onFav} />)}
          </div>
          {items.length >= n && <button className="btn alt more" onClick={() => setN(n + PAGE)}>Voir plus</button>}
        </>
      )}
    </>
  )
}
