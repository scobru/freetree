# Freetree 🌲

> **Decentralized Linktree for Freenet**  
> Accedi con [Viso](https://github.com/scobru/viso), scrivi i tuoi link in Markdown e ottieni un profilo linktree veloce, elegante e condivisibile su rete Freenet.

---

## 🌟 Cos'è Freetree?

Accedi con la tua persona **Viso**, scrivi i tuoi link in Markdown e Freetree li trasforma in un hub **stile Linktree**:

- **Pill capsule interattive** con hover lift e click reattivo
- **Icone intelligenti automatiche** (audio, P2P/Freenet, chat, giochi, codice, identità, blog, market)
- **Tasto opzioni `⋮`** per copiare direttamente il link negli appunti con feedback toast
- **Sezioni categorizzate** (`// freenet`, `// audio tech & strumenti`)
- **Doppio tema Chiaro / Scuro** con Space Mono typography
- **Condivisione via link**: `Export` genera un link `#data=…` portabile con tutto l'albero
- **Create / Import, senza account**: dallo stato iniziale (o dal bottone `Edit`) crei un albero scrivendo i link in Markdown, oppure importi un link Freetree (`#data=…`) o del Markdown: finisci nell'editor con una copia da rivedere. Chi ha il link può modificarlo (albero "local"); `Export` dà il link da conservare
- **Sign in with Viso + My tree**: accedi con la tua persona [Viso](https://github.com/scobru/viso) (firma Ed25519 verificata in WebCrypto) e crea il tuo linktree scrivendo i link in Markdown (nessun import da altri servizi). CRUD completo: crea/modifica (testo o "Add a link"), leggi, elimina un link o l'intero albero. Salvato in `localStorage` per chiave pubblica (se il sandbox lo consente); `Export` produce sempre un link portabile. Se apri il link di un albero creato con la tua persona (`#data=…`) e fai *Sign in with Viso*, la pagina resta e diventa modificabile (bottone `Viso · …`); dopo il salvataggio l'URL si aggiorna con le modifiche
- **Salvataggio su Freenet** (con Viso): l'albero è anche in un contratto log (`log.wasm` di Radica, nessun contratto nuovo), firmato con la chiave app che Viso deriva per Freetree (`key=v1`) e delegata dalla tua persona. Riaprendo Freetree dopo il login l'albero si carica da lì, senza link. Senza nodo, delegato o chiave app tutto ricade sul link `#data=`. Dettagli in [FREENET.md](FREENET.md)
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

Apri `http://localhost:8085/`, poi **Viso** → *Sign in with Viso*.

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
│   ├── bundle.js         # App: parser Markdown, UI, routing, tema, export
│   └── viso.js           # Sign in with Viso + My tree (CRUD)
├── scripts/
│   ├── publish.ps1       # Script PowerShell per fdev website
│   └── publish.sh        # Script Bash per fdev website
├── package.json          # Script npm
├── FREENET.md            # Specifiche tecniche per Freenet
└── README.md             # Questa documentazione
```

---

## 🎨 Formato Markdown supportato

Formato Markdown:

```markdown
# Titolo Pagina (opzionale)

## Categoria o Sezione

- [Nome Link](http://127.0.0.1:7509/v1/contract/web/.../) - Descrizione del servizio
- [Altro Servizio](https://...) - Altra descrizione
- [Link Semplice](freenet:...)

## Altra Categoria

- [Strumento Audio](https://...) — Descrizione con trattino lungo
```

Il parser estrae automaticamente:

1. Intestazioni (`#`, `##`, `###`) $\rightarrow$ Divisori di sezione `// nome`
2. Elementi di lista (`*`, `-`) $\rightarrow$ Pill Linktree con titolo, descrizione e URL
3. Riconoscimento intelligente delle icone in base a parole chiave (es. _audio_, _chat_, _p2p_, _code_, _game_, _photo_, _market_)

---

## 📄 Licenza

MIT © Francesco Bruno (@scobru)
