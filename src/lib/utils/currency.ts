/**
 * Funzione di formattazione valuta consistente tra server e client
 * Risolve problemi di hydration in Next.js
 */

/**
 * Formatta un valore numerico come valuta Euro
 * @param amount - Il valore numerico da formattare
 * @returns Stringa formattata come valuta Euro
 */
export function formatCurrency(amount: number | string): string {
  // Converti in numero se è una stringa
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Verifica che sia un numero valido
  if (isNaN(numericAmount)) {
    return '€0,00';
  }
  
  // Formattazione manuale per consistenza server/client
  const roundedAmount = Math.round(numericAmount * 100) / 100;
  const parts = roundedAmount.toFixed(2).split('.');
  
  // Aggiungi separatore delle migliaia
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  return `€${parts.join(',')}`;
}

/**
 * Formatta un valore numerico come valuta Euro con opzioni avanzate
 * @param amount - Il valore numerico da formattare
 * @param options - Opzioni di formattazione
 * @returns Stringa formattata come valuta Euro
 */
export function formatCurrencyAdvanced(
  amount: number | string,
  options: {
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
    showSymbol?: boolean;
  } = {}
): string {
  const {
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
    showSymbol = true
  } = options;
  
  // Converti in numero se è una stringa
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Verifica che sia un numero valido
  if (isNaN(numericAmount)) {
    return showSymbol ? '€0,00' : '0,00';
  }
  
  // Arrotonda al numero corretto di decimali
  const factor = Math.pow(10, maximumFractionDigits);
  const roundedAmount = Math.round(numericAmount * factor) / factor;
  
  // Formatta manualmente per consistenza
  const fixedAmount = roundedAmount.toFixed(minimumFractionDigits);
  const parts = fixedAmount.split('.');
  
  // Aggiungi separatore delle migliaia
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  
  const formattedValue = parts.join(',');
  return showSymbol ? `€${formattedValue}` : formattedValue;
}

/**
 * Formatta un valore numerico come valuta Euro per display UI
 * Versione ottimizzata per componenti React
 */
export function useCurrencyFormatter() {
  return {
    formatCurrency,
    formatCurrencyAdvanced
  };
}