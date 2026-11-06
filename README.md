# freetree 🌲

> **Decentralized Linktree for Freenet & Delta**  
> Trasforma le pagine link di [Delta](https://github.com/freenet/delta) in profili linktree veloci, eleganti, responsive e condivisibili su rete Freenet.

---

## 🌟 Cos'è Freetree?

In **Delta** (l'app di publishing decentralizzato su Freenet), gli utenti creano pagine con elenchi di freesite, dApp, profili e risorse esterne usando Markdown:

- Screenshot 1: Il sito **Scobru On Freenet** (`7jEk1CQj7R`) con la pagina `Links` (sezioni _Delta_, _Freenet_, _Audio Tech_).
- Screenshot 2: Il sito **Ivvor's Delta** (`AnCVD9ZD3U`) con la pagina `Freesite Links` (sezioni _Social_, _Games_, _Tools_).

**Freetree** legge il Markdown di queste pagine Delta e le trasforma istantaneamente in un hub **stile Linktree**:

- **Pill capsule interattive** con hover lift e click reattivo
- **Icone intelligenti automatiche** (audio, P2P/Freenet, chat, giochi, codice, identità, blog, market)
- **Tasto opzioni `⋮`** per copiare direttamente il link negli appunti con feedback toast
- **Sezioni categorizzate** (`// delta`, `// freenet`, `// audio tech & strumenti`)
- **Doppio tema Chiaro / Scuro** con Space Mono typography
- **Routing URL via Hash**: ogni sito Delta ha il suo link diretto (es. `#7jEk1CQj7R` o `#AnCVD9ZD3U`)
- **Editor / Importatore Live**: incolla o modifica Markdown live in tempo reale
- **100% CSP-Compliant**: zero dipendenze CDN esterne, pronto per il sandbox gateway di Freenet

---

## 🚀 Come provarlo in locale

Puoi visualizzare Freetree in locale usando qualsiasi web server statico (Python, Node, o VS Code Live Server):

```bash
cd d:\freetree

# Con Python
python -m http.server 8085

# Oppure con Node / npx
npx serve . -p 8085
```

Apri nel browser:

- `http://localhost:8085/#scobru` — Carica il profilo di Scobru (`7jEk1CQj7R`)
- `http://localhost:8085/#ivvor` — Carica il profilo di Ivvor (`AnCVD9ZD3U`)
- `http://localhost:8085/#7jEk1CQj7R` — Risoluzione diretta per Delta Site Prefix

---

## 🌐 Pubblicazione su Freenet

Freetree si pubblica come sito web statico sul contratto **web container** di Freenet tramite `fdev website`. L'URL è permanente e gli aggiornamenti avvengono in-place:

### Windows (PowerShell)

```powershell
.\scripts\publish.ps1
```

### Linux / macOS (Bash)

```bash
chmod +x ./scripts/publish.sh
./scripts/publish.sh
```

Il comando esegue:

1. `fdev website init freetree` (genera la coppia di chiavi se non esiste già)
2. `fdev website publish . --key freetree` (pubblica il pacchetto sul nodo Freenet locale)

Freenet restituirà un URL del tipo:

```
http://127.0.0.1:7509/v1/contract/web/<FREETREE_KEY>/
```

---

## 📦 Struttura del Progetto

```
d:\freetree/
├── index.html            # Entry point HTML dell'app
├── css/
│   └── styles.css        # Stili completi (variabili CSS, temi, pills, layout)
├── js/
│   ├── app.js            # Controller principale, routing, toast, tema
│   ├── parser.js         # Parser Markdown Delta -> sezioni e pillole linktree
│   ├── icons.js          # Libreria icone SVG inline (zero asset esterni)
│   ├── presets.js        # Preset autentici (Scobru, Ivvor)
│   └── freenet.js        # Client WebSocket Freenet e decoder CBOR
├── scripts/
│   ├── publish.ps1       # Script PowerShell per fdev website
│   └── publish.sh        # Script Bash per fdev website
├── package.json          # Script npm
├── FREENET.md            # Specifiche tecniche per Freenet & Delta
└── README.md             # Questa documentazione
```

---

## 🎨 Formato Markdown supportato

Freetree riconosce la formattazione standard delle pagine Delta:

```markdown
# Titolo Pagina (opzionale)

## Categoria o Sezione

- [Nome Link](http://127.0.0.1:7509/v1/contract/web/.../) - Descrizione del servizio
- [Altro Servizio](https://...) - Altra descrizione
- [Link Semplice](freenet:...)

## Altra Categoria

- [Strumento Audio](https://...) — Descrizione con trattino lungo
- [[page_id|Titolo Pagina Interna Delta]]
```

Il parser estrae automaticamente:

1. Intestazioni (`#`, `##`, `###`) $\rightarrow$ Divisori di sezione `// nome`
2. Elementi di lista (`*`, `-`) $\rightarrow$ Pill Linktree con titolo, descrizione e URL
3. Riconoscimento intelligente delle icone in base a parole chiave (es. _audio_, _delta_, _chat_, _p2p_, _code_, _game_, _photo_, _market_)

---

## 📄 Licenza

MIT © Francesco Bruno (@scobru)
