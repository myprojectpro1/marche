import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { uploadImage } from '../api'
import { ATTRS } from '../utils'

export default function Publish({ session }) {
  const nav = useNavigate()
  const [cats, setCats] = useState([])
  const [catId, setCatId] = useState('')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [price, setPrice] = useState('')
  const [city, setCity] = useState('')
  const [attrs, setAttrs] = useState({})
  const [files, setFiles] = useState([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('categories').select('*').order('id').then(({ data }) => setCats(data || []))
  }, [])

  const cat = cats.find((c) => String(c.id) === String(catId))
  const fields = ATTRS[cat?.slug] || ATTRS.default

  async function submit() {
    setMsg('')
    if (!catId || title.trim().length < 3 || price === '') return setMsg('Catégorie, titre et prix sont obligatoires.')
    setBusy(true)
    try {
      const uid = session.user.id
      const urls = []
      for (const f of files.slice(0, 5)) urls.push(await uploadImage(uid, f))
      const { data, error } = await supabase
        .from('listings')
        .insert({
          seller_id: uid, category_id: Number(catId), title: title.trim(), description: desc.trim(),
          price: Number(price), city: city.trim(), photos: urls, attributes: attrs,
        })
        .select('id').single()
      if (error) throw error
      nav(`/annonce/${data.id}`)
    } catch (e) {
      setMsg(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="glass card">
      <label className="file">
        📷 Ajouter des photos (5 max)
        <input type="file" accept="image/*" multiple hidden onChange={(e) => setFiles(Array.from(e.target.files))} />
      </label>
      {files.length > 0 && (
        <div className="thumbs">
          {files.slice(0, 5).map((f, i) => <img key={i} src={URL.createObjectURL(f)} alt="" />)}
        </div>
      )}
      <select value={catId} onChange={(e) => { setCatId(e.target.value); setAttrs({}) }}>
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
      <button className="btn" disabled={busy} onClick={submit}>{busy ? 'Publication…' : 'Publier'}</button>
    </div>
  )
}
