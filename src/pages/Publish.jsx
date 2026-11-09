import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabase'
import { uploadImage, useCategories } from '../api'
import { ATTRS } from '../utils'
import { Skel } from '../ui'

export default function Publish({ session }) {
  const { id } = useParams() // présent = modification
  const nav = useNavigate()
  const cats = useCategories()
  const [ready, setReady] = useState(!id)
  const [catId, setCatId] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [attrs, setAttrs] = useState({})
  const [existing, setExisting] = useState([])
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  useEffect(() => {
    if (!id) return
    supabase.from('listings').select('*').eq('id', id).maybeSingle().then(({ data }) => {
      if (!data || data.seller_id !== session.user.id) return setMsg('Annonce introuvable.')
      setCatId(String(data.category_id))
      setTitle(data.title)
      setDesc(data.description || '')
      setPrice(String(data.price))
      setCity(data.city || '')
      setAttrs(data.attributes || {})
      setExisting(data.photos || [])
      setReady(true)
    })
  }, [id])

  const cat = cats.find((c) => String(c.id) === String(catId))
  const fields = ATTRS[cat?.slug] || ATTRS.default
  const room = Math.max(0, 5 - existing.length)

  async function submit() {
    setMsg('')
    if (!catId || title.trim().length < 3 || price === '') return setMsg('Catégorie, titre et prix sont obligatoires.')
    setBusy(true)
    try {
      const uid = session.user.id
      const urls = [...existing]
      for (const f of files.slice(0, room)) urls.push(await uploadImage(uid, f))
      const row = {
        title: title.trim(), description: desc.trim(), price: Number(price),
        city: city.trim(), photos: urls, attributes: attrs,
      }
      if (id) {
        const { error } = await supabase.from('listings').update(row).eq('id', id)
        if (error) throw error
        nav(`/annonce/${id}`, { replace: true })
      } else {
        const { data, error } = await supabase.from('listings')
          .insert({ ...row, seller_id: uid, category_id: Number(catId) }).select('id').single()
        if (error) throw error
        nav(`/annonce/${data.id}`, { replace: true })
      }
    } catch (e) {
      setMsg(e.message)
      setBusy(false)
    }
  }

  if (!ready) return msg ? <p className="center">{msg}</p> : <div className="glass card"><Skel h={46} r={14} /><div style={{ height: 10 }} /><Skel h={46} r={14} /></div>

  return (
    <div className="glass card">
      <h2>{id ? 'Modifier l’annonce' : 'Nouvelle annonce'}</h2>
      {(existing.length > 0 || files.length > 0) && (
        <div className="thumbs">
          {existing.map((u) => (
            <div key={u} className="wrap">
              <img src={u} alt="" />
              <button className="x" aria-label="Retirer" onClick={() => setExisting(existing.filter((x) => x !== u))}>✕</button>
            </div>
          ))}
          {previews.slice(0, room).map((u) => <div key={u} className="wrap"><img src={u} alt="" /></div>)}
        </div>
      )}
      {room > 0 && (
        <label className="file">
          📷 Ajouter des photos ({room} possible{room > 1 ? 's' : ''})
          <input type="file" accept="image/*" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files).slice(0, room))} />
        </label>
      )}
      <select value={catId} disabled={!!id} onChange={(e) => { setCatId(e.target.value); setAttrs({}) }}>
        <option value="">Catégorie…</option>
        {cats.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
      </select>
      {cat?.payment_mode === 'contact' && (
        <p className="note">Pour cette catégorie, l’acheteur te contacte directement : pas de paiement intégral en ligne.</p>
      )}
      <input placeholder="Titre" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea rows="4" placeholder="Description" value={desc} onChange={(e) => setDesc(e.target.value)} />
      <input type="number" inputMode="numeric" placeholder="Prix en FCFA" value={price} onChange={(e) => setPrice(e.target.value)} />
      <input placeholder="Ville" value={city} onChange={(e) => setCity(e.target.value)} />
      {catId && fields.map((f) =>
        f.options ? (
          <select key={f.key} value={attrs[f.key] || ''} onChange={(e) => setAttrs({ ...attrs, [f.key]: e.target.value })}>
            <option value="">{f.label}…</option>
            {f.options.map((o) => <option key={o}>{o}</option>)}
          </select>
        ) : (
          <input key={f.key} placeholder={f.label} value={attrs[f.key] || ''} onChange={(e) => setAttrs({ ...attrs, [f.key]: e.target.value })} />
        )
      )}
      {msg && <p className="err">{msg}</p>}
      <button className="btn" disabled={busy} onClick={submit}>{busy ? 'Enregistrement…' : id ? 'Enregistrer' : 'Publier'}</button>
    </div>
  )
}
