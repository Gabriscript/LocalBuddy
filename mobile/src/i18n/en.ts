/// The source of truth for every word a member reads or hears. The other languages are typed
/// against this object, so a key added here and forgotten there fails `npm run typecheck`.
/// Plurals and interpolation are functions, because each language builds them its own way.
export const en = {
  common: {
    tryAgain: 'Try again',
    somethingWrong: 'Something went wrong.',
    goBack: 'Go back',
    close: 'Close',
    continue: 'Continue',
    finish: 'Finish',
    verifyIdentity: 'Verify your identity',
    verified: 'Verified',
    name: 'Name',
    city: 'City',
    email: 'Email',
    password: 'Password',
    iWantToBe: 'I want to be',
    photoOf: (name: string) => `Photo of ${name}`,
    yourPhoto: 'Your profile photo',
    hasCar: 'Has a car',
    pets: 'Pets',
    smokes: 'Smokes',
    canHostOvernight: 'Can host overnight',
    freeToday: 'Free today',
    waitingApproval: 'Waiting for approval',
    progress: 'Progress',
    stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
  },

  /// The role choice, as a chip.
  roles: { host: 'Host', guest: 'Traveller', entrambi: 'Both' },
  /// The role shown under a member's name, where "Both" on its own would say nothing.
  roleShown: { host: 'Host', guest: 'Traveller', entrambi: 'Host and traveller' },

  tabs: { discover: 'Discover', chats: 'Chats', me: 'Me' },

  timeOfDay: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' },

  days: { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' },

  activityStyle: { relaxed: 'Relaxed plans', adventurous: 'Adventurous plans' },

  lifestyle: { nightlife: 'Night life', family: 'Family life' },

  auth: {
    tagline: 'Meet someone who lives there.',
    signIn: 'Sign in',
    noAccount: 'New here? Register',
    haveAccount: 'Already a member? Sign in',
    signInFailed: "We couldn't sign you in. Try again in a moment.",
    createAccount: 'Create account',
    passwordHint: 'At least 8 characters: upper and lower case, a number and a symbol.',
    changeLater: 'You can switch any time.',
    registerFailed: "We couldn't create your account. Try again in a moment.",
  },

  onboarding: {
    aboutTitle: 'A bit about you',
    aboutSubtitle:
      'Short answers beat a long bio. They show a stranger what a day with you looks like.',
    photoTitle: 'Your face, your free time',
    photoSubtitle: 'People say yes to a face. Add a clear photo, and tell us when you are free.',
    changePhoto: 'Change photo',
    addPhoto: 'Add a photo',
    photoPrivacy: 'Your photo is stripped of location data before anyone sees it.',
    whenFree: 'When are you usually free?',
    pickTimes: 'Pick all that fit. Plans change, and so can these.',
    verifyTitle: "Verify it's you",
    verifySubtitle:
      'During the pilot, the LocalBuddy team confirms each identity by hand. Nobody can write to anyone without it, which keeps this a safe place to meet strangers.',
    verifyCta: 'Start the check',
    verifyPendingBody: 'Thanks! The LocalBuddy team will confirm your identity shortly.',
    listingTitle: 'What you can share',
    listingSubtitle: 'An afternoon out, a bed for the night, or both. You can change this later.',
    experience: 'An afternoon out',
    experienceHint: 'A walk, a meal, the bar you would take a friend to.',
    overnight: 'A bed for the night',
    overnightHint: 'A traveller stays the night in your home.',
    obligationsTitle: 'Hosting overnight comes with legal obligations',
    obligationRegistered:
      'I have checked what my country requires of someone hosting guests overnight, and I am in order (in Italy: Alloggiati Web with the Questura).',
    obligationCheck:
      "I will check each traveller's identity document in person on arrival. A remote check-in is not enough.",
    obligationSend: 'I will report my guests myself where the law asks for it.',
    cannotSend: 'LocalBuddy reminds you; it never files anything for you.',
    confirmAll: 'I confirm all three',
    chooseOne: 'Choose at least one to finish.',
  },

  profileFields: {
    style: 'Your style',
    usualDays: 'Usually free on',
    usualDaysHint: 'An indication, not a promise: you agree the real day in the chat.',
    activityStyle: 'Your plans are mostly',
    lifestyle: 'You lean towards',
    both: 'A bit of both',
    whatWeDo: 'What would we do together?',
    whatWeDoHint: 'A walk through your neighbourhood, a market you love, the bar only locals know.',
    whyHost: 'Why do you host?',
    languages: 'Languages you speak',
    languagesHint: 'For example: Italian, English, a little Spanish.',
    facts: 'The practical bits',
    haveCar: 'I have a car',
    liftHint: 'If you like, you can offer guests a lift — always free.',
    smoke: 'I smoke',
    havePets: 'I have pets',
    visible: 'Visible to people without an account',
    visibleHint: 'Off: only LocalBuddy members can see your profile. You can change this at any time.',
  },

  discover: {
    search: 'Where are you going?',
    clearSearch: 'Clear the destination',
    searchTyped: (q: string) => `Search "${q}"`,
    inTown: 'In town now',
    arriving: 'Arriving',
    residents: 'Lives here',
    undo: 'Bring back the last person you passed',
    title: 'Discover',
    subtitle: "Who's nearby, and the afternoon they have in mind.",
    everyone: 'Everyone',
    hosts: 'Hosts',
    guests: 'Travellers',
    whoToShow: 'Who you want to meet',
    filters: 'Filters',
    filtersLabel: (n: number) => `Filters, ${n} active`,
    emptyFiltered: 'Nobody fits all of these right now. Try loosening one.',
    empty: 'You have seen everyone nearby. Check back soon, or try another city.',
    changeFilters: 'Change the filters',
    openFilters: 'Open the filters',
  },

  filters: {
    usualDays: 'Usually free on',
    activityStyle: 'Kind of plans',
    lifestyle: 'Their scene',
    title: 'Filters',
    clear: 'Clear',
    showResults: 'Show people',
    whenFree: "When they're free",
    hasPets: 'Has pets',
    any: 'Any',
    yes: 'Yes',
    no: 'No',
  },

  /// The parts of a discovery card's accessible label, read out as one sentence.
  profileCard: {
    verified: 'verified',
    inTown: 'In town now',
    arriving: (date: string) => `Arriving ${date}`,
    rated: (rating: string) => `rated ${rating}`,
    hasCar: 'has a car',
    hasPets: 'has pets',
    smokes: 'smokes',
    openHint: 'Opens the full profile',
    passOn: (name: string) => `Pass on ${name}`,
    interestIn: (name: string) => `Show interest in ${name}`,
  },

  profile: {
    reportOrBlock: 'Report or block',
    anotherPhotoOf: (name: string) => `Another photo of ${name}`,
    rating: (rating: string) => `${rating} rating`,
    whatWeDo: "What we'll do",
    whyHost: 'Why I host',
    languages: 'Languages',
    reviews: 'What people say',
    ratedOutOf5: (n: number) => `Rated ${n} out of 5`,
    moreReviews: 'Read more reviews',
    showInterest: 'Show interest',
    unlock: 'Skip the wait and unlock the chat',
  },

  chats: {
    title: 'Chats',
    empty: 'No chats yet. When you both say yes, this is where it starts.',
    sayHello: 'Say hello',
    unlocked: 'Unlocked',
    unread: (n: number) => (n === 1 ? '1 new message' : `${n} new messages`),
  },

  requests: {
    title: 'Requests',
    subtitle: "They'd like to meet you. Say yes back and the chat opens.",
    empty: 'Nobody is waiting for your answer.',
    count: (n: number) => (n === 1 ? '1 request' : `${n} requests`),
  },

  chat: {
    back: 'Back to chats',
    openProfile: (name: string) => `${name}, open their profile`,
    conversation: 'Conversation',
    moreActions: 'Review, report or block',
    empty: 'Nothing here yet. Someone has to say hello first.',
    youSaid: (text: string) => `You said: ${text}`,
    /// The name is missing until the other member's profile has loaded.
    theySaid: (name: string | undefined, text: string) => `${name ?? 'They'} said: ${text}`,
    message: 'Write a message',
    send: 'Send message',
  },

  /// The Android notification channel, as the phone's settings list it.
  push: { channel: 'Requests and messages' },
  me: {
    notVerified: 'Not verified yet',
    freeTodayHint: 'Show that you are up for a meeting until midnight.',
    credits: (n: number) => (n === 1 ? '1 credit' : `${n} credits`),
    editProfile: 'Edit profile',
    blocked: 'Blocked members',
    trips: 'My trips',
    signOut: 'Sign out',
    language: 'Language',
    languageRow: (value: string) => `Language: ${value}`,
  },

  language: {
    /// Followed by the language the phone resolves to, in that language's own name.
    phone: (name: string) => `Phone language (${name})`,
  },

  trips: {
    title: 'My trips',
    subtitle: 'Tell people when you will be in a city. They see you as arriving, or in town now.',
    empty: 'No upcoming trips yet.',
    add: 'Add a trip',
    pickCity: 'Pick a city from the list.',
    from: 'From (YYYY-MM-DD)',
    to: 'To (YYYY-MM-DD)',
    badDate: 'Use the format YYYY-MM-DD, for example 2026-12-12.',
    dateOrder: 'The end date cannot be before the start date.',
    dateOver: 'Choose dates from today onwards.',
    save: 'Add trip',
    remove: (city: string) => `Remove the trip to ${city}`,
  },

  blocked: {
    title: 'Blocked members',
    empty:
      'You have not blocked anyone. If you ever do, this is where you can undo it.',
    unblock: 'Unblock',
  },

  editProfile: {
    title: 'Edit profile',
    save: 'Save changes',
  },

  safety: {
    report: (name: string) => `Report ${name}`,
    block: (name: string) => `Block ${name}`,
    sent: 'Report sent',
    sendReport: 'Send report',
    sentBody:
      'Thank you. A moderator reads every report. You will not hear back about this one, and nobody is told who sent it.',
    whatHappened: 'What happened?',
    whatHappenedHint: 'Write it as you would tell a person. A moderator reads this, not a machine.',
    reportNotBlock:
      'Reporting does not block anyone. If you also want them gone from your feed and your inbox, block them.',
    cancel: 'Cancel',
    blockAction: 'Block',
    blockBody: (name: string) =>
      `${name} will not see your profile and you will not see theirs. Any conversation between you closes in both directions.`,
    undoLater: 'You can undo this later from Blocked members, in your own profile.',
    leaveReview: 'Leave a review',
  },

  review: {
    sent: 'Review sent',
    sentBody:
      'Thank you. It is on their profile now, where the next person will read it before getting in touch.',
    title: (name: string) => `Review ${name}`,
    send: 'Send review',
    howWasIt: 'How was it?',
    rating: 'Rating',
    stars: (n: number) => (n === 1 ? '1 star' : `${n} stars`),
    comment: 'Anything to add?',
    commentHint:
      'Optional. It stays on their profile, so write what the next person would want to know.',
  },

  unlock: {
    title: 'Unlock the chat',
    checking: 'Checking what this costs you.',
    subscription: 'Your subscription covers it, with nothing more to pay.',
    credits: (have: number, cost: number) =>
      `You have ${have} ${have === 1 ? 'credit' : 'credits'} from hosting. This uses ${cost}.`,
    money: (price: string) => `${price}, once, for this one person.`,
    ctaSubscription: 'Open the chat',
    ctaCredits: (n: number) => (n === 1 ? 'Use 1 credit' : `Use ${n} credits`),
    ctaMoney: (price: string) => `Pay ${price}`,
    body: (name: string) =>
      `This opens a chat with ${name} now, without waiting for them to show interest back.`,
    note: 'It pays for the introduction, and for nothing else. The time you spend together is never paid for, by either of you.',
  },

  match: {
    dialog: (name: string) => `You and ${name} both said yes`,
    headline: 'You both said yes',
    body: (name: string) => `The chat with ${name} is open, and nobody paid for it.`,
    sayHello: 'Say hello',
    theirProfile: 'Their profile',
    later: 'Not now',
  },

  skeleton: {
    profiles: 'Loading profiles',
    conversations: 'Loading conversations',
    /// One is shown, picked at random, under the feed's skeleton. None may suggest paying or
    /// being paid (GUIDELINES §2).
    tips: [
      'Meet somewhere public the first time.',
      'Answer requests, even with a no. Silence is the worst answer.',
      'Tell your host about allergies or pets before you meet.',
      'Nobody pays anybody on LocalBuddy, and nobody should ask.',
      'Keep plans in the chat until you meet.',
      'Share your plans with a friend before you go.',
      'Ask for the coffee locals drink, not the tourist one.',
      'A market in the morning beats a museum queue.',
      'Got a car? You might offer a lift. It is always free.',
      'Ask your host for the place they would take their own friends.',
      'Say what you would love to see. Hosts like a hint.',
      'Say yes to the small plan: a walk often beats a big itinerary.',
    ],
  },

  field: {
    showPassword: 'Show password',
    hidePassword: 'Hide password',
  },

  /// One entry per `code` the API can send (ADR-0008). The server's own `detail` is English and
  /// is shown only for a code that is not listed here.
  errors: {
    account_banned: 'This account is suspended and can no longer use LocalBuddy.',
    account_not_found: 'This account no longer exists.',
    already_responded: 'You have already responded to this profile.',
    already_reviewed: 'You have already reviewed this member.',
    already_subscribed: 'You already have an active subscription.',
    blocked: 'This member is not reachable.',
    compliance_not_acknowledged: 'To offer a place to stay, first confirm the three legal obligations.',
    empty_file: 'The file you chose is empty.',
    empty_message: 'A message cannot be empty.',
    file_too_large: 'Photos must be 10 MB or smaller.',
    home_photo_not_allowed: 'Home photos are only for hosts who offer a place to stay.',
    identity_verification_required: 'Verify your identity before contacting other members.',
    invalid_free_until: 'Free today can last at most 24 hours from now.',
    image_too_large: 'That image has too many pixels. Photos from a phone camera are fine.',
    invalid_credentials:
      "That email and password don't match. After 5 wrong attempts, signing in pauses for 15 minutes.",
    invalid_slot:
      'Each availability slot needs a known time of day, and a season that ends after it starts.',
    moderator_only: 'Only moderators can do this.',
    no_exchange: 'You can review someone only after you have both written in the same conversation.',
    not_a_resolution: 'A report can only be closed as reviewed or dismissed.',
    not_an_image: 'That file is not a readable image.',
    rate_limited: 'Too many tries in a row. Wait a minute and try again.',
    registration_failed: "We couldn't create your account. Check your details and try again.",
    self_target: 'You cannot do that to your own profile.',
    target_not_verified:
      'This member has not verified their identity yet, so the chat cannot be unlocked.',
    too_many_photos: 'You can have at most 12 photos. Remove one to add another.',
    too_many_slots: 'You can choose at most 20 availability slots.',
    invalid_city: 'Choose a city for the trip.',
    invalid_dates: 'Check the dates: use real days, and the end cannot come before the start.',
    too_many_trips: 'You can have at most 5 upcoming trips. Remove one to add another.',
    trip_over: 'That trip is already over. Choose dates from today onwards.',
    trip_home_city: "That's the city you live in — add trips to places you're visiting.",
    trip_too_far: 'A trip can start at most a year from now.',
    trip_too_long: 'A trip can last at most 30 days.',
    under_age: 'You must be 18 or older to use LocalBuddy.',
    unknown_plan: 'That subscription plan does not exist. Choose monthly or yearly.',
    weak_password:
      'Check the email address, and use a password of at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.',
  },
};

export type Strings = typeof en;
