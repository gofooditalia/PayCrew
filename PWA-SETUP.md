# Configurazione PWA di PayCrew

PayCrew è configurato come Progressive Web App (PWA) con funzionalità avanzate.

## Funzionalità Implementate

### ✅ Installabilità
- **Manifest personalizzato** (`/public/manifest.json`) con metadati completi
- **Icone multi-risoluzione** (da 72x72 a 512x512px) in `/public/icons/`
- **Apple Touch Icon** per dispositivi iOS
- **Shortcuts** per accesso rapido a:
  - Dashboard
  - Dipendenti
  - Presenze
  - Buste Paga

### ✅ Funzionalità Offline
- **Service Worker** configurato con Workbox
- **Strategie di caching intelligenti**:
  - **NetworkFirst** per Supabase e API (con fallback cache)
  - **CacheFirst** per immagini e font (performance ottimale)
  - **StaleWhileRevalidate** per risorse statiche (JS, CSS)
- **Pagina offline dedicata** (`/offline`) con UI user-friendly
- **Aggiornamenti automatici** del service worker

### ✅ Esperienza Utente
- **Prompt di installazione** personalizzato (componente `PWAInstallPrompt`)
  - Mostra banner per installare l'app
  - Dismissibile con preferenza salvata in localStorage
- **Notifica aggiornamenti** automatica quando disponibile nuova versione
- **Theme color** adattivo (light/dark mode)
- **Viewport ottimizzato** per mobile

### ✅ SEO & Social
- **Open Graph** tags per condivisioni social
- **Twitter Card** configurata
- **Metadati completi** per motori di ricerca
- **Keywords** ottimizzate per settore ristorazione/HR

## Configurazione Tecnica

### Dipendenze
```json
"@ducanh2912/next-pwa": "latest"
```

### File Principali
- `next.config.js` - Configurazione next-pwa con Workbox
- `public/manifest.json` - Web App Manifest
- `src/components/pwa-install-prompt.tsx` - Componente UI installazione
- `src/app/offline/page.tsx` - Pagina offline fallback
- `src/app/layout.tsx` - Metadati PWA globali

### Caching Strategy

#### Supabase & API (`NetworkFirst`)
- Timeout: 10s
- Cache size: 200 entries max
- TTL: 24 ore (Supabase) / 5 minuti (API)
- Priorità: rete, poi cache

#### Immagini (`CacheFirst`)
- Cache size: 100 entries max
- TTL: 30 giorni
- Formati: png, jpg, jpeg, svg, gif, webp, avif

#### Risorse Statiche (`StaleWhileRevalidate`)
- Cache size: 50 entries max
- TTL: 7 giorni
- Tipi: js, css, woff, woff2

#### Google Fonts (`CacheFirst`)
- Cache size: 20 entries max
- TTL: 1 anno

## Modalità Development vs Production

### Development
- Service Worker **DISABILITATO** (per evitare conflitti durante lo sviluppo)
- Manifest sempre disponibile
- Icone sempre disponibili

### Production
- Service Worker **ATTIVO** automaticamente
- File generati in `/public/`:
  - `sw.js` - Service Worker
  - `workbox-*.js` - Runtime Workbox
- Cache attivo con tutte le strategie

## Testing PWA

### Locale
1. Build production: `npm run build`
2. Start server: `npm start`
3. Apri Chrome DevTools > Application > Service Workers
4. Verifica manifest: Application > Manifest
5. Testa offline: Network > Offline checkbox

### Vercel Deploy
1. Deploy: `git push` (auto-deploy su Vercel)
2. Chrome mobile: visita `https://pay-crew.vercel.app`
3. Banner "Aggiungi a schermata Home" appare automaticamente
4. Lighthouse audit: Performance > Progressive Web App (dovrebbe essere 100/100)

## Lighthouse PWA Score

Target: **100/100**

Criteri soddisfatti:
- ✅ Installabile
- ✅ Service Worker registrato
- ✅ Risponde con 200 quando offline
- ✅ Manifest valido con icone
- ✅ Apple touch icon
- ✅ Viewport configurato
- ✅ Theme color impostato
- ✅ Content sized correctly
- ✅ HTTPS (su Vercel)

## Shortcuts Disponibili

Dal launcher dell'app installata (long press su icona):

1. **Dashboard** - `/dashboard`
2. **Dipendenti** - `/dipendenti`
3. **Presenze** - `/presenze`
4. **Buste Paga** - `/buste-paga`

## Supporto Browser

### Desktop
- ✅ Chrome 90+ (full support)
- ✅ Edge 90+ (full support)
- ⚠️ Safari 16+ (partial - no service worker)
- ❌ Firefox (manifest only, no install prompt)

### Mobile
- ✅ Chrome Android 90+ (full support)
- ✅ Samsung Internet 14+ (full support)
- ✅ Safari iOS 16.4+ (full support with "Add to Home Screen")
- ✅ Edge Mobile (full support)

## Manutenzione

### Aggiungere nuove icone
```bash
convert -background none -resize {SIZE}x{SIZE} public/paycrew.svg public/icons/icon-{SIZE}x{SIZE}.png
```

### Modificare strategie di cache
Editare `next.config.js` > `workboxOptions.runtimeCaching`

### Aggiornare manifest
Editare `public/manifest.json` e rebuild

### Forzare aggiornamento service worker
1. Incrementa versione in `manifest.json`
2. Deploy su Vercel
3. Gli utenti vedranno notifica "Aggiornamento disponibile"

## Troubleshooting

### Service Worker non si registra
- Verifica che sia in produzione (`NODE_ENV=production`)
- Controlla console browser per errori
- Verifica che il sito sia servito su HTTPS

### Prompt installazione non appare
- Controlla se già installato
- Verifica `localStorage` per `pwa-install-dismissed`
- Cancella storage e ricarica

### Cache non funziona offline
- Verifica DevTools > Application > Cache Storage
- Controlla che le risorse siano state cachate
- Verifica console per errori service worker

### Aggiornamenti non vengono rilevati
- Hard refresh (Ctrl+Shift+R)
- Unregister service worker e ricarica
- Verifica che `controllerchange` event sia ascoltato

## Risorse

- [Next.js PWA Plugin](https://github.com/DuCanhGH/next-pwa)
- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest Spec](https://www.w3.org/TR/appmanifest/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
