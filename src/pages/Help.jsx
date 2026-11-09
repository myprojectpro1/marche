const FAQ = [
  ['Comment payer ?', 'Sur la page de paiement, choisis Orange Money ou Moov : le code USSD s’ouvre sur ton téléphone avec le numéro du vendeur. Pour Wave, tu envoies le montant depuis l’application Wave. Puis tu saisis la référence reçue par SMS.'],
  ['Le paiement est-il protégé ?', 'Non : c’est un transfert direct au vendeur, sans séquestre. Vérifie le nom du vendeur, ses annonces et ses échanges avant de payer, et garde toujours le SMS de confirmation.'],
  ['Comment le vendeur confirme-t-il ?', 'Il vérifie le SMS de son opérateur, puis confirme dans Mes commandes. L’article est alors réservé pour toi.'],
  ['Et pour les terrains ?', 'Visite toujours le terrain, vérifie les documents (titre foncier, permis urbain d’habiter) et ne verse jamais la totalité avant la signature chez un notaire.'],
  ['Comment vendre ?', 'Appuie sur le bouton +, ajoute des photos, un prix et une description. Renseigne tes numéros dans Profil › Paiements reçus pour être payé.'],
  ['Conseils anti-arnaque', 'Méfie-toi des prix trop bas, des demandes urgentes et de ceux qui veulent discuter ou payer hors de l’application. Ne partage jamais ton code secret.'],
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
