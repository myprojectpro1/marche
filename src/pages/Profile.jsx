import { useEffect, useState } from 'react'
import { supabase } from '../supabase'
import { Avatar, Row } from '../ui'

export default function Profile({ session }) {
  const [p, setP] = useState(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    const uid = session.user.id
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then(({ data }) => setP(data))
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('seller_id', uid)
      .then(({ count: c }) => setCount(c || 0))
  }, [session])

  return (
    <>
      <div className="glass card hero">
        <Avatar p={p} size={84} />
        <h2>{p?.full_name || 'Mon profil'}</h2>
        {p?.username && <p className="note">@{p.username}</p>}
        <p className="note">{[p?.city, `${count} annonce${count > 1 ? 's' : ''}`].filter(Boolean).join(' · ')}</p>
        {p?.bio && <p>{p.bio}</p>}
      </div>

      <h4 className="group">Mon activité</h4>
      <div className="glass list">
        <Row to="/mes-annonces" icon="🏷️" label="Mes annonces" />
        <Row to="/commandes" icon="🛍️" label="Mes achats et ventes" />
        <Row to="/favoris" icon="❤️" label="Mes favoris" />
        <Row to="/messages" icon="💬" label="Messages" />
      </div>

      <h4 className="group">Compte</h4>
      <div className="glass list">
        <Row to="/parametres/profil" icon="👤" label="Modifier le profil" />
        <Row to="/parametres/paiement" icon="💳" label="Paiements reçus" />
        <Row to="/parametres" icon="⚙️" label="Paramètres du compte" />
      </div>

      <h4 className="group">Site</h4>
      <div className="glass list">
        <Row to="/parametres/apparence" icon="🌗" label="Apparence" />
        <Row to="/aide" icon="🛟" label="Aide et sécurité" />
      </div>

      <div className="glass list">
        <Row onClick={() => supabase.auth.signOut()} icon="🚪" label="Se déconnecter" danger />
      </div>
    </>
  )
}
