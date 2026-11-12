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

  days: { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Jeu', friday: 'Ven', saturday: 'Sam', sunday: 'Dim' },

  activityStyle: { relaxed: 'Sorties tranquilles', adventurous: 'Sorties palpitantes' },

  lifestyle: { nightlife: 'Vie nocturne', family: 'Vie de famille' },

  auth: {
    tagline: "Rencontrez quelqu'un du coin.",
    signIn: 'Se connecter',
    noAccount: 'Pas encore membre ? Inscrivez-vous',
    haveAccount: 'Déjà membre ? Connectez-vous',
    signInFailed: "Nous n'avons pas pu vous connecter. Réessayez dans un instant.",
    createAccount: 'Créer un compte',
    passwordHint: 'Au moins 8 caractères : majuscules et minuscules, un chiffre et un symbole.',
    changeLater: 'Vous pourrez en changer à tout moment.',
    registerFailed: "Nous n'avons pas pu créer votre compte. Réessayez dans un instant.",
  },

  onboarding: {
    aboutTitle: 'Un mot sur vous',
    aboutSubtitle:
      "Des réponses courtes valent mieux qu'une longue bio. Elles montrent à un inconnu à quoi ressemble une journée avec vous.",
    photoTitle: 'Votre visage, votre temps libre',
    photoSubtitle: 'On dit oui à un visage. Ajoutez une photo nette, et dites-nous quand vous êtes libre.',
    changePhoto: 'Changer de photo',
    addPhoto: 'Ajouter une photo',
    photoPrivacy:
      'Les données de localisation sont retirées de votre photo avant que quiconque la voie.',
    whenFree: 'Quand êtes-vous libre en général ?',
    pickTimes: 'Choisissez tout ce qui vous convient. Les projets changent, vos choix aussi.',
    verifyTitle: "Vérifiez que c'est bien vous",
    verifySubtitle:
      "Un contrôle rapide de votre pièce d'identité, une seule fois. Sans lui, personne ne peut écrire à personne : c'est ce qui permet de rencontrer des inconnus en toute sécurité.",
    verifyCta: 'Lancer la vérification',
    listingTitle: 'Ce que vous pouvez partager',
    listingSubtitle:
      'Un après-midi dehors, un lit pour la nuit, ou les deux. Vous pourrez le changer plus tard.',
    experience: 'Un après-midi dehors',
    experienceHint: 'Une balade, un repas, le bar où vous emmèneriez un ami.',
    overnight: 'Un lit pour la nuit',
    overnightHint: 'Un voyageur passe la nuit chez vous.',
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
    style: 'Votre style',
    usualDays: 'Généralement libre le',
    usualDaysHint: 'Une indication, pas un engagement : le vrai jour se décide dans le chat.',
    activityStyle: 'Vos sorties sont plutôt',
    lifestyle: 'Vous penchez pour',
    both: 'Un peu des deux',
    whatWeDo: 'Que ferions-nous ensemble ?',
    whatWeDoHint:
      'Une balade dans votre quartier, un marché que vous aimez, le bar que seuls les gens du coin connaissent.',
    whyHost: 'Pourquoi accueillez-vous des voyageurs ?',
    languages: 'Langues que vous parlez',
    languagesHint: "Par exemple : italien, anglais, un peu d'espagnol.",
    facts: 'Le côté pratique',
    haveCar: "J'ai une voiture",
    smoke: 'Je fume',
    havePets: "J'ai des animaux",
    visible: 'Visible par les personnes sans compte',
    visibleHint:
      'Désactivé : seuls les membres de LocalBuddy peuvent voir votre profil. Vous pouvez le changer à tout moment.',
  },

  discover: {
    search: 'Où allez-vous ?',
    clearSearch: 'Effacer la destination',
    searchTyped: (q) => `Chercher « ${q} »`,
    undo: 'Faire revenir la dernière personne écartée',
    title: 'Découvrir',
    subtitle: "Qui est près de vous, et l'après-midi qu'ils ont en tête.",
    everyone: 'Tout le monde',
    hosts: 'Hôtes',
    guests: 'Voyageurs',
    whoToShow: 'Qui aimeriez-vous rencontrer ?',
    filters: 'Filtres',
    filtersLabel: (n) => (n <= 1 ? `Filtres, ${n} actif` : `Filtres, ${n} actifs`),
    emptyFiltered: "Personne ne coche toutes ces cases pour l'instant. Essayez d'en retirer une.",
    empty: 'Vous avez vu tout le monde dans le coin. Repassez bientôt, ou essayez une autre ville.',
    changeFilters: 'Modifier les filtres',
    openFilters: 'Ouvrir les filtres',
  },

  filters: {
    usualDays: 'Généralement libres le',
    activityStyle: 'Type de sorties',
    lifestyle: 'Quelle ambiance',
    title: 'Filtres',
    clear: 'Effacer',
    showResults: 'Voir les personnes',
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
    moreReviews: "Lire plus d'avis",
    showInterest: "Montrer de l'intérêt",
    unlock: 'Débloquer la conversation sans attendre',
  },

  chats: {
    title: 'Messages',
    empty: "Aucune conversation pour l'instant. Quand vous dites oui tous les deux, c'est ici que tout commence.",
    sayHello: 'Dites bonjour',
    unlocked: 'Débloquée',
    unread: (n) => (n === 1 ? '1 nouveau message' : `${n} nouveaux messages`),
  },

  requests: {
    title: 'Demandes',
    subtitle: 'Ils aimeraient vous rencontrer. Un oui, et vous discutez.',
    empty: "Personne n'attend votre réponse.",
    count: (n) => (n === 1 ? '1 demande' : `${n} demandes`),
  },

  chat: {
    back: 'Retour aux messages',
    openProfile: (name) => `${name}, ouvrir son profil`,
    conversation: 'Conversation',
    moreActions: 'Laisser un avis, signaler ou bloquer',
    empty: "Rien pour l'instant. Il faut bien que quelqu'un dise bonjour en premier.",
    youSaid: (text) => `Vous avez écrit : ${text}`,
    theySaid: (name, text) => `${name ?? "L'autre personne"} a écrit : ${text}`,
    message: 'Écrire un message',
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
      "Vous n'avez bloqué personne. Si cela arrive un jour, c'est ici que vous pourrez l'annuler.",
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
      'Merci. Il est maintenant sur son profil, où la prochaine personne le lira avant de prendre contact.',
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
      `Cela ouvre la conversation avec ${name} dès maintenant, sans attendre son intérêt en retour.`,
    note: "Vous payez la présentation, et rien d'autre. Le temps passé ensemble n'est jamais payé, ni par vous ni par l'autre.",
  },

  match: {
    dialog: (name) => `${name} et vous avez tous les deux dit oui`,
    headline: 'Vous avez tous les deux dit oui',
    body: (name) => `La conversation avec ${name} est ouverte, et personne ne l'a payée.`,
    sayHello: 'Dire bonjour',
    theirProfile: 'Son profil',
    later: 'Pas maintenant',
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
      'Cet e-mail et ce mot de passe ne correspondent pas. Après 5 essais manqués, la connexion est suspendue pendant 15 minutes.',
    invalid_slot:
      'Chaque créneau de disponibilité doit avoir un moment de la journée valide, et une saison qui se termine après son début.',
    moderator_only: 'Seuls les modérateurs peuvent faire cela.',
    no_exchange:
      "Vous ne pouvez laisser un avis qu'après vous être écrit tous les deux dans la même conversation.",
    not_a_resolution: 'Un signalement ne peut être clos que comme examiné ou classé.',
    not_an_image: "Ce fichier n'est pas une image lisible.",
    rate_limited: "Trop d'essais d'affilée. Attendez une minute et réessayez.",
    registration_failed: "Nous n'avons pas pu créer votre compte. Vérifiez vos informations et réessayez.",
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
