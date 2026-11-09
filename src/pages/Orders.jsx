import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { byIds } from '../api'
import { fcfa, when, STATUS } from '../utils'
import { Empty } from '../ui'

export default function Orders({ session }) {
  const me = session.user.id
  const [tab, setTab] = useState('buy')
  const [rows, setRows] = useState(null)
  const [msg, setMsg] = useState('')

  async function load() {
    setRows(null)
    const col = tab === 'buy' ? 'buyer_id' : 'seller_id'
    const { data } = await supabase.from('orders').select('*').eq(col, me).order('created_at', { ascending: false })
    const list = data || []
    const [ls, ps] = await Promise.all([
      byIds('listings', list.map((o) => o.listing_id), 'id,title,photos'),
      byIds('profiles', list.map((o) => (tab === 'buy' ? o.seller_id : o.buyer_id)), 'id,full_name,username'),
    ])
    setRows(list.map((o) => ({ ...o, l: ls[o.listing_id], p: ps[tab === 'buy' ? o.seller_id : o.buyer_id] })))
  }
  useEffect(() => { load() }, [tab])

  async function act(fn, id) {
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
      {!rows ? <Empty text="Chargement…" /> : !rows.length ? <Empty text="Aucune commande." /> : rows.map((o) => (
        <div key={o.id} className="glass card item">
          <div className="itemhead">
            <div className="thumb" style={{ backgroundImage: o.l?.photos?.[0] ? `url(${o.l.photos[0]})` : 'none' }} />
            <div>
              <b>{o.l?.title || 'Article'}</b>
              <p className="note">{fcfa(o.amount)} · {tab === 'buy' ? 'Vendeur' : 'Acheteur'} : {o.p?.full_name || o.p?.username || 'Membre'}</p>
              <p className="note">{when(o.created_at)}</p>
            </div>
          </div>
          <span className={`pill ${o.status}`}>{STATUS[o.status]}</span>
          {o.status === 'pending' && tab === 'buy' && (
            <p className="note">Le paiement Orange Money, Moov et Wave sera disponible très bientôt.</p>
          )}
          {tab === 'sell' && o.status === 'paid' && (
            <button className="btn small" onClick={() => act('mark_shipped', o.id)}>Marquer comme expédié</button>
          )}
          {tab === 'buy' && (o.status === 'paid' || o.status === 'shipped') && (
            <button className="btn small" onClick={() => act('confirm_receipt', o.id)}>Confirmer la réception</button>
          )}
        </div>
      ))}
    </>
  )
}
