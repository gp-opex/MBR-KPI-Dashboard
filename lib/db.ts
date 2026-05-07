import sql from 'mssql'

let pool: sql.ConnectionPool | null = null

async function getPool(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) return pool

  const server = process.env.DB_SERVER
  const database = process.env.DB_NAME
  const user = process.env.DB_USER
  const password = process.env.DB_PASSWORD
  const trustCert = process.env.DB_TRUST_CERT !== 'false'

  if (!server || !database || !user || !password) {
    throw new Error('Missing DB credentials: DB_SERVER, DB_NAME, DB_USER, DB_PASSWORD required')
  }

  pool = new sql.ConnectionPool({
    server,
    database,
    user,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: trustCert,
      connectTimeout: 15000,
    },
  })

  await pool.connect()
  return pool
}

export async function queryDb<T = Record<string, unknown>>(
  query: string,
  maxRows = 2000
): Promise<T[]> {
  const p = await getPool()
  const result = await p.request().query(query)
  return result.recordset.slice(0, maxRows) as T[]
}
