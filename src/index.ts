#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { createPool, closePool } from './db/index.js'
import {
  connectDbSchema,
  querySchema,
  executeSchema,
  describeTableSchema,
  explainSchema,
  showStatementSchema,
  handleConnectDb,
  handleQuery,
  handleExecute,
  handleListTables,
  handleDescribeTable,
  handleExplain,
  handleShowStatement,
} from './tools/index.js'

const server = new McpServer({
  name: 'postgresql-mcp-ddz',
  version: '1.0.0',
})

// Auto-connect from environment variables if configured
function autoConnectFromEnv(): boolean {
  const host = process.env.POSTGRES_HOST
  const user = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD
  const database = process.env.POSTGRES_DB
  const port = process.env.POSTGRES_PORT

  if (host && user && password && database) {
    createPool({
      host,
      port: port ? parseInt(port, 10) : 5432,
      user,
      password,
      database,
    })
    console.error(`Auto-connected to database "${database}" on ${host}`)
    return true
  }
  return false
}

// Register tools
server.tool(
  'connect_db',
  'Connect to a PostgreSQL database',
  connectDbSchema,
  async (args) => handleConnectDb(args)
)

server.tool(
  'query',
  'Execute a SELECT query and return results',
  querySchema,
  async (args) => handleQuery(args)
)

server.tool(
  'execute',
  'Execute an INSERT, UPDATE, or DELETE query',
  executeSchema,
  async (args) => handleExecute(args)
)

server.tool(
  'list_tables',
  'List all tables in the database',
  {},
  async () => handleListTables()
)

server.tool(
  'describe_table',
  'Get the structure of a specific table',
  describeTableSchema,
  async (args) => handleDescribeTable(args)
)

server.tool(
  'explain',
  'Analyze SQL query performance using EXPLAIN',
  explainSchema,
  async (args) => handleExplain(args)
)

server.tool(
  'show_statement',
  'Execute a SHOW statement (e.g., SHOW STATUS, SHOW VARIABLES)',
  showStatementSchema,
  async (args) => handleShowStatement(args)
)

// Start server
async function main() {
  // Try to auto-connect from environment variables
  autoConnectFromEnv()

  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('PostgreSQL MCP Server started')
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  await closePool()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await closePool()
  process.exit(0)
})

main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
