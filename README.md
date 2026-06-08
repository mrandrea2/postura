# Arena Volley Team Verona — Valutazione fisico-posturale

App per analisi posturale (foto frontale, laterale, squat) con pose estimation, test fisici con
semaforo, FMS e generazione report PDF. Valutazione generale prodotta da Claude tramite una
serverless function (chiave protetta lato server).

## Struttura del progetto

```
.
├─ index.html          # l'app (servita da Vercel alla root)
├─ api/
│  └─ evaluate.js       # serverless function: valutazione IA con Claude
├─ README.md
└─ .gitignore
```

Nessun build step: è un sito statico + una function. Vercel le riconosce in automatico.

---

## 1) Mettere il codice su GitHub

Da terminale, nella cartella del progetto:

```bash
git init
git add .
git commit -m "Postural Screening Suite"
git branch -M main
git remote add origin https://github.com/TUO-UTENTE/postura-app.git
git push -u origin main
```

(In alternativa: su GitHub crea un repo vuoto e trascina i file dalla UI "Add file → Upload files".)

---

## 2) Deploy su Vercel

1. Vai su https://vercel.com → **Add New… → Project**.
2. **Import** il repository GitHub `postura-app`.
3. Framework Preset: lascia **Other** (è statico). Nessun comando di build.
4. Premi **Deploy**.

L'app sarà online su `https://nome-progetto.vercel.app`. La function risponde su
`https://nome-progetto.vercel.app/api/evaluate`.

---

## 3) Environment Variable per l'API (Claude)

La valutazione IA usa la tua chiave Anthropic, che NON deve stare nel codice.

1. Su Vercel apri il progetto → **Settings → Environment Variables**.
2. Aggiungi:

   | Name                | Value            | Environments              |
   |---------------------|------------------|---------------------------|
   | `ANTHROPIC_API_KEY` | `sk-ant-...`     | Production (e Preview)    |

3. Salva.
4. **Importante:** rifai il deploy perché la variabile venga caricata →
   **Deployments → (ultimo) → ⋯ → Redeploy**.

La chiave Anthropic si crea su https://console.anthropic.com → API Keys.

### Verifica
Apri l'app, compila qualche dato e premi **Genera valutazione**:
- se tutto è a posto, ottieni il testo prodotto da Claude;
- se la variabile manca o c'è un errore, l'app genera comunque una **valutazione locale** di
  fallback (e te lo segnala), così il PDF non resta mai vuoto.

---

## Note

- **Modello IA:** impostato in cima a `api/evaluate.js` (`MODEL = 'claude-sonnet-4-6'`).
  Aggiornalo quando vuoi a una versione più recente di Sonnet.
- **Soglie semaforo / bande di riferimento:** nell'oggetto `REF` dentro `index.html`.
  Quelle di Leg Press, Trazioni isometriche e Plank sono placeholder indicativi da calibrare
  sui tuoi dati reali.
- **Privacy:** le foto vengono elaborate nel browser (pose estimation lato client) e non
  vengono caricate da nessuna parte. Alla function viaggiano solo i dati numerici per la
  valutazione testuale.
- **Lista atlete:** salvata localmente nel browser (localStorage). Il livello dati è già
  predisposto per passare a Supabase sostituendo i metodi dell'oggetto `Store`.
- **Modello pose:** scaricato al primo avvio da CDN (serve connessione).
