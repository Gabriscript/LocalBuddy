import type { Strings } from './en';

/// "Vous" throughout. The space before a colon or a question mark is a no-break space ( ),
/// so the mark never wraps onto a line of its own.
export const fr: Strings = {
  common: {
    tryAgain: 'Réessayer',
    somethingWrong: 'Une erreur est survenue.',
    goBack: 'Retour',
    close: 'Fermer',
    continue: 'Continuer',
    finish: 'Terminer',
    verifyIdentity: 'Vérifier votre identité',
    verified: 'Identité vérifiée',
    name: 'Prénom',
    city: 'Ville',
    email: 'E-mail',
    password: 'Mot de passe',
    iWantToBe: 'Je veux être',
    photoOf: (name) => `Photo de ${name}`,
    yourPhoto: 'Votre photo de profil',
    hasCar: 'A une voiture',
    pets: 'Animaux',
    smokes: 'Fume',
    canHostOvernight: 'Peut héberger pour la nuit',
    progress: 'Progression',
    stepOf: (step, total) => `Étape ${step} sur ${total}`,
  },

  roles: { host: 'Hôte', guest: 'Voyageur', entrambi: 'Les deux' },
  roleShown: { host: 'Hôte', guest: 'Voyageur', entrambi: 'Hôte et voyageur' },

  tabs: { discover: 'Découvrir', chats: 'Messages', me: 'Profil' },

  timeOfDay: { morning: 'Matin', afternoon: 'Après-midi', evening: 'Soirée', night: 'Nuit' },

  auth: {
    tagline: 'Rencontrez des gens du coin. Partagez vos cultures.',
    signIn: 'Se connecter',
    noAccount: 'Pas encore de compte ? Inscrivez-vous',
    haveAccount: 'Vous avez déjà un compte ? Connectez-vous',
    signInFailed: 'Impossible de vous connecter. Vérifiez votre réseau.',
    createAccount: 'Créer un compte',
    passwordHint: 'Au moins 8 caractères.',
    changeLater: 'Vous pourrez le changer plus tard.',
    registerFailed: 'Inscription impossible. Vérifiez votre réseau.',
  },

  onboarding: {
    aboutTitle: 'À propos de vous',
    aboutSubtitle:
      "Quelques réponses courtes en disent plus qu'une longue bio : elles montrent à un inconnu à quoi ressemble une journée avec vous.",
    photoTitle: 'Votre photo et votre temps',
    photoSubtitle: 'Une photo nette de votre visage, et quand vous êtes libre en général.',
    changePhoto: 'Changer de photo',
    addPhoto: 'Ajouter une photo',
    photoPrivacy:
      'Les données de localisation sont retirées de votre photo avant que quiconque la voie.',
    whenFree: 'Quand êtes-vous libre en général ?',
    pickTimes: 'Choisissez tous ceux qui conviennent. Vous pourrez les changer plus tard.',
    verifyTitle: "Vérifiez que c'est bien vous",
    verifySubtitle:
      "Un contrôle rapide de votre pièce d'identité, une seule fois. Sans lui, personne ne peut contacter un autre membre, et c'est ce qui permet de rencontrer des inconnus en toute sécurité.",
    verifyCta: 'Lancer la vérification',
    listingTitle: 'Ce que vous proposez',
    listingSubtitle:
      'Un après-midi dehors, un endroit où dormir, ou les deux. Vous pourrez le changer plus tard.',
    experience: 'Une expérience',
    experienceHint: 'Faire découvrir votre ville : une balade, un repas, un après-midi.',
    overnight: 'Un endroit où dormir',
    overnightHint: "Héberger quelqu'un pour la nuit chez vous.",
    obligationsTitle: 'Héberger pour la nuit implique des obligations légales',
    obligationRegistered:
      'Je suis inscrit(e) sur le portail Alloggiati Web auprès de la Questura dont je dépends.',
    obligationCheck:
      "Je vérifierai en personne la pièce d'identité de chaque personne hébergée à son arrivée. Un enregistrement à distance ne suffit pas.",
    obligationSend:
      "J'enverrai les données de chaque personne hébergée dans les 24 heures suivant son arrivée, ou dans les 6 heures pour un séjour de moins d'une journée.",
    cannotSend:
      'LocalBuddy ne peut pas envoyer ces données à votre place : il faut votre propre accès à la Questura.',
    confirmAll: 'Je confirme les trois',
    chooseOne: 'Choisissez au moins une option pour terminer.',
  },

  profileFields: {
    whatWeDo: 'Que ferions-nous ensemble ?',
    whatWeDoHint:
      'Une balade dans votre quartier, un marché que vous aimez, le bar que seuls les gens du coin connaissent.',
    whyHost: 'Pourquoi accueillez-vous des voyageurs ?',
    languages: 'Langues que vous parlez',
    languagesHint: "Par exemple : italien, anglais, un peu d'espagnol.",
    facts: 'Quelques informations',
    haveCar: "J'ai une voiture",
    smoke: 'Je fume',
    havePets: "J'ai des animaux",
    visible: 'Visible par les personnes sans compte',
    visibleHint:
      'Désactivé : seuls les membres de LocalBuddy peuvent voir votre profil. Vous pouvez le changer à tout moment.',
  },

  discover: {
    title: 'Découvrir',
    subtitle: 'Des gens près de chez vous qui veulent vous montrer leur ville.',
    everyone: 'Tout le monde',
    hosts: 'Hôtes',
    guests: 'Voyageurs',
    whoToShow: 'Qui afficher',
    filters: 'Filtres',
    filtersLabel: (n) => (n <= 1 ? `Filtres, ${n} actif` : `Filtres, ${n} actifs`),
    emptyFiltered: 'Personne ne correspond à ces filtres pour le moment.',
    empty: 'Personne de nouveau ici pour le moment. Revenez plus tard, ou regardez une autre ville.',
    changeFilters: 'Modifier les filtres',
    openFilters: 'Ouvrir les filtres',
  },

  filters: {
    title: 'Filtres',
    clear: 'Effacer',
    showResults: 'Voir les résultats',
    anywhere: 'Partout',
    whenFree: 'Quand ils sont libres',
    hasPets: 'A des animaux',
    any: 'Peu importe',
    yes: 'Oui',
    no: 'Non',
  },

  profileCard: {
    verified: 'identité vérifiée',
    rated: (rating) => `note ${rating}`,
    hasCar: 'a une voiture',
    hasPets: 'a des animaux',
    smokes: 'fume',
    openHint: 'Ouvre le profil complet',
    passOn: (name) => `Passer le profil de ${name}`,
    interestIn: (name) => `Montrer de l'intérêt pour ${name}`,
  },

  profile: {
    reportOrBlock: 'Signaler ou bloquer',
    anotherPhotoOf: (name) => `Une autre photo de ${name}`,
    rating: (rating) => `Note ${rating}`,
    whatWeDo: 'Ce que nous ferons',
    whyHost: "Pourquoi j'accueille",
    languages: 'Langues',
    reviews: "Ce qu'on en dit",
    ratedOutOf5: (n) => `Note : ${n} sur 5`,
    moreReviews: "Plus d'avis",
    showInterest: "Montrer de l'intérêt",
    unlock: 'Débloquer la conversation sans match',
  },

  chats: {
    title: 'Messages',
    empty: "Pas encore de conversation. Une conversation s'ouvre quand l'intérêt est réciproque.",
    sayHello: 'Dites bonjour',
    unlocked: 'Débloquée',
  },

  chat: {
    back: 'Retour aux messages',
    openProfile: (name) => `${name}, ouvrir son profil`,
    conversation: 'Conversation',
    moreActions: 'Laisser un avis, signaler ou bloquer',
    empty: 'Pas encore de message. Dites bonjour.',
    youSaid: (text) => `Vous avez écrit : ${text}`,
    theySaid: (name, text) => `${name ?? "L'autre personne"} a écrit : ${text}`,
    message: 'Message',
    send: 'Envoyer le message',
  },

  me: {
    notVerified: 'Identité pas encore vérifiée',
    credits: (n) => (n <= 1 ? `${n} crédit` : `${n} crédits`),
    editProfile: 'Modifier le profil',
    blocked: 'Membres bloqués',
    signOut: 'Se déconnecter',
    language: 'Langue',
    languageRow: (value) => `Langue : ${value}`,
  },

  language: {
    phone: (name) => `Langue du téléphone (${name})`,
  },

  blocked: {
    title: 'Membres bloqués',
    empty:
      "Personne n'est bloqué. Bloquer cache deux personnes l'une à l'autre, et c'est ici qu'on peut l'annuler.",
    unblock: 'Débloquer',
  },

  editProfile: {
    title: 'Modifier le profil',
    save: 'Enregistrer',
  },

  safety: {
    report: (name) => `Signaler ${name}`,
    block: (name) => `Bloquer ${name}`,
    sent: 'Signalement envoyé',
    sendReport: 'Envoyer le signalement',
    sentBody:
      "Merci. Un modérateur lit chaque signalement. Vous n'aurez pas de retour sur celui-ci, et personne ne saura qui l'a envoyé.",
    whatHappened: "Que s'est-il passé ?",
    whatHappenedHint:
      "Écrivez-le comme vous le raconteriez à quelqu'un. C'est un modérateur qui le lit, pas une machine.",
    reportNotBlock:
      'Signaler ne bloque personne. Si vous voulez aussi que cette personne disparaisse de votre fil et de votre messagerie, bloquez-la.',
    cancel: 'Annuler',
    blockAction: 'Bloquer',
    blockBody: (name) =>
      `${name} ne verra pas votre profil et vous ne verrez pas le sien. Toute conversation entre vous se ferme dans les deux sens.`,
    undoLater: "Vous pourrez l'annuler plus tard depuis Membres bloqués, dans votre profil.",
    leaveReview: 'Laisser un avis',
  },

  review: {
    sent: 'Avis envoyé',
    sentBody:
      'Merci. Il est maintenant sur son profil, et compte dans ce que les autres voient avant de prendre contact.',
    title: (name) => `Donner un avis sur ${name}`,
    send: "Envoyer l'avis",
    howWasIt: "Comment ça s'est passé ?",
    rating: 'Note',
    stars: (n) => (n <= 1 ? `${n} étoile` : `${n} étoiles`),
    comment: 'Quelque chose à ajouter ?',
    commentHint:
      'Facultatif. Il reste sur son profil, alors écrivez ce que la prochaine personne voudrait savoir.',
  },

  unlock: {
    title: 'Débloquer la conversation',
    checking: 'Vérification de ce que cela vous coûte.',
    subscription: 'Votre abonnement le couvre, sans rien de plus à payer.',
    credits: (have, cost) =>
      `Vous avez ${have <= 1 ? `${have} crédit gagné` : `${have} crédits gagnés`} en hébergeant. Ceci en utilise ${cost}.`,
    money: (price) => `${price}, une seule fois, pour cette personne.`,
    ctaSubscription: 'Ouvrir la conversation',
    ctaCredits: (n) => (n <= 1 ? `Utiliser ${n} crédit` : `Utiliser ${n} crédits`),
    ctaMoney: (price) => `Payer ${price}`,
    body: (name) =>
      `Cela ouvre tout de suite une conversation avec ${name}, sans attendre que cette personne vous montre de l'intérêt en retour.`,
    note: "Vous payez la présentation, et rien d'autre. Le temps passé ensemble n'est jamais payé, ni par vous ni par l'autre.",
  },

  match: {
    dialog: (name) => `${name} et vous avez tous les deux dit oui`,
    headline: 'Vous avez tous les deux dit oui',
    body: (name) => `La conversation avec ${name} est ouverte, et personne ne l'a payée.`,
    sayHello: 'Dire bonjour',
    theirProfile: 'Son profil',
    later: 'Plus tard',
  },

  skeleton: {
    profiles: 'Chargement des profils',
    conversations: 'Chargement des conversations',
  },

  field: {
    showPassword: 'Afficher le mot de passe',
    hidePassword: 'Masquer le mot de passe',
  },

  errors: {
    account_banned: 'Ce compte est suspendu et ne peut plus utiliser LocalBuddy.',
    account_not_found: "Ce compte n'existe plus.",
    already_responded: 'Vous avez déjà répondu à ce profil.',
    already_reviewed: 'Vous avez déjà laissé un avis sur cette personne.',
    already_subscribed: 'Vous avez déjà un abonnement actif.',
    blocked: "Cette personne n'est pas joignable.",
    compliance_not_acknowledged:
      "Pour proposer un endroit où dormir, confirmez d'abord les trois obligations légales.",
    empty_file: 'Le fichier choisi est vide.',
    empty_message: 'Un message ne peut pas être vide.',
    file_too_large: 'Les photos doivent faire 10 Mo au maximum.',
    home_photo_not_allowed:
      'Les photos du logement sont réservées aux hôtes qui proposent un endroit où dormir.',
    identity_verification_required: "Vérifiez votre identité avant de contacter d'autres membres.",
    image_too_large: 'Cette image a trop de pixels. Les photos prises avec un téléphone conviennent.',
    invalid_credentials:
      "L'e-mail ou le mot de passe est incorrect. Après 5 essais manqués, la connexion est bloquée pendant 15 minutes.",
    invalid_slot:
      'Chaque créneau de disponibilité doit avoir un moment de la journée valide, et une saison qui se termine après son début.',
    moderator_only: 'Seuls les modérateurs peuvent faire cela.',
    no_exchange:
      "Vous ne pouvez laisser un avis qu'après vous être écrit tous les deux dans la même conversation.",
    not_a_resolution: 'Un signalement ne peut être clos que comme examiné ou classé.',
    not_an_image: "Ce fichier n'est pas une image lisible.",
    rate_limited: 'Trop de demandes. Attendez une minute et réessayez.',
    registration_failed: "L'inscription n'a pas pu aboutir.",
    self_target: 'Vous ne pouvez pas faire cela sur votre propre profil.',
    target_not_verified:
      "Cette personne n'a pas encore vérifié son identité, la conversation ne peut donc pas être débloquée.",
    too_many_photos: 'Vous pouvez avoir au maximum 12 photos. Retirez-en une pour en ajouter une autre.',
    too_many_slots: 'Vous pouvez choisir au maximum 20 créneaux de disponibilité.',
    under_age: 'Vous devez avoir 18 ans ou plus pour utiliser LocalBuddy.',
    unknown_plan: "Cette formule d'abonnement n'existe pas. Choisissez mensuelle ou annuelle.",
    weak_password:
      "Vérifiez l'adresse e-mail, et choisissez un mot de passe d'au moins 8 caractères avec une majuscule, une minuscule, un chiffre et un symbole.",
  },
};
