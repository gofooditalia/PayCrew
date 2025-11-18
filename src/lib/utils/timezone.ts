/**
 * Timezone utilities for Europe/Rome
 *
 * Gestisce automaticamente ora legale (UTC+2) e ora solare (UTC+1)
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz'

const TIMEZONE_ROME = 'Europe/Rome'

/**
 * Crea un DateTime in timezone Europe/Rome da una data e un orario (HH:mm)
 *
 * Esempio:
 * createRomeDateTime('2025-11-18', '10:00') // 2025-11-18T10:00:00+01:00 (ora solare)
 * createRomeDateTime('2025-07-15', '10:00') // 2025-07-15T10:00:00+02:00 (ora legale)
 *
 * @param dateString Data in formato ISO (YYYY-MM-DD)
 * @param timeString Orario in formato HH:mm
 * @returns Date object con timezone Europe/Rome corretto
 */
export function createRomeDateTime(dateString: string, timeString: string): Date {
  // Combina data e ora
  const localDateTimeString = `${dateString}T${timeString}:00`

  // Crea un Date object "naive" (senza timezone)
  const naiveDate = new Date(localDateTimeString)

  // Converte da "tempo locale" Europe/Rome a UTC
  // Questo gestisce automaticamente ora legale/solare
  return fromZonedTime(naiveDate, TIMEZONE_ROME)
}

/**
 * Converte un Date UTC in tempo locale Europe/Rome
 *
 * @param date Date object in UTC
 * @returns Date object interpretato come Europe/Rome
 */
export function toRomeTime(date: Date): Date {
  return toZonedTime(date, TIMEZONE_ROME)
}

/**
 * Estrae l'orario (HH:mm) da un Date in timezone Europe/Rome
 *
 * @param date Date object
 * @returns Stringa in formato HH:mm
 */
export function extractRomeTime(date: Date): string {
  const romeDate = toRomeTime(date)
  const hours = romeDate.getHours().toString().padStart(2, '0')
  const minutes = romeDate.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

/**
 * Estrae la data (YYYY-MM-DD) da un Date in timezone Europe/Rome
 *
 * @param date Date object
 * @returns Stringa in formato YYYY-MM-DD
 */
export function extractRomeDate(date: Date): string {
  const romeDate = toRomeTime(date)
  return romeDate.toISOString().split('T')[0]
}
