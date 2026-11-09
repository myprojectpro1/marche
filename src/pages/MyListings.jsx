import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { fcfa } from '../utils'
import { Empty, GridSkeleton } from '../ui'

const LABEL = { active: 'En ligne', reserved: 'Réservé', sold: 'Vendu', hidden: 'Masqué' }

export default function MyListings({ session }) {
  const [items, setItems] = useState(null)

  async function load() {
    const { data } = await supabase.from('listings').select('id,title,price,photos,status')
      .eq('seller_id', session.user.id).order('created_at', { ascending: false })
    setItems(data || [])
  }
  useEffect(() => { load() }, [])

  async function setStatus(id, status) {
    await supabase.from('listings').update({ status }).eq('id', id)
    load()
  }
  async function remove(id) {
    if (!window.confirm('Supprimer cette annonce ?')) return
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) window.alert('Suppression impossible : une commande est liée à cette annonce. Masque-la plutôt.')
    load()
  }

  if (!items) return <GridSkeleton />
  if (!items.length) return <Empty text="Tu n’as pas encore d’annonce." />
  return items.map((l) => (
    <div key={l.id} className="glass card item">
      <Link to={`/annonce/${l.id}`} className="itemhead">
        <div className="thumb" style={{ backgroundImage: l.photos?.[0] ? `url(${l.photos[0]})` : 'none' }} />
        <div>
          <b>{l.title}</b>
          <p className="note">{fcfa(l.price)} · {LABEL[l.status]}</p>
        </div>
      </Link>
      <div className="actions">
        <Link className="btn small alt" to={`/vendre/${l.id}`}>Modifier</Link>
        {l.status !== 'sold' && <button className="btn small alt" onClick={() => setStatus(l.id, 'sold')}>Marquer vendu</button>}
        {l.status === 'hidden'
          ? <button className="btn small alt" onClick={() => setStatus(l.id, 'active')}>Remettre en ligne</button>
          : <button className="btn small alt" onClick={() => setStatus(l.id, 'hidden')}>Masquer</button>}
        <button className="btn small danger" onClick={() => remove(l.id)}>Supprimer</button>
      </div>
    </div>
  ))
}
