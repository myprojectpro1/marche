const FAQ = [
  ['Comment acheter en sécurité ?', 'Le paiement est conservé en séquestre : le vendeur reçoit l’argent seulement après ta confirmation de réception.'],
  ['Comment payer ?', 'Orange Money, Moov Money et Wave (bientôt disponibles). Ne paie jamais en dehors de l’application.'],
  ['Et pour les terrains ?', 'Visite toujours le terrain, vérifie les documents (titre foncier, permis urbain d’habiter) et ne verse pas la totalité avant la signature chez un notaire.'],
  ['Comment vendre ?', 'Appuie sur le bouton + , ajoute des photos, un prix et une description. Renseigne ton numéro de paiement dans Profil › Paiements reçus.'],
  ['Conseils anti-arnaque', 'Méfie-toi des prix trop bas, des demandes urgentes et de ceux qui veulent discuter hors de l’application.'],
]

export default function Help() {
  return (
    <div className="glass list">
      {FAQ.map(([q, a]) => (
        <details key={q} className="faq">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  )
}
