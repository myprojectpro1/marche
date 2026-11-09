import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from './supabase'
import { Icon, GridSkeleton } from './ui'
import ErrorBoundary from './ErrorBoundary'
import Home from './pages/Home'
import Auth from './pages/Auth'

const Listing = lazy(() => import('./pages/Listing'))
const Publish = lazy(() => import('./pages/Publish'))
const Favorites = lazy(() => import('./pages/Favorites'))
const Inbox = lazy(() => import('./pages/Inbox'))
const Chat = lazy(() => import('./pages/Chat'))
const Profile = lazy(() => import('./pages/Profile'))
const MyListings = lazy(() => import('./pages/MyListings'))
const Orders = lazy(() => import('./pages/Orders'))
const Pay = lazy(() => import('./pages/Pay'))
const Settings = lazy(() => import('./pages/Settings'))
const Seller = lazy(() => import('./pages/Seller'))
const Help = lazy(() => import('./pages/Help'))

const TITLES = {
  login: 'Connexion', vendre: 'Vendre', annonce: 'Annonce', favoris: 'Favoris', messages: 'Messages',
  chat: 'Discussion', profil: 'Profil', 'mes-annonces': 'Mes annonces', commandes: 'Mes commandes',
  paiement: 'Paiement', parametres: 'Paramètres', aide: 'Aide et sécurité', vendeur: 'Vendeur',
}

function Gate({ session, children }) {
  return session ? children : <Navigate to="/login" replace />
}

export default function App() {
  const [session, setSession] = useState(null)
  const [ready, setReady] = useState(false)
  const [online, setOnline] = useState(navigator.onLine)
  const { pathname } = useLocation()
  const nav = useNavigate()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      sub.subscription.unsubscribe()
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  if (!ready) return <main><GridSkeleton /></main>

  const seg = pathname.split('/')[1] || ''
  const inChat = seg === 'chat'
  const tab = (to, icon, label) => (
    <Link to={to} className={(to === '/' ? pathname === '/' : pathname.startsWith(to)) ? 'tab on' : 'tab'}>
      <Icon n={icon} /><small>{label}</small>
    </Link>
  )
  const gate = (el) => <Gate session={session}>{el}</Gate>

  return (
    <>
      {!online && <div className="offline">Pas de connexion internet</div>}
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
        <div key={pathname} className="page">
          <ErrorBoundary>
            <Suspense fallback={<GridSkeleton />}>
              <Routes>
                <Route path="/" element={<Home session={session} />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/annonce/:id" element={<Listing session={session} />} />
                <Route path="/vendeur/:id" element={<Seller session={session} />} />
                <Route path="/aide" element={<Help />} />
                <Route path="/vendre/:id?" element={gate(<Publish session={session} />)} />
                <Route path="/favoris" element={gate(<Favorites session={session} />)} />
                <Route path="/messages" element={gate(<Inbox session={session} />)} />
                <Route path="/chat/:listingId/:otherId" element={gate(<Chat session={session} />)} />
                <Route path="/profil" element={gate(<Profile session={session} />)} />
                <Route path="/mes-annonces" element={gate(<MyListings session={session} />)} />
                <Route path="/commandes" element={gate(<Orders session={session} />)} />
                <Route path="/paiement/:id" element={gate(<Pay session={session} />)} />
                <Route path="/parametres/:section?" element={gate(<Settings session={session} />)} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </div>
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
