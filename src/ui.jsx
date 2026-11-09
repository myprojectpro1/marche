import { Link } from 'react-router-dom'
import { fcfa } from './utils'

const P = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  heart: 'M12 21s-7-4.5-9.5-9A5.5 5.5 0 0 1 12 6a5.5 5.5 0 0 1 9.5 6c-2.5 4.5-9.5 9-9.5 9z',
  plus: 'M12 5v14M5 12h14',
  chat: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-5.4A8 8 0 1 1 21 12z',
  user: 'M20 21a8 8 0 0 0-16 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  chev: 'M9 6l6 6-6 6',
  back: 'M15 6l-6 6 6 6',
  send: 'M5 12l14-7-5 14-2-6z',
}

export function Icon({ n, size = 22, fill }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'}
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={P[n]} />
    </svg>
  )
}

export function Avatar({ p, size = 56 }) {
  const s = { width: size, height: size, fontSize: size / 2.4 }
  if (p?.avatar_url) return <img className="avatar" style={s} src={p.avatar_url} alt="" />
  return <div className="avatar" style={s}>{(p?.full_name || p?.username || '?')[0].toUpperCase()}</div>
}

export function Tile({ l, fav, onFav }) {
  return (
    <div className="tile glass">
      <Link to={`/annonce/${l.id}`}>
        <div className="img" style={{ backgroundImage: l.photos?.[0] ? `url(${l.photos[0]})` : 'none' }} />
        <div className="meta">
          <b>{fcfa(l.price)}</b>
          <span>{l.title}</span>
          <small>{l.city}</small>
        </div>
      </Link>
      {onFav && (
        <button className={fav ? 'heart on' : 'heart'} onClick={() => onFav(l.id, fav)} aria-label="Favori">
          <Icon n="heart" size={18} fill={fav} />
        </button>
      )}
    </div>
  )
}

export function Row({ to, onClick, icon, label, value, danger }) {
  const inner = (
    <>
      <span className="ico">{icon}</span>
      <span className="lbl">{label}</span>
      {value && <span className="val">{value}</span>}
      {(to || onClick) && <Icon n="chev" size={18} />}
    </>
  )
  const cls = danger ? 'row danger' : 'row'
  if (to) return <Link to={to} className={cls}>{inner}</Link>
  return <button className={cls} onClick={onClick}>{inner}</button>
}

export function Empty({ text }) {
  return <p className="center">{text}</p>
}
