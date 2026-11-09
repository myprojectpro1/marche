import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useFavs } from '../api'
import { Tile, Empty } from '../ui'

export default function Home({ session }) {
  const nav = useNavigate()
  const [cats, setCats] = useState([])
  const [cat, setCat] = useState(null)
  const [q, setQ] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [favs, toggle] = useFavs(session)

  useEffect(() => {
    supabase.from('categories').select('*').order('id').then(({ data }) => setCats(data || []))
  }, [])

  useEffect(() => {
    setLoading(true)
    let r = supabase
      .from('listings')
      .select('id,title,price,city,photos')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(60)
    if (cat) r = r.eq('category_id', cat)
    if (q.trim()) r = r.ilike('title', `%${q.trim()}%`)
    r.then(({ data }) => {
      setItems(data || [])
      setLoading(false)
    })
  }, [cat, q])

  const onFav = (id, on) => (session ? toggle(id, on) : nav('/login'))

  return (
    <>
      <input className="search glass" placeholder="🔍  Rechercher un article…" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chips">
        <button className={!cat ? 'chip on' : 'chip'} onClick={() => setCat(null)}>Tout</button>
        {cats.map((c) => (
          <button key={c.id} className={cat === c.id ? 'chip on' : 'chip'} onClick={() => setCat(c.id)}>
            {c.icon} {c.name}
          </button>
        ))}
      </div>
      {loading ? <Empty text="Chargement…" /> : items.length === 0 ? (
        <Empty text="Aucune annonce pour le moment. Sois le premier à vendre !" />
      ) : (
        <div className="grid">
          {items.map((l) => <Tile key={l.id} l={l} fav={favs.has(l.id)} onFav={onFav} />)}
        </div>
      )}
    </>
  )
}
