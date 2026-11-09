export const fcfa = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA'

export const when = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const STATUS = {
  pending: 'En attente de paiement',
  paid: 'Payé · fonds sécurisés',
  shipped: 'Expédié',
  delivered: 'Reçu par l’acheteur',
  released: 'Terminé',
  cancelled: 'Annulé',
  refunded: 'Remboursé',
}

export const METHODS = { orange_money: 'Orange Money', moov: 'Moov Money', wave: 'Wave' }

// Champs propres à chaque catégorie (stockés dans listings.attributes)
export const ATTRS = {
  vetements: [
    { key: 'taille', label: 'Taille' },
    { key: 'marque', label: 'Marque' },
    { key: 'etat', label: 'État', options: ['Neuf', 'Très bon', 'Bon', 'Usé'] },
  ],
  telephones: [
    { key: 'marque', label: 'Marque' },
    { key: 'modele', label: 'Modèle' },
    { key: 'stockage', label: 'Stockage (Go)' },
    { key: 'etat', label: 'État', options: ['Neuf', 'Très bon', 'Bon', 'Pour pièces'] },
  ],
  terrains: [
    { key: 'surface', label: 'Surface (m²)' },
    { key: 'quartier', label: 'Quartier / zone' },
    { key: 'document', label: 'Document', options: ['Titre foncier', 'Permis urbain d’habiter', 'Attestation', 'Autre'] },
  ],
  default: [{ key: 'etat', label: 'État', options: ['Neuf', 'Très bon', 'Bon', 'Usé'] }],
}

// Thème : auto / light / dark
export function applyTheme(t) {
  document.documentElement.dataset.theme = t
}
export function getTheme() {
  try { return localStorage.getItem('theme') || 'auto' } catch { return 'auto' }
}
export function setTheme(t) {
  try { localStorage.setItem('theme', t) } catch { /* ignore */ }
  applyTheme(t)
}
