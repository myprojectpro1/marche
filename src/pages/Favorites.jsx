import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { useFavs } from '../api'
import { Tile, Empty } from '../ui'

export default function Favorites({ session }) {
  const [favs, toggle] = useFavs(session)
  const [items, setItems] = useState(null)

  useEffect(() => {
    const ids = [...favs]
    if (!ids.length) return setItems([])
    supabase.from('listings').select('id,title,price,city,photos').in('id', ids)
      .then(({ data }) => setItems(data || []))
  }, [favs])

  if (items === null) return <Empty text="Chargement…" />
  if (!items.length) return <Empty text="Aucun favori. Touche le cœur sur une annonce pour la retrouver ici." />
  return (
    <div className="grid">
      {items.map((l) => <Tile key={l.id} l={l} fav={favs.has(l.id)} onFav={toggle} />)}
    </div>
  )
}
