import type { Strings } from './en';

/// Spanish from Spain, informal "tú" (and "vosotros" where two people are addressed).
export const es: Strings = {
  common: {
    tryAgain: 'Reintentar',
    somethingWrong: 'Algo ha salido mal.',
    goBack: 'Volver',
    close: 'Cerrar',
    continue: 'Continuar',
    finish: 'Terminar',
    verifyIdentity: 'Verifica tu identidad',
    verified: 'Identidad verificada',
    name: 'Nombre',
    city: 'Ciudad',
    email: 'Correo electrónico',
    password: 'Contraseña',
    iWantToBe: 'Quiero ser',
    photoOf: (name) => `Foto de ${name}`,
    yourPhoto: 'Tu foto de perfil',
    hasCar: 'Tiene coche',
    pets: 'Mascotas',
    smokes: 'Fuma',
    canHostOvernight: 'Puede alojar para dormir',
    progress: 'Progreso',
    stepOf: (step, total) => `Paso ${step} de ${total}`,
  },

  roles: { host: 'Anfitrión', guest: 'Huésped', entrambi: 'Ambos' },
  roleShown: { host: 'Anfitrión', guest: 'Huésped', entrambi: 'Anfitrión y huésped' },

  tabs: { discover: 'Descubrir', chats: 'Chats', me: 'Perfil' },

  timeOfDay: { morning: 'Mañana', afternoon: 'Tarde', evening: 'Anochecer', night: 'Noche' },

  auth: {
    tagline: 'Conoce a gente local. Comparte culturas.',
    signIn: 'Iniciar sesión',
    noAccount: '¿Aún no tienes cuenta? Regístrate',
    haveAccount: '¿Ya tienes cuenta? Inicia sesión',
    signInFailed: 'No se ha podido iniciar sesión. Comprueba tu conexión.',
    createAccount: 'Crear cuenta',
    passwordHint: 'Al menos 8 caracteres.',
    changeLater: 'Puedes cambiarlo más adelante.',
    registerFailed: 'No se ha podido completar el registro. Comprueba tu conexión.',
  },

  onboarding: {
    aboutTitle: 'Sobre ti',
    aboutSubtitle:
      'Unas pocas respuestas cortas dicen más que una biografía larga: le cuentan a un desconocido cómo es un día contigo.',
    photoTitle: 'Tu foto y tu tiempo',
    photoSubtitle: 'Una foto clara de tu cara, y cuándo sueles tener tiempo libre.',
    changePhoto: 'Cambiar foto',
    addPhoto: 'Añadir una foto',
    photoPrivacy: 'Antes de que nadie la vea, se eliminan de tu foto los datos de ubicación.',
    whenFree: '¿Cuándo sueles tener tiempo libre?',
    pickTimes: 'Elige todos los que encajen. Puedes cambiarlos más adelante.',
    verifyTitle: 'Verifica que eres tú',
    verifySubtitle:
      'Una comprobación rápida del documento, una sola vez. Sin ella nadie puede contactar con otro miembro, y eso es lo que hace de esto un lugar para conocer a desconocidos con seguridad.',
    verifyCta: 'Empezar la verificación',
    listingTitle: 'Qué ofreces',
    listingSubtitle:
      'Una tarde fuera, un sitio donde dormir, o las dos cosas. Puedes cambiarlo más adelante.',
    experience: 'Una experiencia',
    experienceHint: 'Enseñarle tu ciudad a alguien: un paseo, una comida, una tarde.',
    overnight: 'Un sitio donde dormir',
    overnightHint: 'Alojar a alguien por la noche en tu casa.',
    obligationsTitle: 'Alojar a alguien por la noche conlleva obligaciones legales',
    obligationRegistered:
      'Estoy registrado/a en el portal Alloggiati Web ante la Questura de mi zona.',
    obligationCheck:
      'Comprobaré en persona el documento de identidad de cada huésped a su llegada. Un check-in a distancia no basta.',
    obligationSend:
      'Enviaré los datos de cada huésped en las 24 horas siguientes a su llegada, o en 6 horas si la estancia dura menos de un día.',
    cannotSend:
      'LocalBuddy no puede enviar estos datos por ti: hace falta tu propio acceso a la Questura.',
    confirmAll: 'Confirmo las tres',
    chooseOne: 'Elige al menos una para terminar.',
  },

  profileFields: {
    whatWeDo: '¿Qué haríamos juntos?',
    whatWeDoHint:
      'Un paseo por tu barrio, un mercado que te encanta, el bar que solo conoce la gente de allí.',
    whyHost: '¿Por qué recibes a viajeros?',
    languages: 'Idiomas que hablas',
    languagesHint: 'Por ejemplo: italiano, inglés, un poco de español.',
    facts: 'Algunos datos',
    haveCar: 'Tengo coche',
    smoke: 'Fumo',
    havePets: 'Tengo mascotas',
    visible: 'Visible para quien no tiene cuenta',
    visibleHint:
      'Desactivado: solo los miembros de LocalBuddy pueden ver tu perfil. Puedes cambiarlo cuando quieras.',
  },

  discover: {
    title: 'Descubrir',
    subtitle: 'Gente cerca de ti que quiere enseñarte su ciudad.',
    everyone: 'Todos',
    hosts: 'Anfitriones',
    guests: 'Viajeros',
    whoToShow: 'A quién mostrar',
    filters: 'Filtros',
    filtersLabel: (n) => (n === 1 ? 'Filtros, 1 activo' : `Filtros, ${n} activos`),
    emptyFiltered: 'Ahora mismo nadie coincide con estos filtros.',
    empty: 'Ahora mismo no hay nadie nuevo aquí. Vuelve más tarde, o mira otra ciudad.',
    changeFilters: 'Cambiar los filtros',
    openFilters: 'Abrir los filtros',
  },

  filters: {
    title: 'Filtros',
    clear: 'Borrar',
    showResults: 'Ver resultados',
    anywhere: 'Cualquier sitio',
    whenFree: 'Cuándo tienen tiempo',
    hasPets: 'Tiene mascotas',
    any: 'Da igual',
    yes: 'Sí',
    no: 'No',
  },

  profileCard: {
    verified: 'identidad verificada',
    rated: (rating) => `valoración ${rating}`,
    hasCar: 'tiene coche',
    hasPets: 'tiene mascotas',
    smokes: 'fuma',
    openHint: 'Abre el perfil completo',
    passOn: (name) => `Pasar de ${name}`,
    interestIn: (name) => `Mostrar interés por ${name}`,
  },

  profile: {
    reportOrBlock: 'Denunciar o bloquear',
    anotherPhotoOf: (name) => `Otra foto de ${name}`,
    rating: (rating) => `Valoración ${rating}`,
    whatWeDo: 'Qué haremos',
    whyHost: 'Por qué recibo a viajeros',
    languages: 'Idiomas',
    reviews: 'Lo que dice la gente',
    ratedOutOf5: (n) => `Valoración: ${n} de 5`,
    moreReviews: 'Más reseñas',
    showInterest: 'Mostrar interés',
    unlock: 'Desbloquear el chat sin match',
  },

  chats: {
    title: 'Chats',
    empty: 'Aún no hay conversaciones. Un chat se abre cuando el interés es mutuo.',
    sayHello: 'Saluda',
    unlocked: 'Desbloqueado',
  },

  chat: {
    back: 'Volver a los chats',
    openProfile: (name) => `${name}, abrir su perfil`,
    conversation: 'Conversación',
    moreActions: 'Reseñar, denunciar o bloquear',
    empty: 'Aún no hay mensajes. Saluda.',
    youSaid: (text) => `Has escrito: ${text}`,
    theySaid: (name, text) => `${name ?? 'La otra persona'} ha escrito: ${text}`,
    message: 'Mensaje',
    send: 'Enviar mensaje',
  },

  me: {
    notVerified: 'Identidad aún sin verificar',
    credits: (n) => (n === 1 ? '1 crédito' : `${n} créditos`),
    editProfile: 'Editar perfil',
    blocked: 'Miembros bloqueados',
    signOut: 'Cerrar sesión',
    language: 'Idioma',
    languageRow: (value) => `Idioma: ${value}`,
  },

  language: {
    phone: (name) => `Idioma del teléfono (${name})`,
  },

  blocked: {
    title: 'Miembros bloqueados',
    empty:
      'No hay nadie bloqueado. Bloquear oculta a dos personas entre sí, y aquí es donde se puede deshacer.',
    unblock: 'Desbloquear',
  },

  editProfile: {
    title: 'Editar perfil',
    save: 'Guardar cambios',
  },

  safety: {
    report: (name) => `Denunciar a ${name}`,
    block: (name) => `Bloquear a ${name}`,
    sent: 'Denuncia enviada',
    sendReport: 'Enviar denuncia',
    sentBody:
      'Gracias. Un moderador lee cada denuncia. No recibirás respuesta sobre esta, y nadie sabrá quién la envió.',
    whatHappened: '¿Qué ha pasado?',
    whatHappenedHint:
      'Escríbelo como se lo contarías a una persona. Lo lee un moderador, no una máquina.',
    reportNotBlock:
      'Denunciar no bloquea a nadie. Si además quieres que desaparezca de tu feed y de tu bandeja de entrada, bloquea a esta persona.',
    cancel: 'Cancelar',
    blockAction: 'Bloquear',
    blockBody: (name) =>
      `${name} no verá tu perfil y tú no verás el suyo. Cualquier conversación entre vosotros se cierra en los dos sentidos.`,
    undoLater: 'Puedes deshacerlo más adelante desde Miembros bloqueados, en tu perfil.',
    leaveReview: 'Dejar una reseña',
  },

  review: {
    sent: 'Reseña enviada',
    sentBody:
      'Gracias. Ya está en su perfil, y cuenta para lo que otras personas ven antes de ponerse en contacto.',
    title: (name) => `Reseñar a ${name}`,
    send: 'Enviar reseña',
    howWasIt: '¿Qué tal fue?',
    rating: 'Valoración',
    stars: (n) => (n === 1 ? '1 estrella' : `${n} estrellas`),
    comment: '¿Algo que añadir?',
    commentHint:
      'Opcional. Se queda en su perfil, así que escribe lo que la próxima persona querría saber.',
  },

  unlock: {
    title: 'Desbloquear el chat',
    checking: 'Comprobando cuánto te cuesta.',
    subscription: 'Tu suscripción lo cubre, sin nada más que pagar.',
    credits: (have, cost) =>
      `Tienes ${have === 1 ? '1 crédito ganado' : `${have} créditos ganados`} alojando. Esto usa ${cost}.`,
    money: (price) => `${price}, una sola vez, por esta persona.`,
    ctaSubscription: 'Abrir el chat',
    ctaCredits: (n) => (n === 1 ? 'Usar 1 crédito' : `Usar ${n} créditos`),
    ctaMoney: (price) => `Pagar ${price}`,
    body: (name) =>
      `Esto abre una conversación con ${name} enseguida, en lugar de esperar a que te devuelva el interés.`,
    note: 'Pagas la presentación, y nada más. El tiempo que pasáis juntos nunca se paga, por ninguno de los dos.',
  },

  match: {
    dialog: (name) => `${name} y tú habéis dicho que sí`,
    headline: 'Los dos habéis dicho que sí',
    body: (name) => `El chat con ${name} está abierto, y nadie ha pagado por él.`,
    sayHello: 'Saludar',
    theirProfile: 'Su perfil',
    later: 'Más tarde',
  },

  skeleton: {
    profiles: 'Cargando perfiles',
    conversations: 'Cargando conversaciones',
  },

  field: {
    showPassword: 'Mostrar contraseña',
    hidePassword: 'Ocultar contraseña',
  },

  errors: {
    account_banned: 'Esta cuenta está suspendida y ya no puede usar LocalBuddy.',
    account_not_found: 'Esta cuenta ya no existe.',
    already_responded: 'Ya has respondido a este perfil.',
    already_reviewed: 'Ya has reseñado a esta persona.',
    already_subscribed: 'Ya tienes una suscripción activa.',
    blocked: 'No se puede contactar con esta persona.',
    compliance_not_acknowledged:
      'Para ofrecer un sitio donde dormir, confirma antes las tres obligaciones legales.',
    empty_file: 'El archivo que has elegido está vacío.',
    empty_message: 'Un mensaje no puede estar vacío.',
    file_too_large: 'Las fotos deben pesar 10 MB o menos.',
    home_photo_not_allowed:
      'Las fotos de casa son solo para anfitriones que ofrecen un sitio donde dormir.',
    identity_verification_required: 'Verifica tu identidad antes de contactar con otros miembros.',
    image_too_large: 'Esa imagen tiene demasiados píxeles. Las fotos hechas con el teléfono están bien.',
    invalid_credentials:
      'El correo o la contraseña no son correctos. Tras 5 intentos fallidos, el acceso se bloquea durante 15 minutos.',
    invalid_slot:
      'Cada franja de disponibilidad necesita un momento del día válido y una temporada que termine después de empezar.',
    moderator_only: 'Solo los moderadores pueden hacer esto.',
    no_exchange:
      'Solo puedes reseñar a alguien cuando los dos os habéis escrito en la misma conversación.',
    not_a_resolution: 'Una denuncia solo se puede cerrar como revisada o descartada.',
    not_an_image: 'Ese archivo no es una imagen legible.',
    rate_limited: 'Demasiadas solicitudes. Espera un minuto y vuelve a intentarlo.',
    registration_failed: 'No se ha podido completar el registro.',
    self_target: 'No puedes hacer esto con tu propio perfil.',
    target_not_verified:
      'Esta persona aún no ha verificado su identidad, así que el chat no se puede desbloquear.',
    too_many_photos: 'Puedes tener como máximo 12 fotos. Quita una para añadir otra.',
    too_many_slots: 'Puedes elegir como máximo 20 franjas de disponibilidad.',
    under_age: 'Tienes que tener 18 años o más para usar LocalBuddy.',
    unknown_plan: 'Ese plan de suscripción no existe. Elige mensual o anual.',
    weak_password:
      'Revisa el correo electrónico y usa una contraseña de al menos 8 caracteres con una mayúscula, una minúscula, un número y un símbolo.',
  },
};
