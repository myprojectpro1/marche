export const fcfa = (n) => Number(n).toLocaleString('fr-FR') + ' FCFA'

export const when = (d) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export const STATUS = {
  pending: 'En attente de paiement',
  paid: 'Paiement confirmé',
  shipped: 'Expédié',
  delivered: 'Reçu par l’acheteur',
  released: 'Terminé',
  cancelled: 'Annulé',
  refunded: 'Remboursé',
}

export const METHODS = { orange_money: 'Orange Money', moov: 'Moov Money', wave: 'Wave' }

// Numéro burkinabè : 8 chiffres (on retire espaces, +226, 00226)
export function cleanNum(s) {
  let d = String(s || '').replace(/\D/g, '')
  if (d.startsWith('00226')) d = d.slice(5)
  else if (d.startsWith('226') && d.length > 8) d = d.slice(3)
  return d
}

// Codes USSD de transfert vers le numéro du vendeur
export function ussdCode(method, num) {
  if (method === 'orange_money') return `*144*2*1*${num}#`
  if (method === 'moov') return `*555*2*1*${num}#`
  return null
}
export function ussdLink(method, num) {
  const c = ussdCode(method, num)
  return c ? 'tel:' + c.replace(/#/g, '%23') : null
}

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
