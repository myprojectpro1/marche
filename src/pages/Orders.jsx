import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { byIds } from '../api'
import { fcfa, when, STATUS, METHODS } from '../utils'
import { Empty, GridSkeleton } from '../ui'

export default function Orders({ session }) {
  const me = session.user.id
  const [tab, setTab] = useState('buy')
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState('')

  async function load() {
    const col = tab === 'buy' ? 'buyer_id' : 'seller_id'
    const { data } = await supabase.from('orders').select('*').eq(col, me).order('created_at', { ascending: false })
    const list = data || []
    const [ls, ps, pays] = await Promise.all([
      byIds('listings', list.map((o) => o.listing_id), 'id,title,photos'),
      byIds('profiles', list.map((o) => (tab === 'buy' ? o.seller_id : o.buyer_id)), 'id,full_name,username'),
      list.length ? supabase.from('payments').select('*').in('order_id', list.map((o) => o.id)).order('created_at', { ascending: false }) : { data: [] },
    ])
    const lastPay = {}
    for (const p of pays.data || []) if (!lastPay[p.order_id]) lastPay[p.order_id] = p
    setRows(list.map((o) => ({ ...o, l: ls[o.listing_id], p: ps[tab === 'buy' ? o.seller_id : o.buyer_id], pay: lastPay[o.id] })))
  }
  useEffect(() => { setRows(null); load() }, [tab])

  async function act(fn, id, ask) {
    if (ask && !window.confirm(ask)) return
    const { error } = await supabase.rpc(fn, { p_order: id })
    setMsg(error ? error.message : '')
    load()
  }

  return (
    <>
      <div className="seg glass">
        <button className={tab === 'buy' ? 'on' : ''} onClick={() => setTab('buy')}>Mes achats</button>
        <button className={tab === 'sell' ? 'on' : ''} onClick={() => setTab('sell')}>Mes ventes</button>
      </div>
      {msg && <p className="err center">{msg}</p>}
      {!rows ? <GridSkeleton /> : !rows.length ? <Empty text="Aucune commande." /> : rows.map((o) => {
        const waiting = o.pay?.status === 'pending'
        return (
          <div key={o.id} className="glass card item">
            <Link to={`/annonce/${o.listing_id}`} className="itemhead">
              <div className="thumb" style={{ backgroundImage: o.l?.photos?.[0] ? `url(${o.l.photos[0]})` : 'none' }} />
              <div>
                <b>{o.l?.title || 'Article'}</b>
                <p className="note">{fcfa(o.amount)} · {tab === 'buy' ? 'Vendeur' : 'Acheteur'} : {o.p?.full_name || o.p?.username || 'Membre'}</p>
                <p className="note">{when(o.created_at)}</p>
              </div>
            </Link>
            <span className={`pill ${o.status}`}>{STATUS[o.status]}</span>

            {tab === 'buy' && o.status === 'pending' && (
              waiting ? (
                <p className="note">Paiement déclaré (réf. {o.pay.provider_ref}). En attente de confirmation du vendeur.</p>
              ) : (
                <>
                  {o.pay?.status === 'failed' && <p className="err">Le vendeur n’a pas retrouvé ton paiement. Vérifie la référence.</p>}
                  <Link className="btn small" to={`/paiement/${o.id}`}>Payer</Link>
                  <button className="btn small alt" onClick={() => act('cancel_order', o.id, 'Annuler cette commande ?')}>Annuler</button>
                </>
              )
            )}
            {tab === 'buy' && (o.status === 'paid' || o.status === 'shipped') && (
              <button className="btn small" onClick={() => act('confirm_receipt', o.id, 'Confirmer que tu as bien reçu l’article ?')}>Confirmer la réception</button>
            )}

            {tab === 'sell' && o.status === 'pending' && (
              waiting ? (
                <>
                  <p className="note">Paiement déclaré : {METHODS[o.pay.method]} · réf. {o.pay.provider_ref}</p>
                  <p className="note">Vérifie le SMS de ton opérateur avant de confirmer.</p>
                  <button className="btn small" onClick={() => act('confirm_payment', o.id, `As-tu bien reçu ${fcfa(o.amount)} sur ton compte ${METHODS[o.pay.method]} ?`)}>Paiement reçu ✓</button>
                  <button className="btn small danger" onClick={() => act('reject_payment', o.id, 'Refuser ce paiement (non reçu) ?')}>Pas reçu</button>
                </>
              ) : <p className="note">En attente du paiement de l’acheteur.</p>
            )}
            {tab === 'sell' && o.status === 'paid' && (
              <button className="btn small" onClick={() => act('mark_shipped', o.id)}>Marquer comme expédié</button>
            )}
          </div>
        )
      })}
    </>
  )
}
