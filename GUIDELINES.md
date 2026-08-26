# Modello — LocalBuddy (nome di lavoro provvisorio)

## 1. Visione

Un'app che mette in contatto persone che vogliono vivere l'esperienza autentica di un luogo con locali disposti a mostrarglielo — il bar con la parola segreta, il vino servito dal muro, il ristorante che non fa menù turistico. Non un servizio di guida a pagamento: uno scambio culturale reciproco, sullo stesso principio di modelli già esistenti e consolidati da anni come Servas International (dal 1949) e le prime versioni di Couchsurfing.

## 2. Principio cardine (non negoziabile)

**Zero pagamento per l'esperienza in sé.**

Questo è il vincolo che rende l'intero modello legalmente sostenibile in Italia. Nessuna mancia attesa, nessun "regalo simbolico" incoraggiato dalla piattaforma. Se anche solo la possibilità implicita di un compenso per l'esperienza si insinua nel prodotto, si rientra nella normativa sulle guide turistiche/accompagnatori (L. 190/2023) — sanzioni da 3.000 a 15.000€, sia per l'host che per la piattaforma come intermediario.

Ogni decisione di prodotto va misurata contro questo principio prima di essere implementata.

## 3. Come funziona (utente finale)

- Due ruoli intercambiabili: **host** (mostra la propria città) e **traveler** (in visita)
- Ogni utente può ricoprire entrambi i ruoli, anche nella stessa settimana
- **Nessun obbligo di reciprocità**: essere ospitati/accompagnati non richiede di ricambiare con la stessa persona né entro un tempo fissato — un utente può usare la piattaforma solo per essere ospitato, o solo per ospitare, senza che questo comprometta l'accesso
- Profilo pubblico gratuito, visibile a tutti: nome (senza cognome), città, foto della casa/del quartiere (se l'host offre anche pernottamento), lingue parlate, breve bio, cosa si può fare insieme
- Il contatto diretto è **bloccato di default**, si sblocca in due modi alternativi:
  - **Gratis, via match reciproco** (modello "Tinder"): entrambe le parti esprimono interesse, solo dopo il match si apre la chat
  - **A pagamento, una tantum**: si salta il match e si contatta direttamente, pagando una fee una tantum per quel singolo contatto

## 4. Modello di monetizzazione

| Cosa | Gratis | A pagamento |
|---|---|---|
| Vedere profili (nome, città, foto, lingue, bio) | ✅ | — |
| Contattare via match reciproco | ✅ | — |
| Contattare direttamente, senza aspettare il match | — | ✅ (fee una tantum, singolo utente) |
| Contattare chiunque senza limiti | — | ✅ (abbonamento mensile/annuale) |

Nessuna commissione sullo scambio in sé — non ci sarebbe nulla su cui prenderla, dato che lo scambio è gratuito per principio. Il ricavo della piattaforma viene solo dallo sblocco contatti, mai da quello che accade tra le due persone dopo essersi messe in contatto.

**Incentivo (non obbligo) a ospitare**: invece di penalizzare chi non ricambia, conviene premiare positivamente chi ospita — ad esempio accumulando crediti interni spendibili per sbloccare contatti gratis (alternativa al pagamento one-time), o ottenendo maggiore visibilità del profilo. Nessuna sanzione per chi non dà mai ospitalità, solo vantaggi extra per chi lo fa spesso.

## 5. Funzionalità disponibili per l'host

**Esperienza / giro in città** — funzionalità base, disponibile a tutti gli host, nessun requisito oltre alla verifica identità standard. Il traveler può restare ospitato altrove (hotel, altro host, struttura propria) — chi offre solo questa funzionalità non ha alcun obbligo TULPS, che riguarda esclusivamente chi fornisce anche pernottamento. Le due funzionalità sono completamente disaccoppiate: un host può offrire solo l'una, solo l'altra, o entrambe.

**Pernottamento (opzionale, da attivare)** — voce extra tra le cose che un host può offrire. Per attivarla, l'host deve confermare esplicitamente (checkbox, non automatico) di:
- Essere registrato sul portale Alloggiati Web con la propria Questura
- Aver compreso l'obbligo di verificare di persona il documento d'identità dell'ospite all'arrivo (i check-in da remoto non bastano per legge)
- Aver compreso l'obbligo di invio dati entro 24h dall'arrivo (o 6h se il soggiorno è inferiore alle 24h)

La piattaforma può mandare un promemoria quando un soggiorno viene confermato ("ricordati di registrare i dati entro 24h"), ma **non può inviare la comunicazione al posto dell'host** — serve il login personale di ogni singolo host con la propria Questura, non è centralizzabile.

## 6. Cosa la piattaforma NON deve fare

- **Non promettere di "segnalare alle autorità"** chi scambia denaro privatamente fuori dall'app — non è verificabile, e in caso di controllo dimostra solo che eri consapevole del rischio senza aver fatto nulla di concreto
- **Non penalizzare economicamente** (multe) chi non ricambia l'ospitalità ricevuta — rischio concreto di clausola vessatoria secondo il Codice del Consumo. L'inattività reciproca può ridurre la visibilità del profilo o portare a rimozione dell'account, mai a una multa
- **Non promettere di gestire** le comunicazioni Alloggiati Web per conto degli host — non è tecnicamente possibile, richiede credenziali personali per Questura

## 7. Scope MVP — cosa costruire per primo

**Fase 1 (consigliata per partire)**: solo scambio esperienza/giro in città, senza pernottamento. Onboarding più leggero, zero complessità TULPS da gestire subito, permette di validare se il format piace davvero prima di aggiungere un pezzo normativo in più.

**Scope geografico**: host registrabili solo in Italia all'inizio (unico paese di cui è stata verificata la normativa), traveler di qualsiasi nazionalità. L'apertura a host in altri paesi richiede la stessa ricerca normativa fatta per l'Italia, ripetuta paese per paese — non va assunta equivalente.

**Fase 2**: aggiungere il toggle pernottamento con il flusso di conferma descritto al punto 5.

*Questa fasatura è ancora una proposta, non una decisione presa — da confermare prima di iniziare a costruire.*

## 8. Domande da portare all'avvocato prima del lancio

1. Il modello a zero-pagamento per l'esperienza esclude davvero la responsabilità personale dell'host come "guida turistica abusiva"?
2. La piattaforma, facendo pagare solo lo sblocco contatti (non l'esperienza in sé), rischia comunque di essere classificata come "intermediario turistico" ai sensi della L. 190/2023?
3. Come formulare correttamente i Termini di Servizio per il principio "scambio non commerciale", in modo che reggano legalmente e non solo come dichiarazione d'intenti
4. Verifica delle clausole lato consumatore nei ToS (niente penali per non-reciprocità, corretta gestione dati identità per Alloggiati Web)
5. Se in futuro si espande oltre l'Italia: verificare la normativa equivalente paese per paese — non assumere che il modello italiano si applichi ovunque

## 9. Feature list — MVP v1

### Registrazione e profilo
- Registrazione utente
- Ruolo: host, guest, o entrambi — modificabile in ogni momento
- Bio libera: descrizione di sé, cosa piace fare, cosa può mostrare
- Disponibilità dichiarata direttamente per fascia oraria (mattina/pomeriggio/sera/notte) — non dedotta dal lavoro svolto; il lavoro/professione non va raccolto come campo, aggiunge dato personale senza reale beneficio
- Disponibilità nel calendario (periodo dell'anno)
- Tratti/preferenze: ha auto, fuma, ha animali
- Foto profilo
- Foto casa/quartiere, solo se pernottamento attivo — da ripulire dai metadati EXIF (geolocalizzazione dello scatto) prima della pubblicazione
- Verifica identità documento tramite servizio esterno (es. Stripe Identity, Veriff, Onfido) — la piattaforma non deve mai conservare o vedere l'immagine del documento, solo l'esito "verificato: sì/no"
- Verifica età 18+ obbligatoria, ricavabile dallo stesso step di verifica documento

### Trust & safety (assente dalla lista iniziale, necessario)
- Recensioni/valutazioni reciproche dopo ogni scambio
- Segnalazione utente
- Blocco utente
- Chat interna per la comunicazione — non rivelare telefono/email reali, per motivi di sicurezza (possibilità di moderare/bannare) e di modello di guadagno (l'accesso sbloccato resta dentro la piattaforma, non aggirabile una volta pagato)

### Matching e monetizzazione
- Filtri di ricerca: città, tipo di servizio (solo esperienza / con pernottamento), ruolo (host/guest/entrambi), fascia oraria, caratteristiche (auto, animali, fumo) — per auto/animali/fumo valutare in fase di design se serve un terzo stato "nessuna preferenza" oltre a sì/no, altrimenti si esclude chi è indifferente
- Match reciproco stile Tinder (swipe)
- Sblocco chat diretta: pagamento una tantum per singolo utente
- Abbonamento mensile/annuale per chat illimitata con chiunque

### Dietro le quinte (non visibile all'utente, ma necessario)
- Cancellazione account e dati su richiesta (obbligo GDPR)
- Integrazione pagamenti (es. Stripe — gestisce sia il pagamento one-time che l'abbonamento ricorrente in un solo fornitore)

## 10. Schema database — entità principali

```
USERS
  id, email, name, city, role (host/guest/entrambi)
  identity_verified, age_verified (via servizio esterno tipo Stripe Identity)
  credits_balance (crediti guadagnati ospitando, spendibili per sbloccare contatti)

AVAILABILITY
  user_id -> USERS
  time_of_day (mattina/pomeriggio/sera/notte), season_start, season_end

PHOTOS
  user_id -> USERS
  type (profilo/casa), url — foto casa ripulite da metadati EXIF prima dell'upload

LISTINGS
  user_id -> USERS
  offers_experience, offers_overnight
  overnight_compliance_ack (checkbox: registrato Alloggiati Web + obblighi compresi)

MATCHES
  user_a_id -> USERS, user_b_id -> USERS
  status, matched_at

CONVERSATIONS
  match_id -> MATCHES
  unlocked_by_payment (true se sbloccata a pagamento invece che da match reciproco)

MESSAGES
  conversation_id -> CONVERSATIONS, sender_id -> USERS
  content, sent_at

PAYMENTS
  user_id -> USERS
  type (one-time/abbonamento), amount, stripe_id, created_at

SUBSCRIPTIONS
  user_id -> USERS
  plan_type, status, expires_at

REVIEWS
  author_id -> USERS, subject_id -> USERS
  rating, comment

REPORTS
  reporter_id -> USERS, reported_id -> USERS
  reason, status
```

Non ancora incluso, da definire in fase di implementazione: tabella separata per lingue parlate (se un utente ne indica più di una), indici e vincoli di unicità, eventuale storico dettagliato dei crediti (per ora solo un saldo aggregato su USERS).

## 11. Schermate — descrizione testuale (per Claude Code o un designer)

Nessuna delle schermate seguenti è ancora un asset grafico salvato — sono state solo visualizzate come bozza in conversazione. Le descrizioni sotto bastano per ricostruirle da zero in fase di sviluppo.

### 11.1 Onboarding (5 step in sequenza)
1. **Registrazione**: email + dati base
2. **Verifica identità**: upload documento tramite servizio esterno (Stripe Identity o simile), da cui si ricava anche la conferma età 18+
3. **Scelta ruolo**: host, guest, o entrambi — modificabile in seguito
4. **Creazione profilo**: bio libera, foto profilo, disponibilità (fascia oraria + periodo dell'anno), tratti (auto/fuma/animali)
5. **Configurazione annuncio** (solo se ruolo host): attiva "esperienza" e/o "pernottamento"; se pernottamento, mostra il checkbox di conferma obblighi TULPS/Alloggiati Web prima di poter attivare l'opzione

### 11.2 Scoperta profili
Card singola per profilo, in sequenza (non necessariamente swipe): foto, nome + città, badge "verificato", bio breve, tag/badge per fascia oraria disponibile, tratti (auto/animali/pernottamento se applicabile). Tre azioni possibili su ogni profilo:
- **Rifiuta** — passa al successivo, nessun costo
- **Sblocca a pagamento** — salta il match, va dritto a un flusso di pagamento (one-time o abbonamento) per aprire la chat con quella persona
- **Mostra interesse** — gratuito, apre la chat solo se anche l'altra persona mostra interesse a sua volta (match reciproco)

Nota di design da verificare in fase utente: l'azione "sblocca a pagamento" va probabilmente separata visivamente dalle altre due (es. dentro il profilo espanso, non nella card veloce) per evitare tap accidentali durante lo scorrimento.

### 11.3 Filtri di ricerca
Pannello con: campo città (testo libero), tipo di servizio cercato (solo esperienza / con pernottamento), ruolo cercato (solo host / solo guest / entrambi), fascia oraria (mattina/pomeriggio/sera/notte, multi-selezione), caratteristiche (ha auto / ha animali / fuma). Da valutare in fase di design: per auto/animali/fumo, un terzo stato "nessuna preferenza" oltre a sì/no, per non escludere chi è indifferente al criterio.

### 11.4 Ancora da abbozzare
Profilo espanso (vista dettagliata di un singolo utente), schermata di chat, flusso di pagamento (one-time vs abbonamento), schermata recensioni post-scambio, pannello segnalazione/blocco utente.

## 12. Stack tecnico e ordine di costruzione

**Backend**: C#, ASP.NET Core, EF Core, PostgreSQL — stack già noto, nessun cambiamento.

**Frontend/mobile**: React Native, scelto sia per la vicinanza a HTML/CSS/JS (più familiare del previsto) sia perché è una competenza spendibile nel percorso di ricerca lavoro in corso. La logica dei componenti si trasferisce quasi interamente tra web (React) e mobile (React Native), nel caso in futuro serva anche una versione web.

**Ambiente locale**: repository Git dedicato, Docker Compose per Postgres in locale (coerente con l'uso di Docker già presente nello stack abituale).

**Ordine di costruzione consigliato** (pensato per imparare in sequenza, non per completezza):
1. Setup repo + Docker Compose Postgres + progetto ASP.NET Core base
2. Autenticazione utente (registrazione, login)
3. Schema database base (tabella USERS) + CRUD profilo
4. Upload foto (profilo, poi casa con pulizia EXIF)
5. Verifica identità (integrazione servizio esterno)
6. Filtri di ricerca + lista/scoperta profili
7. Match reciproco (tabella MATCHES)
8. Chat interna (CONVERSATIONS + MESSAGES)
9. Pagamenti — one-time e abbonamento (integrazione Stripe)
10. Recensioni, segnalazioni, blocco utente
11. Pernottamento: toggle annuncio + checkbox compliance TULPS

Sequenza pensata per costruire ogni pezzo sopra fondamenta già funzionanti — evita, ad esempio, di arrivare ai pagamenti prima di avere utenti veri da far pagare.
