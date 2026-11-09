import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'

export default function Auth() {
  const nav = useNavigate()
  const [signup, setSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setMsg('')
    const res = signup
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
      : await supabase.auth.signInWithPassword({ email, password })
    setBusy(false)
    if (res.error) return setMsg(res.error.message)
    if (signup && !res.data.session) return setMsg('Compte créé. Vérifie ton email pour confirmer.')
    nav('/')
  }

  return (
    <div className="glass card">
      <h2>{signup ? 'Créer un compte' : 'Bon retour 👋'}</h2>
      <p className="note">Achète et vends vêtements, téléphones, terrains et plus encore.</p>
      {signup && <input placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} />}
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input type="password" placeholder="Mot de passe (6 caractères min.)" value={password} onChange={(e) => setPassword(e.target.value)} />
      {msg && <p className="err">{msg}</p>}
      <button className="btn" disabled={busy} onClick={submit}>
        {busy ? '…' : signup ? 'S’inscrire' : 'Se connecter'}
      </button>
      <button className="link" onClick={() => setSignup(!signup)}>
        {signup ? 'J’ai déjà un compte' : 'Pas de compte ? Créer un compte'}
      </button>
    </div>
  )
}
