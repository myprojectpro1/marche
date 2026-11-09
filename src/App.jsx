import { useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { Icon, Empty } from './ui'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Publish from './pages/Publish'
import Listing from './pages/Listing'
import Favorites from './pages/Favorites'
import Inbox from './pages/Inbox'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import MyListings from './pages/MyListings'
import Orders from './pages/Orders'
import Settings from './pages/Settings'
import Seller from './pages/Seller'
import Help from './pages/Help'

const TITLES = {
  login: 'Connexion', vendre: 'Vendre', annonce: 'Annonce', favoris: 'Favoris', messages: 'Messages',
  chat: 'Discussion', profil: 'Profil', 'mes-annonces': 'Mes annonces', commandes: 'Mes commandes',
  parametres: 'Paramètres', aide: 'Aide et sécurité', vendeur: 'Vendeur',
}

function Gate({ session, children }) {
  return session ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const { pathname } = useLocation()
  const nav = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  if (!ready) return <Empty text="Chargement…" />

  const seg = pathname.split('/')[1] || ''
  const inChat = seg === 'chat'
  const tab = (to, icon, label) => (
    <Link to={to} className={(to === '/' ? pathname === '/' : pathname.startsWith(to)) ? 'tab on' : 'tab'}>
      <Icon n={icon} /><small>{label}</small>
    </Link>
  )

  return (
    <>
      <header className="top glass">
        {seg === '' ? (
          <>
            <Link to="/" className="logo">Marché</Link>
            {!session && <Link to="/login" className="btn small">Connexion</Link>}
          </>
        ) : (
          <>
            <button className="back" onClick={() => nav(-1)} aria-label="Retour"><Icon n="back" /></button>
            <h1>{TITLES[seg] || 'Marché'}</h1>
            <span className="spacer" />
          </>
        )}
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home session={session} />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/annonce/:id" element={<Listing session={session} />} />
          <Route path="/vendeur/:id" element={<Seller session={session} />} />
          <Route path="/aide" element={<Help />} />
          <Route path="/vendre" element={<Gate session={session}><Publish session={session} /></Gate>} />
          <Route path="/favoris" element={<Gate session={session}><Favorites session={session} /></Gate>} />
          <Route path="/messages" element={<Gate session={session}><Inbox session={session} /></Gate>} />
          <Route path="/chat/:listingId/:otherId" element={<Gate session={session}><Chat session={session} /></Gate>} />
          <Route path="/profil" element={<Gate session={session}><Profile session={session} /></Gate>} />
          <Route path="/mes-annonces" element={<Gate session={session}><MyListings session={session} /></Gate>} />
          <Route path="/commandes" element={<Gate session={session}><Orders session={session} /></Gate>} />
          <Route path="/parametres/:section?" element={<Gate session={session}><Settings session={session} /></Gate>} />
        </Routes>
      </main>

      {!inChat && (
        <nav className="tabbar glass">
          {tab('/', 'home', 'Accueil')}
          {tab('/favoris', 'heart', 'Favoris')}
          <Link to="/vendre" className="tab sell"><Icon n="plus" size={26} /></Link>
          {tab('/messages', 'chat', 'Messages')}
          {tab(session ? '/profil' : '/login', 'user', 'Profil')}
        </nav>
      )}
    </>
  )
}
