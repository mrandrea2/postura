// api/evaluate.js — Vercel Serverless Function (CommonJS, nessuna config extra)
// Genera la "Valutazione generale" con Claude tenendo la API key lato server.
//
// SETUP RAPIDO:
// 1) Questo file deve stare in /api/evaluate.js del progetto.
// 2) Su Vercel → Project → Settings → Environment Variables aggiungi:
//        Name:  ANTHROPIC_API_KEY
//        Value: sk-ant-...   (la tua chiave Anthropic)
//    Seleziona gli ambienti Production (e Preview se vuoi) e salva.
// 3) Rifai il deploy (Deployments → Redeploy) così la variabile viene caricata.
//
// L'app (index.html) chiama automaticamente /api/evaluate. Senza chiave/endpoint
// usa comunque una valutazione locale di fallback.

const MODEL = 'claude-sonnet-4-6'; // Sonnet 4.6: snapshot stabile e attuale, ottimo per qualità/costo

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(500).json({ error: 'ANTHROPIC_API_KEY non configurata su Vercel' });

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    const system =
      "Sei un preparatore fisico e scienziato dello sport esperto di pallavolo femminile di alto livello (Serie A2-A3 italiana). " +
      "Ricevi i dati di valutazione di un'atleta (antropometria, test fisici, Functional Movement Screen, analisi posturale 2D incluso uno squat). " +
      "Scrivi una valutazione generale professionale in italiano, chiara e utile per programmare l'allenamento. " +
      "Struttura il testo in paragrafi con queste sezioni: SINTESI DEL PROFILO; PUNTI DI FORZA; AREE DI MIGLIORAMENTO; PRIORITA DI ALLENAMENTO; CONSIGLI DI ALLENAMENTO (esercizi e metodi concreti con frequenza settimanale indicativa); RISCHIO INFORTUNI. " +
      "Tieni conto del ruolo in campo dell'atleta. Usa SOLO i dati forniti: non inventare valori mancanti e indica quando un dato non è disponibile. " +
      "Contestualizza i numeri per la pallavolo femminile A2-A3. Ricorda che si tratta di uno screening, non di una diagnosi clinica. " +
      "Lunghezza: 300-450 parole. Tono tecnico ma leggibile. Scrivi in prosa, con i titoli di sezione in maiuscolo seguiti dai due punti, senza elenchi puntati con simboli.";

    const userMsg =
      "Dati della valutazione (JSON):\n\n" + JSON.stringify(data, null, 2) +
      "\n\nProduci la valutazione generale seguendo la struttura indicata.";

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1200,
        system,
        messages: [{ role: 'user', content: userMsg }]
      })
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(502).json({ error: 'Errore API Anthropic', detail: errText });
    }

    const j = await r.json();
    const evaluation = (j.content || [])
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('\n')
      .trim();

    if (!evaluation) return res.status(502).json({ error: 'Risposta vuota dal modello' });
    return res.status(200).json({ evaluation });
  } catch (e) {
    return res.status(500).json({ error: 'Errore interno', detail: String((e && e.message) || e) });
  }
};
