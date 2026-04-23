import axios from 'axios'

const API_KEY = import.meta.env.VITE_AVIATIONSTACK_API_KEY
const BASE_URL = 'http://api.aviationstack.com/v1'

/**
 * Fetch real-time flights from Aviationstack API
 * @param {Object} params - Search parameters { dep_iata, arr_iata, flight_date }
 */
export const fetchFlights = async ({ dep_iata, arr_iata, flight_date }) => {
  if (!API_KEY) {
    console.warn('Aviationstack API key is missing. Please add VITE_AVIATIONSTACK_API_KEY to your .env file.')
    // Fallback to mock data for demo if no API key
    return getMockFlights(dep_iata, arr_iata)
  }

  try {
    const response = await axios.get(`${BASE_URL}/flights`, {
      params: {
        access_key: API_KEY,
        dep_iata,
        arr_iata,
        flight_date, // Format: YYYY-MM-DD
        limit: 10
      }
    })

    if (response.data && response.data.data) {
      return response.data.data.map(flight => ({
        id: flight.flight.iata || `FL-${Math.random().toString(36).substr(2, 6)}`,
        airline: flight.airline.name,
        flight_no: flight.flight.iata || flight.flight.number,
        departure: {
          airport: flight.departure.airport,
          iata: flight.departure.iata,
          time: flight.departure.scheduled.split('T')[1].substr(0, 5),
          terminal: flight.departure.terminal
        },
        arrival: {
          airport: flight.arrival.airport,
          iata: flight.arrival.iata,
          time: flight.arrival.scheduled.split('T')[1].substr(0, 5),
          terminal: flight.arrival.terminal
        },
        status: flight.flight_status,
        price: calculateMockPrice(dep_iata, arr_iata) // Aviationstack free tier doesn't provide pricing
      }))
    }
    
    return []
  } catch (error) {
    console.error('Error fetching flights:', error)
    throw error
  }
}

// Helper to calculate a reasonable mock price since the free API doesn't include it
const calculateMockPrice = (from, to) => {
  const base = 1500000 // 1.5M UZS base
  const randomFactor = Math.floor(Math.random() * 2000000)
  return base + randomFactor
}

// Fallback mock data in case API fails or key is missing
const getMockFlights = (from, to) => {
  return [
    {
      id: 'HY-601',
      airline: 'Uzbekistan Airways',
      flight_no: 'HY-601',
      departure: { airport: 'Tashkent Intl', iata: from || 'TAS', time: '08:00', terminal: '2' },
      arrival: { airport: 'Domodedovo', iata: to || 'DME', time: '11:45', terminal: 'A' },
      status: 'scheduled',
      price: 2450000
    },
    {
      id: 'SU-1871',
      airline: 'Aeroflot',
      flight_no: 'SU-1871',
      departure: { airport: 'Tashkent Intl', iata: from || 'TAS', time: '14:20', terminal: '2' },
      arrival: { airport: 'Sheremetyevo', iata: to || 'SVO', time: '18:10', terminal: 'C' },
      status: 'scheduled',
      price: 3100000
    },
    {
      id: 'TK-371',
      airline: 'Turkish Airlines',
      flight_no: 'TK-371',
      departure: { airport: 'Tashkent Intl', iata: from || 'TAS', time: '03:15', terminal: '2' },
      arrival: { airport: 'Istanbul New', iata: to || 'IST', time: '07:30', terminal: 'I' },
      status: 'scheduled',
      price: 4800000
    }
  ]
}
