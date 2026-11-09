import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useFavs } from '../api'
import { fcfa } from '../utils'
import { Avatar, Icon, Empty, Skel } from '../ui'

export default function Listing({ session }) {
  const { id } = useParams()
  const nav = useNavigate()
  const [l, setL] = useState(null)
  const [cat, setCat] = useState(null)
  const [seller, setSeller] = useState(null)
  const [err, setErr] = useState('')
  const [msg, setMsg] = useState('')
  const [favs, toggle] = useFavs(session)

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('listings').select('*').eq('id', id).maybeSingle()
      if (error || !data) return setErr(error?.message || 'Annonce introuvable.')
      setL(data)
      const [c, p] = await Promise.all([
        supabase.from('categories').select('*').eq('id', data.category_id).maybeSingle(),
        supabase.from('profiles').select('id,full_name,username,city,avatar_url').eq('id', data.seller_id).maybeSingle(),
      ])
      setCat(c.data)
      setSeller(p.data)
    })()
  }, [id])

  if (err) return <Empty text={err} />
  if (!l) return (
    <>
      <div className="skel" style={{ height: 300, borderRadius: 22, marginBottom: 12 }} />
      <div className="glass card"><Skel w="40%" h={26} /><div style={{ height: 10 }} /><Skel /><div style={{ height: 8 }} /><Skel w="70%" /></div>
    </>
  )

  const mine = session?.user.id === l.seller_id
  const contactOnly = cat?.payment_mode === 'contact'
  const fav = favs.has(l.id)

  async function buy() {
    const { data, error } = await supabase.from('orders').insert({
      listing_id: l.id, buyer_id: session.user.id, seller_id: l.seller_id, amount: l.price,
    }).select('id').single()
    if (error) {
      if (error.code === '23505') { setMsg('Tu as déjà une commande en cours pour cet article.'); return nav('/commandes') }
      return setMsg(error.message)
    }
    nav(`/paiement/${data.id}`)
  }

  async function share() {
    const url = window.location.href
    if (navigator.share) navigator.share({ title: l.title, url }).catch(() => {})
    else { try { await navigator.clipboard.writeText(url); setMsg('Lien copié.') } catch { setMsg(url) } }
  }

  const attrs = Object.entries(l.attributes || {}).filter(([, v]) => v)

  return (
    <>
      <div className="photos">
        {(l.photos?.length ? l.photos : [null]).map((p, i) =>
          p ? <img key={p} src={p} alt="" loading={i ? 'lazy' : 'eager'} decoding="async" /> : <div key={i} className="noimg">Pas de photo</div>
        )}
      </div>

      <div className="glass card">
        <div className="between">
          <h3>{fcfa(l.price)}</h3>
          <div className="icons">
            <button className="round" onClick={share} aria-label="Partager">↗</button>
            {session && (
              <button className={fav ? 'round on' : 'round'} onClick={() => toggle(l.id, fav)} aria-label="Favori">
                <Icon n="heart" size={18} fill={fav} />
              </button>
            )}
          </div>
        </div>
        <h2>{l.title}</h2>
        <p className="note">{cat?.name} · {l.city}{l.status !== 'active' && ' · Indisponible'}</p>
        {l.description && <p>{l.description}</p>}
      </div>

      {attrs.length > 0 && (
        <div className="glass list">
          {attrs.map(([k, v]) => (
            <div key={k} className="row static"><span className="lbl">{k}</span><span className="val">{v}</span></div>
          ))}
        </div>
      )}

      {seller && (
        <Link to={`/vendeur/${seller.id}`} className="glass card seller">
          <Avatar p={seller} size={48} />
          <div>
            <b>{seller.full_name || seller.username || 'Membre'}</b>
            <p className="note">{seller.city || 'Voir le profil'}</p>
          </div>
        </Link>
      )}

      {!session && <Link className="btn" to="/login">Connecte-toi pour contacter le vendeur</Link>}
      {session && !mine && (
        <div className="actions">
          <Link className="btn alt" to={`/chat/${l.id}/${l.seller_id}`}>Discuter</Link>
          {!contactOnly && l.status === 'active' && <button className="btn" onClick={buy}>Acheter</button>}
        </div>
      )}
      {contactOnly && <p className="note center">Pour les terrains, contacte le vendeur et organise une visite avant tout paiement.</p>}
      {mine && <p className="note center">C’est ton annonce. Gère-la dans Profil › Mes annonces.</p>}
      {msg && <p className="note center">{msg}</p>}
    </>
  )
}
