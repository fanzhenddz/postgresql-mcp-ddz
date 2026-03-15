import { z } from 'zod'
import { query, execute } from '../db/index.js'

// Zod schemas for tool parameters
export const connectDbSchema = {
  host: z.string().describe('Database host'),
  port: z.number().optional().describe('Database port (default: 5432)'),
  user: z.string().describe('Database user'),
  password: z.string().describe('Database password'),
  database: z.string().describe('Database name'),
}

export const querySchema = {
  sql: z.string().describe('SQL SELECT query'),
  params: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().describe('Query parameters (optional)'),
}

export const executeSchema = {
  sql: z.string().describe('SQL query (INSERT, UPDATE, DELETE)'),
  params: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional().describe('Query parameters (optional)'),
}

export const describeTableSchema = {
  table: z.string().describe('Table name'),
}

export const explainSchema = {
  sql: z.string().describe('SQL query to analyze with EXPLAIN'),
}

export const showStatementSchema = {
  sql: z.string().describe('SHOW SQL statement'),
}

// Internal validation schemas
const connectDbValidation = z.object(connectDbSchema)
const queryValidation = z.object(querySchema)
const executeValidation = z.object(executeSchema)
const describeTableValidation = z.object(describeTableSchema)
const explainValidation = z.object(explainSchema)
const showStatementValidation = z.object(showStatementSchema)

// Tool handlers
export async function handleConnectDb(args: unknown) {
  try {
    const { createPool } = await import('../db/index.js')
    const config = connectDbValidation.parse(args)
    createPool(config)
    return {
      content: [{ type: 'text' as const, text: `Successfully connected to database "${config.database}" on ${config.host}` }],
    }
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: `Connection failed: ${error instanceof Error ? error.message : String(error)}` }],
    }
  }
}

export async function handleQuery(args: unknown) {
  try {
    const { sql, params } = queryValidation.parse(args)

    // Validate that this is a SELECT query for safety
    const normalizedSql = sql.trim().toUpperCase()
    if (!normalizedSql.startsWith('SELECT') &&
        !normalizedSql.startsWith('SHOW') &&
        !normalizedSql.startsWith('EXPLAIN') &&
        !normalizedSql.startsWith('WITH')) {
      return {
        content: [{ type: 'text' as const, text: 'Error: Only SELECT, SHOW, EXPLAIN, and WITH queries are allowed with the query tool. Use execute for INSERT/UPDATE/DELETE.' }],
      }
    }

    const results = await query(sql, params)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
    }
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: `Query failed: ${error instanceof Error ? error.message : String(error)}` }],
    }
  }
}

export async function handleExecute(args: unknown) {
  try {
    const { sql, params } = executeValidation.parse(args)
    const result = await execute(sql, params)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify({ rowCount: result.rowCount, command: result.command }, null, 2) }],
    }
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: `Execute failed: ${error instanceof Error ? error.message : String(error)}` }],
    }
  }
}

export async function handleListTables() {
  try {
    const sql = `
      SELECT
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name
    `
    const results = await query(sql)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
    }
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: `Failed to list tables: ${error instanceof Error ? error.message : String(error)}` }],
    }
  }
}

export async function handleDescribeTable(args: unknown) {
  try {
    const { table } = describeTableValidation.parse(args)

    // Get column information
    const columnSql = `
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `
    const columns = await query(columnSql, [table])

    // Get primary key information
    const pkSql = `
      SELECT
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.constraint_type = 'PRIMARY KEY'
        AND tc.table_name = $1
    `
    const primaryKeys = await query(pkSql, [table])

    // Get foreign key information
    const fkSql = `
      SELECT
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = $1
    `
    const foreignKeys = await query(fkSql, [table])

    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({ table, columns, primaryKeys, foreignKeys }, null, 2)
      }],
    }
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: `Failed to describe table: ${error instanceof Error ? error.message : String(error)}` }],
    }
  }
}

export async function handleExplain(args: unknown) {
  try {
    const { sql } = explainValidation.parse(args)
    const explainSql = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${sql}`
    const results = await query(explainSql)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
    }
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: `EXPLAIN failed: ${error instanceof Error ? error.message : String(error)}` }],
    }
  }
}

export async function handleShowStatement(args: unknown) {
  try {
    const { sql } = showStatementValidation.parse(args)
    const normalizedSql = sql.trim().toUpperCase()

    if (!normalizedSql.startsWith('SHOW')) {
      return {
        content: [{ type: 'text' as const, text: 'Error: Only SHOW statements are allowed with this tool.' }],
      }
    }

    const results = await query(sql)
    return {
      content: [{ type: 'text' as const, text: JSON.stringify(results, null, 2) }],
    }
  } catch (error) {
    return {
      content: [{ type: 'text' as const, text: `SHOW statement failed: ${error instanceof Error ? error.message : String(error)}` }],
    }
  }
}
