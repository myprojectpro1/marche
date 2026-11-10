import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { Avatar, Icon } from '../ui'

const hm = (d) => new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

export default function Chat({ session }) {
  const { listingId, otherId } = useParams()
  const me = session.user.id
  const [msgs, setMsgs] = useState([])
  const [other, setOther] = useState(null)
  const [listing, setListing] = useState(null)
  const [text, setText] = useState('')
  const [err, setErr] = useState('')
  const box = useRef(null)

  async function load() {
    const { data } = await supabase.from('messages').select('*')
      .eq('listing_id', listingId)
      .or(`and(sender_id.eq.${me},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${me})`)
      .order('created_at')
    const list = data || []
    setMsgs(list)
    if (list.some((m) => m.receiver_id === me && !m.read_at)) {
      supabase.rpc('mark_read', { p_listing: listingId, p_other: otherId })
    }
  }

  useEffect(() => {
    supabase.from('profiles').select('id,full_name,username,avatar_url').eq('id', otherId).maybeSingle().then(({ data }) => setOther(data))
    supabase.from('listings').select('id,title').eq('id', listingId).maybeSingle().then(({ data }) => setListing(data))
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [listingId, otherId])

  // on fait défiler seulement la zone des messages, pas toute la page
  useEffect(() => {
    const b = box.current
    if (b) b.scrollTo({ top: b.scrollHeight, behavior: 'smooth' })
  }, [msgs.length])

  async function send() {
    const body = text.trim()
    if (!body) return
    setErr('')
    setText('')
    const { error } = await supabase.from('messages').insert({ listing_id: listingId, sender_id: me, receiver_id: otherId, body })
    if (error) { setErr('Message non envoyé : ' + error.message); setText(body) }
    load()
  }

  return (
    <div className="chat">
      <div className="chat-head glass">
        <Avatar p={other} size={36} />
        <div>
          <b>{other?.full_name || other?.username || 'Membre'}</b>
          <Link to={`/annonce/${listingId}`}><small>{listing?.title}</small></Link>
        </div>
      </div>
      <div className="bubbles" ref={box}>
        {msgs.map((m) => (
          <div key={m.id} className={m.sender_id === me ? 'bubble me' : 'bubble'}>
            {m.body}
            <span className="ts">{hm(m.created_at)}{m.sender_id === me && m.read_at ? ' · Lu' : ''}</span>
          </div>
        ))}
      </div>
      {err && <p className="err center">{err}</p>}
      <div className="composer glass">
        <input placeholder="Message…" value={text} maxLength={2000} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button className="round on" onClick={send} aria-label="Envoyer"><Icon n="send" size={18} /></button>
      </div>
    </div>
  )
}
