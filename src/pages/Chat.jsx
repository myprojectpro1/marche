import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { Avatar, Icon } from '../ui'

export default function Chat({ session }) {
  const { listingId, otherId } = useParams()
  const me = session.user.id
  const [msgs, setMsgs] = useState([])
  const [other, setOther] = useState(null)
  const [listing, setListing] = useState(null)
  const [text, setText] = useState('')
  const end = useRef(null)

  async function load() {
    const { data } = await supabase.from('messages').select('*')
      .eq('listing_id', listingId)
      .or(`and(sender_id.eq.${me},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${me})`)
      .order('created_at')
    setMsgs(data || [])
  }

  useEffect(() => {
    supabase.from('profiles').select('id,full_name,username,avatar_url').eq('id', otherId).maybeSingle().then(({ data }) => setOther(data))
    supabase.from('listings').select('id,title').eq('id', listingId).maybeSingle().then(({ data }) => setListing(data))
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [listingId, otherId])

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs.length])

  async function send() {
    const body = text.trim()
    if (!body) return
    setText('')
    await supabase.from('messages').insert({ listing_id: listingId, sender_id: me, receiver_id: otherId, body })
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
      <div className="bubbles">
        {msgs.map((m) => (
          <div key={m.id} className={m.sender_id === me ? 'bubble me' : 'bubble'}>{m.body}</div>
        ))}
        <div ref={end} />
      </div>
      <div className="composer glass">
        <input placeholder="Message…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} />
        <button className="round on" onClick={send} aria-label="Envoyer"><Icon n="send" size={18} /></button>
      </div>
    </div>
  )
}
