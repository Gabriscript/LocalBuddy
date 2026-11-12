import type { Strings } from './en';

/// Informal "tu", and the product's own words: host, ospitare, mostrare interesse, match, chat.
export const it: Strings = {
  common: {
    tryAgain: 'Riprova',
    somethingWrong: 'Qualcosa è andato storto.',
    goBack: 'Indietro',
    close: 'Chiudi',
    continue: 'Continua',
    finish: 'Fine',
    verifyIdentity: 'Verifica la tua identità',
    verified: 'Identità verificata',
    name: 'Nome',
    city: 'Città',
    email: 'Email',
    password: 'Password',
    iWantToBe: 'Voglio essere',
    photoOf: (name) => `Foto di ${name}`,
    yourPhoto: 'La tua foto profilo',
    hasCar: "Ha l'auto",
    pets: 'Animali',
    smokes: 'Fuma',
    canHostOvernight: 'Può ospitare per la notte',
    progress: 'Avanzamento',
    stepOf: (step, total) => `Passaggio ${step} di ${total}`,
  },

  roles: { host: 'Host', guest: 'Viaggiatore', entrambi: 'Entrambi' },
  roleShown: { host: 'Host', guest: 'Viaggiatore', entrambi: 'Host e viaggiatore' },

  tabs: { discover: 'Scopri', chats: 'Chat', me: 'Profilo' },

  timeOfDay: { morning: 'Mattina', afternoon: 'Pomeriggio', evening: 'Sera', night: 'Notte' },

  days: { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mer', thursday: 'Gio', friday: 'Ven', saturday: 'Sab', sunday: 'Dom' },

  activityStyle: { relaxed: 'Piani rilassanti', adventurous: 'Piani emozionanti' },

  lifestyle: { nightlife: 'Vita notturna', family: 'Vita di famiglia' },

  auth: {
    tagline: 'Conosci qualcuno che ci vive.',
    signIn: 'Accedi',
    noAccount: 'Prima volta qui? Registrati',
    haveAccount: 'Hai già un account? Accedi',
    signInFailed: 'Non siamo riusciti a farti entrare. Riprova tra poco.',
    createAccount: 'Crea un account',
    passwordHint: 'Almeno 8 caratteri: una maiuscola, una minuscola, un numero e un simbolo.',
    changeLater: 'Puoi cambiarlo quando vuoi.',
    registerFailed: 'Non siamo riusciti a creare il tuo account. Riprova tra poco.',
  },

  onboarding: {
    aboutTitle: 'Due parole su di te',
    aboutSubtitle:
      "Meglio qualche risposta breve che una lunga bio. Fanno vedere a uno sconosciuto com'è una giornata con te.",
    photoTitle: 'La tua faccia, il tuo tempo libero',
    photoSubtitle: 'Dire sì è più facile davanti a una faccia. Metti una foto chiara e dicci quando hai tempo.',
    changePhoto: 'Cambia foto',
    addPhoto: 'Aggiungi una foto',
    photoPrivacy: 'Prima che qualcuno la veda, togliamo dalla tua foto i dati sulla posizione.',
    whenFree: 'Quando hai tempo, di solito?',
    pickTimes: 'Scegli tutti quelli che ti vanno bene. I programmi cambiano, e questi pure.',
    verifyTitle: 'Verifica che sei tu',
    verifySubtitle:
      'Un controllo veloce del documento, una volta sola. Senza, nessuno può scrivere a nessuno. È così che qui puoi incontrare sconosciuti in sicurezza.',
    verifyCta: 'Inizia il controllo',
    listingTitle: 'Cosa puoi condividere',
    listingSubtitle: 'Un pomeriggio fuori, un letto per la notte, o tutti e due. Puoi cambiarlo più avanti.',
    experience: 'Un pomeriggio fuori',
    experienceHint: 'Una passeggiata, una cena, il bar dove porteresti un amico.',
    overnight: 'Un letto per la notte',
    overnightHint: 'Un viaggiatore passa la notte a casa tua.',
    obligationsTitle: 'Ospitare per la notte comporta obblighi di legge',
    obligationRegistered: 'Sono registrato/a sul portale Alloggiati Web presso la mia Questura.',
    obligationCheck:
      "Verificherò di persona il documento d'identità di ogni ospite al suo arrivo. Un check-in da remoto non basta.",
    obligationSend:
      "Invierò i dati di ogni ospite entro 24 ore dall'arrivo, o entro 6 ore se il soggiorno è inferiore alle 24 ore.",
    cannotSend:
      'LocalBuddy non può inviare questi dati al posto tuo: serve il tuo accesso personale alla Questura.',
    confirmAll: 'Confermo tutti e tre',
    chooseOne: 'Scegline almeno uno per finire.',
  },

  profileFields: {
    style: 'Il tuo stile',
    usualDays: 'Di solito libero il',
    usualDaysHint: "Un'indicazione, non un impegno: il giorno vero lo decidete in chat.",
    activityStyle: 'I tuoi piani sono più',
    lifestyle: 'Sei più per',
    both: "Un po' tutti e due",
    whatWeDo: 'Cosa potremmo fare insieme?',
    whatWeDoHint:
      'Una passeggiata nel tuo quartiere, un mercato che ami, il bar che conosce solo chi vive lì.',
    whyHost: 'Perché ospiti?',
    languages: 'Lingue che parli',
    languagesHint: "Per esempio: italiano, inglese, un po' di spagnolo.",
    facts: 'Le cose pratiche',
    haveCar: "Ho l'auto",
    smoke: 'Fumo',
    havePets: 'Ho animali',
    visible: 'Visibile a chi non ha un account',
    visibleHint:
      'Se lo spegni, solo gli iscritti a LocalBuddy possono vedere il tuo profilo. Puoi cambiarlo quando vuoi.',
  },

  discover: {
    search: 'Dove vai?',
    clearSearch: 'Cancella la destinazione',
    searchTyped: (q) => `Cerca "${q}"`,
    undo: "Riporta l'ultima persona scartata",
    title: 'Scopri',
    subtitle: "Chi c'è vicino, e il pomeriggio che hanno in mente.",
    everyone: 'Tutti',
    hosts: 'Host',
    guests: 'Viaggiatori',
    whoToShow: 'Chi vuoi conoscere',
    filters: 'Filtri',
    filtersLabel: (n) => (n === 1 ? 'Filtri, 1 attivo' : `Filtri, ${n} attivi`),
    emptyFiltered: 'Per ora nessuno corrisponde a tutti questi filtri. Prova ad allargarne uno.',
    empty: "Hai già visto tutti quelli qui vicino. Ripassa tra un po', o prova un'altra città.",
    changeFilters: 'Cambia i filtri',
    openFilters: 'Apri i filtri',
  },

  filters: {
    usualDays: 'Di solito liberi il',
    activityStyle: 'Tipo di piani',
    lifestyle: 'Che ambiente',
    title: 'Filtri',
    clear: 'Azzera',
    showResults: 'Mostra le persone',
    whenFree: 'Quando hanno tempo',
    hasPets: 'Ha animali',
    any: 'Indifferente',
    yes: 'Sì',
    no: 'No',
  },

  profileCard: {
    verified: 'identità verificata',
    rated: (rating) => `valutazione ${rating}`,
    hasCar: "ha l'auto",
    hasPets: 'ha animali',
    smokes: 'fuma',
    openHint: 'Apre il profilo completo',
    passOn: (name) => `Salta ${name}`,
    interestIn: (name) => `Mostra interesse per ${name}`,
  },

  profile: {
    reportOrBlock: 'Segnala o blocca',
    anotherPhotoOf: (name) => `Un'altra foto di ${name}`,
    rating: (rating) => `Valutazione ${rating}`,
    whatWeDo: 'Cosa faremo',
    whyHost: 'Perché ospito',
    languages: 'Lingue',
    reviews: 'Cosa dicono',
    ratedOutOf5: (n) => `Valutazione ${n} su 5`,
    moreReviews: 'Leggi altre recensioni',
    showInterest: 'Mostra interesse',
    unlock: 'Sblocca subito la chat',
  },

  chats: {
    title: 'Chat',
    empty: 'Ancora nessuna chat. Quando dite sì tutti e due, si comincia da qui.',
    sayHello: 'Saluta',
    unlocked: 'Sbloccata',
    unread: (n) => (n === 1 ? '1 messaggio nuovo' : `${n} messaggi nuovi`),
  },

  requests: {
    title: 'Richieste',
    subtitle: "Vorrebbero conoscerti. Di' sì anche tu e la chat si apre.",
    empty: 'Nessuno aspetta una tua risposta.',
    count: (n) => (n === 1 ? '1 richiesta' : `${n} richieste`),
  },

  chat: {
    back: 'Torna alle chat',
    openProfile: (name) => `${name}, apri il suo profilo`,
    conversation: 'Conversazione',
    moreActions: 'Recensisci, segnala o blocca',
    empty: 'Ancora niente. Qualcuno deve pur salutare per primo.',
    youSaid: (text) => `Hai scritto: ${text}`,
    theySaid: (name, text) => `${name ?? "L'altra persona"} ha scritto: ${text}`,
    message: 'Scrivi un messaggio',
    send: 'Invia il messaggio',
  },

  me: {
    notVerified: 'Identità non ancora verificata',
    credits: (n) => (n === 1 ? '1 credito' : `${n} crediti`),
    editProfile: 'Modifica il profilo',
    blocked: 'Iscritti bloccati',
    signOut: 'Esci',
    language: 'Lingua',
    languageRow: (value) => `Lingua: ${value}`,
  },

  language: {
    phone: (name) => `Lingua del telefono (${name})`,
  },

  blocked: {
    title: 'Iscritti bloccati',
    empty:
      'Non hai bloccato nessuno. Se mai lo farai, qui potrai annullarlo.',
    unblock: 'Sblocca',
  },

  editProfile: {
    title: 'Modifica il profilo',
    save: 'Salva le modifiche',
  },

  safety: {
    report: (name) => `Segnala ${name}`,
    block: (name) => `Blocca ${name}`,
    sent: 'Segnalazione inviata',
    sendReport: 'Invia la segnalazione',
    sentBody:
      "Grazie. Un moderatore legge ogni segnalazione. Non riceverai aggiornamenti su questa, e nessuno saprà chi l'ha inviata.",
    whatHappened: "Cos'è successo?",
    whatHappenedHint:
      'Scrivilo come lo racconteresti a una persona. Lo legge un moderatore, non una macchina.',
    reportNotBlock:
      'Segnalare non blocca nessuno. Se vuoi anche che sparisca dal tuo feed e dalla tua casella, blocca questa persona.',
    cancel: 'Annulla',
    blockAction: 'Blocca',
    blockBody: (name) =>
      `${name} non vedrà il tuo profilo e tu non vedrai il suo. Ogni conversazione tra voi si chiude in entrambe le direzioni.`,
    undoLater: 'Puoi annullarlo più avanti da Iscritti bloccati, nel tuo profilo.',
    leaveReview: 'Lascia una recensione',
  },

  review: {
    sent: 'Recensione inviata',
    sentBody:
      'Grazie. Ora è sul suo profilo, e la prossima persona la leggerà prima di farsi viva.',
    title: (name) => `Recensisci ${name}`,
    send: 'Invia la recensione',
    howWasIt: "Com'è andata?",
    rating: 'Valutazione',
    stars: (n) => (n === 1 ? '1 stella' : `${n} stelle`),
    comment: 'Vuoi aggiungere qualcosa?',
    commentHint:
      'Facoltativo. Resta sul suo profilo, quindi scrivi quello che la prossima persona vorrebbe sapere.',
  },

  unlock: {
    title: 'Sblocca la chat',
    checking: 'Sto controllando quanto ti costa.',
    subscription: 'È compreso nel tuo abbonamento. Non paghi altro.',
    credits: (have, cost) =>
      `Hai ${have === 1 ? '1 credito guadagnato' : `${have} crediti guadagnati`} ospitando. Questo ne usa ${cost}.`,
    money: (price) => `${price}, una volta sola, per questa persona.`,
    ctaSubscription: 'Apri la chat',
    ctaCredits: (n) => (n === 1 ? 'Usa 1 credito' : `Usa ${n} crediti`),
    ctaMoney: (price) => `Paga ${price}`,
    body: (name) =>
      `Si apre subito una chat con ${name}, senza aspettare che ricambi l'interesse.`,
    note: "Paghi la presentazione, e nient'altro. Il tempo che passate insieme non si paga mai, per nessuno dei due.",
  },

  match: {
    dialog: (name) => `Tu e ${name} avete detto sì tutti e due`,
    headline: 'Avete detto sì tutti e due',
    body: (name) => `La chat con ${name} è aperta, e nessuno l'ha pagata.`,
    sayHello: 'Saluta',
    theirProfile: 'Il suo profilo',
    later: 'Non ora',
  },

  skeleton: {
    profiles: 'Caricamento dei profili',
    conversations: 'Caricamento delle conversazioni',
  },

  field: {
    showPassword: 'Mostra la password',
    hidePassword: 'Nascondi la password',
  },

  errors: {
    account_banned: 'Questo account è sospeso e non può più usare LocalBuddy.',
    account_not_found: 'Questo account non esiste più.',
    already_responded: 'Hai già risposto a questo profilo.',
    already_reviewed: 'Hai già recensito questa persona.',
    already_subscribed: 'Hai già un abbonamento attivo.',
    blocked: 'Questa persona non è raggiungibile.',
    compliance_not_acknowledged:
      'Per offrire un posto per dormire, conferma prima i tre obblighi di legge.',
    empty_file: 'Il file che hai scelto è vuoto.',
    empty_message: 'Un messaggio non può essere vuoto.',
    file_too_large: 'Le foto devono pesare al massimo 10 MB.',
    home_photo_not_allowed: 'Le foto della casa sono solo per gli host che offrono un posto per dormire.',
    identity_verification_required: 'Verifica la tua identità prima di contattare altri iscritti.',
    image_too_large: 'Questa immagine ha troppi pixel. Le foto scattate col telefono vanno bene.',
    invalid_credentials:
      "Email e password non corrispondono. Dopo 5 tentativi sbagliati, l'accesso si blocca per 15 minuti.",
    invalid_slot:
      "Ogni fascia di disponibilità richiede un momento della giornata valido, e una stagione che finisce dopo l'inizio.",
    moderator_only: 'Solo i moderatori possono farlo.',
    no_exchange:
      'Puoi recensire qualcuno solo dopo che vi siete scritti tutti e due nella stessa conversazione.',
    not_a_resolution: 'Una segnalazione si può chiudere solo come esaminata o archiviata.',
    not_an_image: "Questo file non è un'immagine leggibile.",
    rate_limited: 'Troppi tentativi di fila. Aspetta un minuto e riprova.',
    registration_failed: 'Non siamo riusciti a creare il tuo account. Controlla i dati e riprova.',
    self_target: 'Non puoi farlo sul tuo stesso profilo.',
    target_not_verified:
      'Questa persona non ha ancora verificato la sua identità, quindi la chat non si può sbloccare.',
    too_many_photos: "Puoi avere al massimo 12 foto. Togline una per aggiungerne un'altra.",
    too_many_slots: 'Puoi scegliere al massimo 20 fasce di disponibilità.',
    under_age: 'Devi avere almeno 18 anni per usare LocalBuddy.',
    unknown_plan: 'Questo piano di abbonamento non esiste. Scegli mensile o annuale.',
    weak_password:
      "Controlla l'indirizzo email, e usa una password di almeno 8 caratteri con una maiuscola, una minuscola, un numero e un simbolo.",
  },
};
