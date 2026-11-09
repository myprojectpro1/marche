import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useFavs } from '../api'
import { Avatar, Tile, Empty } from '../ui'

export default function Seller({ session }) {
  const { id } = useParams()
  const nav = useNavigate()
  const [p, setP] = useState(null)
  const [items, setItems] = useState([])
  const [favs, toggle] = useFavs(session)

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', id).maybeSingle().then(({ data }) => setP(data))
    supabase.from('listings').select('id,title,price,city,photos').eq('seller_id', id).eq('status', 'active')
      .order('created_at', { ascending: false }).then(({ data }) => setItems(data || []))
  }, [id])

  if (!p) return <Empty text="Chargement…" />
  return (
    <>
      <div className="glass card hero">
        <Avatar p={p} size={84} />
        <h2>{p.full_name || p.username || 'Membre'}</h2>
        <p className="note">{p.city}</p>
        {p.bio && <p>{p.bio}</p>}
      </div>
      <h4 className="group">Annonces ({items.length})</h4>
      <div className="grid">
        {items.map((l) => <Tile key={l.id} l={l} fav={favs.has(l.id)} onFav={(i, on) => (session ? toggle(i, on) : nav('/login'))} />)}
      </div>
    </>
  )
}
