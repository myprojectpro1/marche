import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase'
import { byIds } from '../api'
import { when } from '../utils'
import { Avatar, Empty } from '../ui'

export default function Inbox({ session }) {
  const me = session.user.id
  const [convs, setConvs] = useState(null)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('messages').select('*')
        .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
        .order('created_at', { ascending: false }).limit(300)
      const map = new Map()
      for (const m of data || []) {
        const other = m.sender_id === me ? m.receiver_id : m.sender_id
        const key = `${m.listing_id}:${other}`
        if (!map.has(key)) map.set(key, { ...m, other })
      }
      const list = [...map.values()]
      const [profiles, listings] = await Promise.all([
        byIds('profiles', list.map((c) => c.other), 'id,full_name,username,avatar_url'),
        byIds('listings', list.map((c) => c.listing_id), 'id,title'),
      ])
      setConvs(list.map((c) => ({ ...c, p: profiles[c.other], l: listings[c.listing_id] })))
    })()
  }, [me])

  if (!convs) return <Empty text="Chargement…" />
  if (!convs.length) return <Empty text="Aucun message pour le moment." />
  return (
    <div className="glass list">
      {convs.map((c) => (
        <Link key={`${c.listing_id}:${c.other}`} to={`/chat/${c.listing_id}/${c.other}`} className="row conv">
          <Avatar p={c.p} size={48} />
          <div className="grow">
            <b>{c.p?.full_name || c.p?.username || 'Membre'}</b>
            <small>{c.l?.title}</small>
            <span className="snip">{c.sender_id === me ? 'Toi : ' : ''}{c.body}</span>
          </div>
          <small>{when(c.created_at)}</small>
        </Link>
      ))}
    </div>
  )
}
