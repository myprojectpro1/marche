import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { err: null }
  static getDerivedStateFromError(err) { return { err } }
  render() {
    if (!this.state.err) return this.props.children
    return (
      <div className="glass card hero">
        <h2>Oups, un problème est survenu</h2>
        <p className="note">Vérifie ta connexion puis recharge la page.</p>
        <button className="btn" onClick={() => window.location.reload()}>Recharger</button>
      </div>
    )
  }
}
