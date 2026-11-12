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

  roles: { host: 'Anfitrión', guest: 'Viajero', entrambi: 'Ambos' },
  roleShown: { host: 'Anfitrión', guest: 'Viajero', entrambi: 'Anfitrión y viajero' },

  tabs: { discover: 'Descubrir', chats: 'Chats', me: 'Perfil' },

  timeOfDay: { morning: 'Mañana', afternoon: 'Tarde', evening: 'Anochecer', night: 'Noche' },

  days: { monday: 'Lun', tuesday: 'Mar', wednesday: 'Mié', thursday: 'Jue', friday: 'Vie', saturday: 'Sáb', sunday: 'Dom' },

  activityStyle: { relaxed: 'Planes tranquilos', adventurous: 'Planes emocionantes' },

  lifestyle: { nightlife: 'Vida nocturna', family: 'Vida familiar' },

  auth: {
    tagline: 'Conoce a alguien que vive allí.',
    signIn: 'Iniciar sesión',
    noAccount: '¿Primera vez aquí? Regístrate',
    haveAccount: '¿Ya eres miembro? Inicia sesión',
    signInFailed: 'No hemos podido iniciar tu sesión. Prueba otra vez en un momento.',
    createAccount: 'Crear cuenta',
    passwordHint: 'Al menos 8 caracteres: mayúsculas y minúsculas, un número y un símbolo.',
    changeLater: 'Puedes cambiarlo cuando quieras.',
    registerFailed: 'No hemos podido crear tu cuenta. Prueba otra vez en un momento.',
  },

  onboarding: {
    aboutTitle: 'Un poco sobre ti',
    aboutSubtitle:
      'Las respuestas cortas ganan a una biografía larga. Le enseñan a un desconocido cómo es un día contigo.',
    photoTitle: 'Tu cara, tu tiempo libre',
    photoSubtitle:
      'La gente dice que sí a una cara. Sube una foto clara y cuéntanos cuándo tienes tiempo libre.',
    changePhoto: 'Cambiar foto',
    addPhoto: 'Añadir una foto',
    photoPrivacy: 'Antes de que nadie la vea, se eliminan de tu foto los datos de ubicación.',
    whenFree: '¿Cuándo sueles tener tiempo libre?',
    pickTimes: 'Elige todos los que encajen. Los planes cambian, y esto también.',
    verifyTitle: 'Verifica que eres tú',
    verifySubtitle:
      'Una comprobación rápida del documento, una sola vez. Sin ella nadie puede escribir a nadie, y así este sigue siendo un sitio seguro para conocer a desconocidos.',
    verifyCta: 'Empezar la comprobación',
    listingTitle: 'Qué puedes compartir',
    listingSubtitle:
      'Una tarde fuera, una cama para la noche, o las dos cosas. Puedes cambiarlo más adelante.',
    experience: 'Una tarde fuera',
    experienceHint: 'Un paseo, una comida, el bar al que llevarías a un amigo.',
    overnight: 'Una cama para la noche',
    overnightHint: 'Un viajero pasa la noche en tu casa.',
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
    style: 'Tu estilo',
    usualDays: 'Normalmente libre el',
    usualDaysHint: 'Una indicación, no un compromiso: el día real lo acordáis en el chat.',
    activityStyle: 'Tus planes son más bien',
    lifestyle: 'Te va más',
    both: 'Un poco de todo',
    whatWeDo: '¿Qué haríamos juntos?',
    whatWeDoHint:
      'Un paseo por tu barrio, un mercado que te encanta, el bar que solo conoce la gente de allí.',
    whyHost: '¿Por qué recibes a viajeros?',
    languages: 'Idiomas que hablas',
    languagesHint: 'Por ejemplo: italiano, inglés, un poco de español.',
    facts: 'Lo práctico',
    haveCar: 'Tengo coche',
    smoke: 'Fumo',
    havePets: 'Tengo mascotas',
    visible: 'Visible para quien no tiene cuenta',
    visibleHint:
      'Desactivado: solo los miembros de LocalBuddy pueden ver tu perfil. Puedes cambiarlo cuando quieras.',
  },

  discover: {
    search: '¿Adónde vas?',
    clearSearch: 'Borrar el destino',
    searchTyped: (q) => `Buscar "${q}"`,
    undo: 'Recuperar a la última persona descartada',
    title: 'Descubrir',
    subtitle: 'Quién hay cerca, y la tarde que tienen en mente.',
    everyone: 'Todos',
    hosts: 'Anfitriones',
    guests: 'Viajeros',
    whoToShow: 'A quién quieres conocer',
    filters: 'Filtros',
    filtersLabel: (n) => (n === 1 ? 'Filtros, 1 activo' : `Filtros, ${n} activos`),
    emptyFiltered: 'Ahora mismo nadie encaja con todos. Prueba a quitar alguno.',
    empty: 'Ya has visto a todos los de por aquí. Vuelve pronto, o prueba otra ciudad.',
    changeFilters: 'Cambiar los filtros',
    openFilters: 'Abrir los filtros',
  },

  filters: {
    usualDays: 'Normalmente libres el',
    activityStyle: 'Tipo de planes',
    lifestyle: 'Qué ambiente',
    title: 'Filtros',
    clear: 'Borrar',
    showResults: 'Ver gente',
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
    moreReviews: 'Leer más reseñas',
    showInterest: 'Mostrar interés',
    unlock: 'Abrir el chat sin esperar',
  },

  chats: {
    title: 'Chats',
    empty: 'Aún no hay chats. Cuando los dos digáis que sí, todo empieza aquí.',
    sayHello: 'Saluda',
    unlocked: 'Desbloqueado',
    unread: (n) => (n === 1 ? '1 mensaje nuevo' : `${n} mensajes nuevos`),
  },

  requests: {
    title: 'Solicitudes',
    subtitle: 'Quieren conocerte. Di que sí y se abre el chat.',
    empty: 'Nadie espera tu respuesta.',
    count: (n) => (n === 1 ? '1 solicitud' : `${n} solicitudes`),
  },

  chat: {
    back: 'Volver a los chats',
    openProfile: (name) => `${name}, abrir su perfil`,
    conversation: 'Conversación',
    moreActions: 'Reseñar, denunciar o bloquear',
    empty: 'Aún no hay nada. Alguien tiene que saludar primero.',
    youSaid: (text) => `Has escrito: ${text}`,
    theySaid: (name, text) => `${name ?? 'La otra persona'} ha escrito: ${text}`,
    message: 'Escribe un mensaje',
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
      'No has bloqueado a nadie. Si algún día lo haces, aquí podrás deshacerlo.',
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
      'Gracias. Ya está en su perfil, donde la próxima persona la leerá antes de escribirle.',
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
      `Esto abre un chat con ${name} ahora, sin esperar a que te devuelva el interés.`,
    note: 'Pagas la presentación, y nada más. El tiempo que pasáis juntos nunca se paga, por ninguno de los dos.',
  },

  match: {
    dialog: (name) => `${name} y tú habéis dicho que sí`,
    headline: 'Los dos habéis dicho que sí',
    body: (name) => `El chat con ${name} está abierto, y nadie ha pagado por él.`,
    sayHello: 'Saludar',
    theirProfile: 'Su perfil',
    later: 'Ahora no',
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
      'El correo y la contraseña no coinciden. Tras 5 intentos fallidos, el acceso se pausa durante 15 minutos.',
    invalid_slot:
      'Cada franja de disponibilidad necesita un momento del día válido y una temporada que termine después de empezar.',
    moderator_only: 'Solo los moderadores pueden hacer esto.',
    no_exchange:
      'Solo puedes reseñar a alguien cuando los dos os habéis escrito en la misma conversación.',
    not_a_resolution: 'Una denuncia solo se puede cerrar como revisada o descartada.',
    not_an_image: 'Ese archivo no es una imagen legible.',
    rate_limited: 'Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.',
    registration_failed: 'No hemos podido crear tu cuenta. Revisa los datos e inténtalo de nuevo.',
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
