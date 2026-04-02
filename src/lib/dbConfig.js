const useServer = import.meta.env.VITE_USE_SERVER === 'true'

const dbUrl =
  (useServer && (
    import.meta.env.VITE_RAILWAY_URL ||
    import.meta.env.RAILWAY_URL ||
    import.meta.env.RAILWAY_DATABASE_URL ||
    import.meta.env.DATABASE_URL ||
    import.meta.env.POSTGRES_URL
  )) || ''

export const isDbConfigured = Boolean(useServer && dbUrl)
export const dbConfigError = isDbConfigured
  ? ''
  : "Postgres / Railway sozlamalari yo‘q yoki USE_SERVER false. `.env` ichida `VITE_USE_SERVER=true` va `VITE_RAILWAY_URL` (yoki RAILWAY_DATABASE_URL/DATABASE_URL/POSTGRES_URL) sozlang."

export const databaseConnectionString = dbUrl

