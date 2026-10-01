import express from 'express';

/**
 * Pages publiques exigées par Apple :
 * - /confidentialite : politique de confidentialité
 * - /support         : page d'assistance
 */
const router = express.Router();

const CONTACT_EMAIL = 'nassiriilyase@gmail.com';
const EDITOR = 'Ilyas Nassiri (Ilyx Labs)';
const UPDATED_AT = '1er octobre 2026';

const page = (title: string, body: string) => `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} · Viraly</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; background: #0D0017; color: #E9E3F5; font: 16px/1.65 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 760px; margin: 0 auto; padding: 40px 20px 64px; }
  h1 { font-size: 28px; margin: 0 0 4px; color: #fff; }
  h2 { font-size: 19px; margin: 32px 0 8px; color: #E879F9; }
  p, li { color: #D6CDE6; }
  a { color: #C084FC; }
  .muted { color: #9C8FB5; font-size: 14px; }
  ul { padding-left: 20px; }
  .card { background: rgba(144, 19, 254, 0.1); border: 1px solid rgba(144, 19, 254, 0.3); border-radius: 16px; padding: 16px 20px; margin-top: 16px; }
</style>
</head>
<body><main>${body}</main></body>
</html>`;

router.get('/confidentialite', (_req, res) => {
  res.type('html').send(page('Politique de confidentialité', `
<h1>Politique de confidentialité</h1>
<p class="muted">Application Viraly · Dernière mise à jour : ${UPDATED_AT}</p>

<p>Cette politique explique quelles données l'application Viraly collecte, pourquoi, et quels sont tes droits.
Nous collectons uniquement ce qui est nécessaire au fonctionnement de l'app. Nous ne vendons aucune donnée et
n'affichons aucune publicité.</p>

<h2>1. Responsable du traitement</h2>
<p>${EDITOR}, Belgique. Contact : <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a></p>

<h2>2. Données collectées</h2>
<ul>
  <li><strong>Compte</strong> : adresse e-mail, nom (si tu le fournis) et identifiant de connexion lorsque tu crées un compte
  par e-mail, avec Apple ou avec Google.</li>
  <li><strong>Profil créateur</strong> : tes réponses au questionnaire de départ (thématiques, objectifs, fréquence de publication).</li>
  <li><strong>Calendrier</strong> : les publications et tâches que tu planifies dans l'app.</li>
  <li><strong>Vidéos analysées</strong> : la vidéo que tu choisis est envoyée à notre serveur pour être analysée,
  puis <strong>supprimée immédiatement après l'analyse</strong>. Nous ne conservons pas tes vidéos.</li>
  <li><strong>Abonnement</strong> : le statut de ton abonnement (actif, essai, expiré). Le paiement est entièrement géré par Apple :
  nous n'avons jamais accès à tes données bancaires.</li>
</ul>

<h2>3. Pourquoi nous utilisons ces données</h2>
<ul>
  <li>Te permettre de te connecter et retrouver ton profil et ton calendrier sur tous tes appareils (exécution du service).</li>
  <li>Analyser tes vidéos et te donner des conseils personnalisés (exécution du service).</li>
  <li>Vérifier ton abonnement Premium et débloquer les fonctionnalités correspondantes (exécution du contrat).</li>
  <li>Assurer la sécurité du service et limiter les abus (intérêt légitime).</li>
</ul>

<h2>4. Prestataires (sous-traitants)</h2>
<ul>
  <li><strong>Google Firebase</strong> (Google Ireland) : connexion et stockage du profil et du calendrier — serveurs en Europe (Belgique, europe-west1).</li>
  <li><strong>Railway</strong> : hébergement de notre serveur d'analyse — serveurs en Europe (Pays-Bas).</li>
  <li><strong>Google Gemini</strong> (Google) : intelligence artificielle qui analyse la vidéo. La vidéo lui est transmise uniquement
  pour produire l'analyse.</li>
  <li><strong>RevenueCat</strong> : gestion du statut des abonnements souscrits via l'App Store.</li>
  <li><strong>Apple</strong> : paiement des abonnements et connexion « Se connecter avec Apple ».</li>
</ul>
<p>Certains de ces prestataires peuvent traiter des données en dehors de l'Union européenne ; ces transferts sont alors
encadrés par les clauses contractuelles types de la Commission européenne ou le cadre UE–États-Unis de protection des données.</p>

<h2>5. Durée de conservation</h2>
<ul>
  <li>Vidéos : supprimées dès la fin de l'analyse.</li>
  <li>Compte, profil et calendrier : conservés tant que ton compte existe, puis supprimés.</li>
</ul>

<h2>6. Tes droits</h2>
<p>Conformément au RGPD, tu peux accéder à tes données, les corriger, les supprimer, t'opposer à leur traitement
ou demander leur portabilité en nous écrivant à <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>
<div class="card">
  <strong>Supprimer ton compte :</strong> directement dans l'app, onglet <em>Profil</em> → <em>Supprimer mon compte</em>.
  Ton compte, ton profil et ton calendrier sont alors supprimés définitivement. Pense à annuler ton abonnement
  dans les réglages de ton iPhone (Réglages → ton nom → Abonnements).
</div>
<p>Tu peux aussi introduire une réclamation auprès de l'Autorité de protection des données (Belgique) :
<a href="https://www.autoriteprotectiondonnees.be">www.autoriteprotectiondonnees.be</a>.</p>

<h2>7. Âge minimum</h2>
<p>Viraly est destinée aux personnes de 13 ans et plus.</p>

<h2>8. Modifications</h2>
<p>Nous pouvons mettre à jour cette politique. La date de dernière mise à jour figure en haut de cette page.</p>
`));
});

router.get('/support', (_req, res) => {
  res.type('html').send(page('Assistance', `
<h1>Assistance Viraly</h1>
<p class="muted">Une question, un bug, une idée ? On te répond rapidement.</p>

<div class="card">
  <strong>Nous contacter :</strong> <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>
</div>

<h2>Questions fréquentes</h2>
<p><strong>Comment annuler mon abonnement ?</strong><br>
Sur ton iPhone : Réglages → ton nom → Abonnements → Viraly → Annuler l'abonnement.
L'annulation doit être faite au moins 24 h avant la fin de la période en cours.</p>

<p><strong>J'ai changé de téléphone, comment retrouver mon abonnement ?</strong><br>
Connecte-toi avec le même compte, puis sur la page Premium appuie sur « Restaurer mes achats ».</p>

<p><strong>Ma vidéo ne se charge pas.</strong><br>
Si elle est stockée sur iCloud, ouvre-la une fois dans l'app Photos pour qu'elle se télécharge sur ton iPhone, puis réessaie.</p>

<p><strong>Comment supprimer mon compte ?</strong><br>
Dans l'app : onglet Profil → Supprimer mon compte. Toutes tes données sont supprimées définitivement.</p>

<p><a href="/confidentialite">Politique de confidentialité</a></p>
`));
});

export default router;
