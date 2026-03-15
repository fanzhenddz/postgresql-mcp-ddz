import pg from 'pg'
const { Pool } = pg

export interface DatabaseConfig {
  host: string
  port?: number
  user: string
  password: string
  database: string
  ssl?: boolean | object
  maxConnections?: number
}

let pool: pg.Pool | null = null

export function createPool(config: DatabaseConfig): pg.Pool {
  if (pool) {
    return pool
  }

  pool = new Pool({
    host: config.host,
    port: config.port ?? 5432,
    user: config.user,
    password: config.password,
    database: config.database,
    ssl: config.ssl ?? false,
    max: config.maxConnections ?? 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  })

  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err)
  })

  return pool
}

export function getPool(): pg.Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call createPool first.')
  }
  return pool
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
  }
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params?: unknown[]): Promise<T[]> {
  const client = getPool()
  const result = await client.query<T>(sql, params)
  return result.rows
}

export async function execute(sql: string, params?: unknown[]): Promise<pg.QueryResult> {
  const client = getPool()
  return await client.query(sql, params)
}
