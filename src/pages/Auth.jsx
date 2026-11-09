import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

const fr = (m = '') => {
  if (m.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.'
  if (m.includes('Email not confirmed')) return 'Email non confirmé. Ouvre le lien reçu par email.'
  if (m.includes('already registered')) return 'Cet email a déjà un compte. Connecte-toi.'
  if (m.includes('rate limit')) return 'Trop de tentatives. Réessaie dans quelques minutes.'
  if (m.includes('at least 6')) return 'Le mot de passe doit avoir 6 caractères minimum.'
  return m
}

export default function Auth() {
  const nav = useNavigate()
  const [signup, setSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [unconfirmed, setUnconfirmed] = useState(false)
  const [busy, setBusy] = useState(false)

  // l'email de confirmation ramène sur le site actuel (pas sur localhost)
  const back = window.location.origin + window.location.pathname

  async function submit() {
    setBusy(true)
    setMsg('')
    setUnconfirmed(false)
    const res = signup
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name }, emailRedirectTo: back } })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (res.error) {
      setUnconfirmed(res.error.message.includes('Email not confirmed'))
      return setMsg(fr(res.error.message))
    }
    if (signup && !res.data.session) return setMsg('Compte créé. Ouvre le lien reçu par email, puis reviens te connecter.')
    nav('/')
  }

  async function resend() {
    const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: back } })
    setMsg(error ? fr(error.message) : 'Email de confirmation renvoyé.')
  }

  return (
    <div className="glass card">
      <h2>{signup ? 'Créer un compte' : 'Bon retour 👋'}</h2>
      <p className="note">Achète et vends vêtements, téléphones, terrains et plus encore.</p>
      {signup && <input placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} />}
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Mot de passe (6 caractères min.)" value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <p className={msg.startsWith('Compte créé') || msg.startsWith('Email de confirmation') ? 'note' : 'err'}>{msg}</p>}
      <button className="btn" disabled={busy} onClick={submit}>
        {busy ? '…' : signup ? 'S’inscrire' : 'Se connecter'}
      </button>
      {unconfirmed && <button className="link" onClick={resend}>Renvoyer l’email de confirmation</button>}
      <button className="link" onClick={() => { setSignup(!signup); setMsg('') }}>
        {signup ? 'J’ai déjà un compte' : 'Pas de compte ? Créer un compte'}
      </button>
    </div>
  )
}
