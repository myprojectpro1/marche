import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { fcfa, METHODS, cleanNum, ussdCode, ussdLink } from '../utils'
import { Empty, Skel } from '../ui'

export default function Pay({ session }) {
  const { id } = useParams()
  const me = session.user.id
  const [o, setO] = useState(null)
  const [listing, setListing] = useState(null)
  const [seller, setSeller] = useState(null)
  const [pay, setPay] = useState(null)
  const [info, setInfo] = useState(null)
  const [method, setMethod] = useState('')
  const [ref, setRef] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')

  async function load() {
    const { data: ord } = await supabase.from('orders').select('*').eq('id', id).maybeSingle()
    if (!ord) return setO(false)
    setO(ord)
    const [l, p, s] = await Promise.all([
      supabase.from('listings').select('id,title').eq('id', ord.listing_id).maybeSingle(),
      supabase.from('payments').select('*').eq('order_id', id).order('created_at', { ascending: false }).limit(1),
      supabase.from('profiles').select('full_name,username').eq('id', ord.seller_id).maybeSingle(),
    ])
    setListing(l.data)
    setPay(p.data?.[0] || null)
    setSeller(s.data)
    if (ord.status === 'pending' && ord.buyer_id === me) {
      const { data, error } = await supabase.rpc('get_pay_info', { p_order: id })
      if (!error) setInfo(data)
    }
  }
  useEffect(() => { load() }, [id])

  // attente de confirmation du vendeur : on rafraîchit régulièrement
  useEffect(() => {
    if (pay?.status !== 'pending') return
    const t = setInterval(load, 6000)
    return () => clearInterval(t)
  }, [pay?.status])

  async function copy(text, k) {
    try { await navigator.clipboard.writeText(text); setCopied(k); setTimeout(() => setCopied(''), 1500) }
    catch { setMsg('Copie impossible : note le numéro à la main.') }
  }

  async function declare() {
    setMsg('')
    setBusy(true)
    const { error } = await supabase.rpc('declare_payment', { p_order: id, p_method: method, p_ref: ref })
    setBusy(false)
    if (error) return setMsg(error.message)
    setRef('')
    load()
  }

  if (o === null) return <div className="glass card"><Skel w="50%" h={28} /><div style={{ height: 12 }} /><Skel h={46} r={14} /></div>
  if (o === false) return <Empty text="Commande introuvable." />

  const sellerName = seller?.full_name || seller?.username || 'le vendeur'

  if (o.status !== 'pending') {
    return (
      <div className="glass card hero">
        <h2>{o.status === 'cancelled' ? 'Commande annulée' : 'Paiement confirmé ✓'}</h2>
        <p className="note">{listing?.title} · {fcfa(o.amount)}</p>
        <Link className="btn" to="/commandes">Voir mes commandes</Link>
      </div>
    )
  }

  if (pay?.status === 'pending') {
    return (
      <div className="glass card hero">
        <h2>Paiement déclaré ⏳</h2>
        <p className="note">En attente de la confirmation de {sellerName}.</p>
        <p className="note">{METHODS[pay.method]} · Réf. {pay.provider_ref}</p>
        <Link className="btn alt" to={`/chat/${o.listing_id}/${o.seller_id}`}>Écrire au vendeur</Link>
      </div>
    )
  }

  const avail = info ? Object.keys(METHODS).filter((k) => info[k]) : []
  const num = method && info ? cleanNum(info[method]) : ''
  const code = ussdCode(method, num)

  return (
    <>
      <div className="glass card hero">
        <p className="note">Tu paies à {sellerName}</p>
        <h2>{fcfa(o.amount)}</h2>
        <p className="note">{listing?.title}</p>
      </div>

      {pay?.status === 'failed' && (
        <p className="err center">Le vendeur n’a pas retrouvé ton dernier paiement. Vérifie la référence ou contacte-le.</p>
      )}

      {!info ? <Skel h={60} r={18} /> : avail.length === 0 ? (
        <div className="glass card">
          <p>Le vendeur n’a pas encore renseigné de numéro de paiement.</p>
          <Link className="btn alt" to={`/chat/${o.listing_id}/${o.seller_id}`}>Le contacter</Link>
        </div>
      ) : (
        <div className="glass card">
          <b>1. Choisis ton moyen de paiement</b>
          <div className="methods">
            {avail.map((k) => (
              <button key={k} className={method === k ? 'on' : ''} onClick={() => setMethod(k)}>{METHODS[k]}</button>
            ))}
          </div>

          {method && method !== 'wave' && (
            <>
              <b className="step">2. Lance le paiement</b>
              <a className="btn" href={ussdLink(method, num)}>📞 Payer avec {METHODS[method]}</a>
              <code className="pay-code">{code}</code>
              <button className="link" onClick={() => copy(code, 'code')}>{copied === 'code' ? 'Copié ✓' : 'Copier le code (si l’appel ne s’ouvre pas)'}</button>
              <p className="note">Le code s’ouvre dans ton téléphone. Suis les étapes : saisis le montant de {fcfa(o.amount)} puis ton code secret.</p>
            </>
          )}

          {method === 'wave' && (
            <>
              <b className="step">2. Envoie avec Wave</b>
              <code className="pay-code">{num}</code>
              <button className="link" onClick={() => copy(num, 'num')}>{copied === 'num' ? 'Copié ✓' : 'Copier le numéro'}</button>
              <p className="note">Ouvre l’application Wave et envoie {fcfa(o.amount)} à ce numéro.</p>
            </>
          )}

          {method && (
            <>
              <b className="step">3. Confirme ton paiement</b>
              <input placeholder="Référence de transaction (SMS reçu)" value={ref} onChange={(e) => setRef(e.target.value)} />
              {msg && <p className="err">{msg}</p>}
              <button className="btn" disabled={busy || ref.trim().length < 6} onClick={declare}>
                {busy ? '…' : 'J’ai payé'}
              </button>
            </>
          )}
        </div>
      )}

      <p className="note center">
        Ce paiement est un transfert direct au vendeur, sans séquestre. Vérifie son nom avant de payer et garde le SMS de confirmation.
      </p>
    </>
  )
}
