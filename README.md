# PostgreSQL MCP Server

一个基于模型上下文协议（MCP）的 PostgreSQL 数据库操作服务器，让 AI 助手能够通过标准化接口与 PostgreSQL 数据库交互。

## 功能特性

- **查询执行**：执行带参数化的 SELECT 查询
- **数据修改**：执行 INSERT、UPDATE、DELETE 操作
- **结构查询**：列出数据库表、查看表结构
- **性能分析**：使用 EXPLAIN 分析查询性能
- **连接管理**：支持环境变量自动连接，安全可靠

## 安装

```bash
npm install postgresql-mcp-ddz
```

或直接使用 npx：

```bash
npx postgresql-mcp-ddz
```

## 配置

### 方式一：环境变量自动连接（推荐）

在 MCP 客户端配置中添加环境变量，服务器启动时会自动连接数据库：

```json
{
  "mcpServers": {
    "postgresql-mcp-ddz": {
      "command": "npx",
      "args": ["postgresql-mcp-ddz"],
      "env": {
        "POSTGRES_HOST": "127.0.0.1",
        "POSTGRES_PORT": "5432",
        "POSTGRES_USER": "postgres",
        "POSTGRES_PASSWORD": "your_password",
        "POSTGRES_DB": "your_database"
      }
    }
  }
}
```

**支持的环境变量：**

| 变量名 | 说明 | 必填 |
|--------|------|------|
| `POSTGRES_HOST` | 数据库主机地址 | 是 |
| `POSTGRES_PORT` | 数据库端口（默认 5432） | 否 |
| `POSTGRES_USER` | 数据库用户名 | 是 |
| `POSTGRES_PASSWORD` | 数据库密码 | 是 |
| `POSTGRES_DB` | 数据库名称 | 是 |

### 方式二：手动连接

不在配置中添加环境变量时，需要通过 `connect_db` 工具手动连接：

```json
{
  "mcpServers": {
    "postgresql": {
      "command": "npx",
      "args": ["postgresql-mcp-ddz"]
    }
  }
}
```

## 可用工具

### `connect_db`

连接到 PostgreSQL 数据库（环境变量配置后可省略此步骤）。

**参数：**
- `host`（字符串，必填）：数据库主机地址
- `port`（数字，可选）：数据库端口，默认 5432
- `user`（字符串，必填）：数据库用户名
- `password`（字符串，必填）：数据库密码
- `database`（字符串，必填）：数据库名称

**示例：**
```json
{
  "host": "localhost",
  "port": 5432,
  "user": "postgres",
  "password": "password",
  "database": "mydb"
}
```

### `query`

执行 SELECT 查询并返回结果。

**参数：**
- `sql`（字符串，必填）：SQL SELECT 查询语句
- `params`（数组，可选）：查询参数

**示例：**
```json
{
  "sql": "SELECT * FROM users WHERE age > $1",
  "params": [18]
}
```

### `execute`

执行 INSERT、UPDATE 或 DELETE 查询。

**参数：**
- `sql`（字符串，必填）：SQL 语句
- `params`（数组，可选）：查询参数

**示例：**
```json
{
  "sql": "INSERT INTO users (name, email) VALUES ($1, $2)",
  "params": ["张三", "zhangsan@example.com"]
}
```

### `list_tables`

列出当前数据库中的所有表。

### `describe_table`

获取指定表的结构信息，包括列、主键和外键。

**参数：**
- `table`（字符串，必填）：表名

**示例：**
```json
{
  "table": "users"
}
```

### `explain`

使用 EXPLAIN 分析 SQL 查询性能。

**参数：**
- `sql`（字符串，必填）：要分析的 SQL 查询

**示例：**
```json
{
  "sql": "SELECT * FROM users WHERE email = 'test@example.com'"
}
```

### `show_statement`

执行 SHOW 语句。

**参数：**
- `sql`（字符串，必填）：SHOW SQL 语句

**示例：**
```json
{
  "sql": "SHOW ALL"
}
```

## 安全说明

- `query` 工具仅允许 SELECT、SHOW、EXPLAIN 和 WITH 查询
- 数据修改操作请使用 `execute` 工具
- 所有查询支持参数化输入，防止 SQL 注入
- 数据库凭据仅在运行时传递，不会被持久化存储

## 开发

```bash
# 安装依赖
npm install

# 构建
npm run build

# 开发模式
npm run dev

# 类型检查
npm run typecheck
```

## 发布

```bash
# 登录 npm
npm login

# 发布
npm publish
```

## 许可证

MIT
