# Istruzioni per Testare la Connessione MCP

## Configurazione Attuale (Approccio 1)
Ho modificato il file `.kilocode/mcp.json` per passare la chiave API come parametro nell'URL:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=jickuwblfiytnvgbhwio&api_key=sb_secret_bKmtF-AObvWJ6avh5LiJBw_jZelD65d",
      "disabled": false,
      "alwaysAllow": []
    }
  }
}
```

## Passi per Testare

1. **Riavvia VSCode** o ricarica la finestra (Ctrl+Shift+P → "Developer: Reload Window")
2. **Controlla il pannello MCP** per vedere se il server Supabase si connette
3. **Verifica se ci sono ancora errori 401**

## Se Continua a Non Funzionare

### Approccio 2: Environment Variables
Se il primo approccio non funziona, prova questa configurazione alternativa:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=jickuwblfiytnvgbhwio",
      "disabled": false,
      "alwaysAllow": [],
      "env": {
        "SUPABASE_API_KEY": "sb_secret_bKmtF-AObvWJ6avh5LiJBw_jZelD65d"
      }
    }
  }
}
```

### Approccio 3: Chiavi JWT Standard
Se anche questo non funziona, potrebbe essere necessario generare chiavi nel formato JWT standard dal dashboard di Supabase.

## Possibili Problemi

1. **Formato chiavi non standard**: Le chiavi fornite non sembrano essere nel formato JWT standard di Supabase
2. **Metodo di autenticazione**: Il server MCP potrebbe richiedere un metodo di autenticazione diverso
3. **Problemi con il progetto**: Il progetto Supabase potrebbe avere restrizioni o configurazioni specifiche

## Feedback

Per favore, prova la configurazione attuale e fammi sapere:
1. Se il server MCP si connette correttamente
2. Se ricevi ancora errori 401
3. Quale messaggio di errore esatto vedi

Questo mi aiuterà a determinare il prossimo approccio da provare.