const STORAGE_KEY = 'yolchiai_tickets'

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback
  } catch (e) {
    console.warn('Ticket storage parse error', e)
    return fallback
  }
}

export const loadTickets = () => safeParse(localStorage.getItem(STORAGE_KEY), [])

export const saveTickets = (tickets) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets))
}

export const addTicket = (ticket) => {
  const existing = loadTickets()
  saveTickets([ticket, ...existing])
  return ticket
}

export const getTicketById = (ticketId) => {
  if (!ticketId) return null
  return loadTickets().find(t => String(t.id) === String(ticketId)) || null
}

export const updateTicketStatus = (ticketId, status, errorMessage) => {
  const updated = loadTickets().map(t => 
    t.id === ticketId ? { ...t, status, errorMessage } : t
  )
  saveTickets(updated)
  return updated.find(t => t.id === ticketId)
}

export const formatDatePretty = (dateStr, locale = 'uz-UZ') => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })
}

export const parsePriceToNumber = (priceStr = '') => {
  const numeric = parseInt(String(priceStr).replace(/[^\d]/g, ''), 10)
  return Number.isNaN(numeric) ? 0 : numeric
}

export const formatPriceUz = (value) => {
  const formatter = new Intl.NumberFormat('uz-UZ')
  return `${formatter.format(value)} UZS`
}

export const computeTotalTickets = (tickets = []) => {
  return tickets.reduce((acc, t) => acc + (t.totalPrice || parsePriceToNumber(t.price)), 0)
}
