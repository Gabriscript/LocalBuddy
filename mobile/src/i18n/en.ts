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
    progress: 'Progress',
    stepOf: (step: number, total: number) => `Step ${step} of ${total}`,
  },

  /// The role choice, as a chip.
  roles: { host: 'Host', guest: 'Guest', entrambi: 'Both' },
  /// The role shown under a member's name, where "Both" on its own would say nothing.
  roleShown: { host: 'Host', guest: 'Guest', entrambi: 'Host and guest' },

  tabs: { discover: 'Discover', chats: 'Chats', me: 'Me' },

  timeOfDay: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening', night: 'Night' },

  auth: {
    tagline: 'Meet locals. Share cultures.',
    signIn: 'Sign in',
    noAccount: 'No account yet? Register',
    haveAccount: 'Already have an account? Sign in',
    signInFailed: 'Could not sign in. Check your connection.',
    createAccount: 'Create account',
    passwordHint: 'At least 8 characters.',
    changeLater: 'You can change this later.',
    registerFailed: 'Could not register. Check your connection.',
  },

  onboarding: {
    aboutTitle: 'About you',
    aboutSubtitle:
      'A few short answers do more than a long bio: they tell a stranger what a day with you looks like.',
    photoTitle: 'Your photo and your time',
    photoSubtitle: 'A clear photo of your face, and when you are usually free.',
    changePhoto: 'Change photo',
    addPhoto: 'Add a photo',
    photoPrivacy: 'Your photo is stripped of location data before anyone sees it.',
    whenFree: 'When are you usually free?',
    pickTimes: 'Pick as many as fit. You can change them later.',
    verifyTitle: "Verify it's you",
    verifySubtitle:
      'A quick document check, once. Nobody can contact another member without it, which is what keeps this a place for meeting strangers safely.',
    verifyCta: 'Start verification',
    listingTitle: 'What you offer',
    listingSubtitle: 'An afternoon out, a place to stay, or both. You can change this later.',
    experience: 'An experience',
    experienceHint: 'Showing someone your city: a walk, a meal, an afternoon.',
    overnight: 'A place to stay',
    overnightHint: 'Hosting someone overnight in your home.',
    obligationsTitle: 'Hosting overnight comes with legal obligations',
    obligationRegistered: 'I am registered on the Alloggiati Web portal with my local Questura.',
    obligationCheck:
      "I will check each guest's identity document in person on arrival. A remote check-in is not enough.",
    obligationSend:
      "I will send each guest's details within 24 hours of arrival, or within 6 hours for stays shorter than a day.",
    cannotSend: 'LocalBuddy cannot send these details for you: it takes your own Questura login.',
    confirmAll: 'I confirm all three',
    chooseOne: 'Choose at least one to finish.',
  },

  profileFields: {
    whatWeDo: 'What would we do together?',
    whatWeDoHint: 'A walk through your neighbourhood, a market you love, the bar only locals know.',
    whyHost: 'Why do you host?',
    languages: 'Languages you speak',
    languagesHint: 'For example: Italian, English, a little Spanish.',
    facts: 'A few facts',
    haveCar: 'I have a car',
    smoke: 'I smoke',
    havePets: 'I have pets',
    visible: 'Visible to people without an account',
    visibleHint: 'Off: only LocalBuddy members can see your profile. You can change this at any time.',
  },

  discover: {
    title: 'Discover',
    subtitle: 'People near you who want to show you their city.',
    everyone: 'Everyone',
    hosts: 'Hosts',
    guests: 'Travellers',
    whoToShow: 'Who to show',
    filters: 'Filters',
    filtersLabel: (n: number) => `Filters, ${n} active`,
    emptyFiltered: 'Nobody matches these filters right now.',
    empty: 'Nobody new here right now. Come back later, or look at another city.',
    changeFilters: 'Change the filters',
    openFilters: 'Open the filters',
  },

  filters: {
    title: 'Filters',
    clear: 'Clear',
    showResults: 'Show results',
    anywhere: 'Anywhere',
    whenFree: 'When they are free',
    hasPets: 'Has pets',
    any: 'Any',
    yes: 'Yes',
    no: 'No',
  },

  /// The parts of a discovery card's accessible label, read out as one sentence.
  profileCard: {
    verified: 'verified',
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
    moreReviews: 'More reviews',
    showInterest: 'Show interest',
    unlock: 'Unlock the chat without a match',
  },

  chats: {
    title: 'Chats',
    empty: 'No conversations yet. A chat opens when interest is mutual.',
    sayHello: 'Say hello',
    unlocked: 'Unlocked',
  },

  chat: {
    back: 'Back to chats',
    openProfile: (name: string) => `${name}, open their profile`,
    conversation: 'Conversation',
    moreActions: 'Review, report or block',
    empty: 'No messages yet. Say hello.',
    youSaid: (text: string) => `You said: ${text}`,
    /// The name is missing until the other member's profile has loaded.
    theySaid: (name: string | undefined, text: string) => `${name ?? 'They'} said: ${text}`,
    message: 'Message',
    send: 'Send message',
  },

  me: {
    notVerified: 'Not verified yet',
    credits: (n: number) => (n === 1 ? '1 credit' : `${n} credits`),
    editProfile: 'Edit profile',
    blocked: 'Blocked members',
    signOut: 'Sign out',
    language: 'Language',
    languageRow: (value: string) => `Language: ${value}`,
  },

  language: {
    /// Followed by the language the phone resolves to, in that language's own name.
    phone: (name: string) => `Phone language (${name})`,
  },

  blocked: {
    title: 'Blocked members',
    empty:
      'Nobody is blocked. Blocking hides two people from each other, and this is where it can be undone.',
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
      'Thank you. It is on their profile now, and it counts towards what other people see before they get in touch.',
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
      `This opens a conversation with ${name} straight away, instead of waiting for them to show interest back.`,
    note: 'It pays for the introduction, and for nothing else. The time you spend together is never paid for, by either of you.',
  },

  match: {
    dialog: (name: string) => `You and ${name} both said yes`,
    headline: 'You both said yes',
    body: (name: string) => `The chat with ${name} is open, and nobody paid for it.`,
    sayHello: 'Say hello',
    theirProfile: 'Their profile',
    later: 'Later',
  },

  skeleton: {
    profiles: 'Loading profiles',
    conversations: 'Loading conversations',
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
    image_too_large: 'That image has too many pixels. Photos from a phone camera are fine.',
    invalid_credentials:
      'The email or the password is not right. After 5 wrong attempts, signing in is paused for 15 minutes.',
    invalid_slot:
      'Each availability slot needs a known time of day, and a season that ends after it starts.',
    moderator_only: 'Only moderators can do this.',
    no_exchange: 'You can review someone only after you have both written in the same conversation.',
    not_a_resolution: 'A report can only be closed as reviewed or dismissed.',
    not_an_image: 'That file is not a readable image.',
    rate_limited: 'Too many requests. Wait a minute and try again.',
    registration_failed: 'Registration could not be completed.',
    self_target: 'You cannot do that to your own profile.',
    target_not_verified:
      'This member has not verified their identity yet, so the chat cannot be unlocked.',
    too_many_photos: 'You can have at most 12 photos. Remove one to add another.',
    too_many_slots: 'You can choose at most 20 availability slots.',
    under_age: 'You must be 18 or older to use LocalBuddy.',
    unknown_plan: 'That subscription plan does not exist. Choose monthly or yearly.',
    weak_password:
      'Check the email address, and use a password of at least 8 characters with an uppercase letter, a lowercase letter, a number and a symbol.',
  },
};

export type Strings = typeof en;
