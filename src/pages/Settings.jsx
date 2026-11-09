import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { uploadImage } from '../api'
import { getTheme, setTheme, METHODS } from '../utils'
import { Avatar, Row, Empty } from '../ui'

const Switch = ({ on, onChange }) => (
  <button className={on ? 'switch on' : 'switch'} onClick={() => onChange(!on)} aria-pressed={on}><i /></button>
)

export default function Settings({ session }) {
  const { section } = useParams()
  const uid = session.user.id
  const [p, setP] = useState(null)
  const [v, setV] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [pw, setPw] = useState('')
  const [theme, setT] = useState(getTheme())

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', uid).maybeSingle().then(({ data }) => setP(data || {}))
    supabase.from('private_settings').select('*').eq('id', uid).maybeSingle().then(({ data }) => setV(data || {}))
  }, [uid])

  if (!p) return <Empty text="Chargement…" />

  const setPub = (k, val) => setP({ ...p, [k]: val })
  const setPriv = (k, val) => setV({ ...v, [k]: val })

  async function savePublic() {
    setBusy(true); setMsg('')
    const { error } = await supabase.from('profiles').update({
      full_name: p.full_name || '', username: p.username?.trim().toLowerCase() || null,
      bio: p.bio || '', city: p.city || '',
    }).eq('id', uid)
    setBusy(false)
    setMsg(error ? (error.code === '23505' ? 'Ce nom d’utilisateur est déjà pris.' : error.message) : 'Enregistré ✓')
  }

  async function savePrivate(patch = {}) {
    setBusy(true); setMsg('')
    const next = { ...v, ...patch }
    setV(next)
    const { error } = await supabase.from('private_settings').upsert({
      id: uid, phone: next.phone || null, payout_method: next.payout_method || null,
      payout_number: next.payout_number || null,
      notif_messages: next.notif_messages ?? true, notif_orders: next.notif_orders ?? true,
    })
    setBusy(false)
    setMsg(error ? error.message : 'Enregistré ✓')
  }

  async function changeAvatar(e) {
    const f = e.target.files[0]
    if (!f) return
    try {
      const url = await uploadImage(uid, f, 'avatar-')
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', uid)
      setPub('avatar_url', url)
    } catch (er) { setMsg(er.message) }
  }

  async function changePassword() {
    setMsg('')
    if (pw.length < 6) return setMsg('6 caractères minimum.')
    const { error } = await supabase.auth.updateUser({ password: pw })
    setMsg(error ? error.message : 'Mot de passe modifié ✓')
    if (!error) setPw('')
  }

  const Save = ({ onClick }) => (
    <>
      {msg && <p className={msg.endsWith('✓') ? 'note center' : 'err'}>{msg}</p>}
      <button className="btn" disabled={busy} onClick={onClick}>Enregistrer</button>
    </>
  )

  if (!section) {
    return (
      <>
        <h4 className="group">Compte</h4>
        <div className="glass list">
          <Row to="/parametres/profil" icon="👤" label="Profil" />
          <Row to="/parametres/paiement" icon="💳" label="Paiements reçus" value={METHODS[v.payout_method]} />
          <Row to="/parametres/notifications" icon="🔔" label="Notifications" />
          <Row to="/parametres/securite" icon="🔒" label="Sécurité" />
        </div>
        <h4 className="group">Site</h4>
        <div className="glass list">
          <Row to="/parametres/apparence" icon="🌗" label="Apparence" />
          <div className="row static"><span className="ico">🌍</span><span className="lbl">Langue</span><span className="val">Français</span></div>
          <div className="row static"><span className="ico">💰</span><span className="lbl">Devise</span><span className="val">FCFA</span></div>
          <Row to="/aide" icon="🛟" label="Aide et sécurité" />
        </div>
      </>
    )
  }

  if (section === 'profil') {
    return (
      <div className="glass card">
        <label className="avatar-edit">
          <Avatar p={p} size={92} />
          <small>Changer la photo</small>
          <input type="file" accept="image/*" hidden onChange={changeAvatar} />
        </label>
        <input placeholder="Nom complet" value={p.full_name || ''} onChange={(e) => setPub('full_name', e.target.value)} />
        <input placeholder="Nom d’utilisateur" value={p.username || ''} onChange={(e) => setPub('username', e.target.value)} />
        <input placeholder="Ville" value={p.city || ''} onChange={(e) => setPub('city', e.target.value)} />
        <textarea rows="3" placeholder="À propos de toi" value={p.bio || ''} onChange={(e) => setPub('bio', e.target.value)} />
        <input type="tel" placeholder="Téléphone (privé)" value={v.phone || ''} onChange={(e) => setPriv('phone', e.target.value)} />
        <Save onClick={async () => { await savePublic(); await savePrivate() }} />
      </div>
    )
  }

  if (section === 'paiement') {
    return (
      <div className="glass card">
        <p className="note">Choisis où recevoir l’argent de tes ventes, une fois que l’acheteur a confirmé la réception.</p>
        <select value={v.payout_method || ''} onChange={(e) => setPriv('payout_method', e.target.value)}>
          <option value="">Moyen de paiement…</option>
          {Object.entries(METHODS).map(([k, n]) => <option key={k} value={k}>{n}</option>)}
        </select>
        <input type="tel" placeholder="Numéro (ex. 70 00 00 00)" value={v.payout_number || ''} onChange={(e) => setPriv('payout_number', e.target.value)} />
        <Save onClick={() => savePrivate()} />
      </div>
    )
  }

  if (section === 'notifications') {
    return (
      <div className="glass list">
        <div className="row static"><span className="lbl">Nouveaux messages</span>
          <Switch on={v.notif_messages ?? true} onChange={(x) => savePrivate({ notif_messages: x })} /></div>
        <div className="row static"><span className="lbl">Commandes et paiements</span>
          <Switch on={v.notif_orders ?? true} onChange={(x) => savePrivate({ notif_orders: x })} /></div>
        {msg && <p className="note center">{msg}</p>}
      </div>
    )
  }

  if (section === 'securite') {
    return (
      <div className="glass card">
        <p className="note">Email : {session.user.email}</p>
        <input type="password" placeholder="Nouveau mot de passe" value={pw} onChange={(e) => setPw(e.target.value)} />
        <Save onClick={changePassword} />
      </div>
    )
  }

  if (section === 'apparence') {
    return (
      <div className="glass card">
        <p className="note">Thème de l’application</p>
        <div className="seg">
          {[['auto', 'Auto'], ['light', 'Clair'], ['dark', 'Sombre']].map(([k, n]) => (
            <button key={k} className={theme === k ? 'on' : ''} onClick={() => { setTheme(k); setT(k) }}>{n}</button>
          ))}
        </div>
      </div>
    )
  }

  return <Empty text="Page introuvable." />
}
