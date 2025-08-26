
# 数据库修复指南

## 问题描述

当访问着陆页时，以下两个API请求返回500错误：

1. `GET /api/admin/content/home`
2. `GET /api/user`

## 错误原因

经过分析，这些错误主要由以下问题引起：

1. **数据库连接问题**：MySQL数据库可能未正确启动或配置不正确
2. **缺少必要的数据库表**：特别是 `site_content` 表可能不存在
3. **缺少必要的数据**：`site_content` 表中可能没有 "home" 键的记录
4. **会话存储问题**：用于会话管理的 `sessions` 表可能不存在

## 修复方案

我们已经创建了两个脚本来解决这些问题：

### 1. 主要修复脚本：`fix-database-issues.ts`

这个脚本会：
- 检查数据库连接是否正常
- 检查 `site_content` 表是否存在，如果不存在则创建它
- 检查 `site_content` 表中是否有 "home" 键的记录，如果没有则添加默认内容
- 检查会话存储表 `sessions` 是否存在，如果不存在则创建它

### 2. 执行脚本：`run-fix.ts`

这是一个简单的执行脚本，用于运行修复脚本。

## 使用方法

1. 确保MySQL数据库正在运行，并且数据库配置正确（检查 `.env` 文件中的数据库配置）
2. 在服务器目录下运行以下命令：

```bash
cd server
npm install mysql2 dotenv --legacy-peer-deps
node run-database-fix.js
```

3. 等待脚本执行完成。如果一切正常，您会看到 "✅ Database fix completed successfully!" 的消息
4. 重启服务器以应用更改

## 备用方法

如果上述方法不工作，您可以尝试以下方法：

### 方法 1：全局安装 tsx

```bash
npm install -g tsx --legacy-peer-deps
cd server
tsx fix-database-issues.ts
```

### 方法 2：使用 ts-node

```bash
npm install -g ts-node --legacy-peer-deps
cd server
ts-node fix-database-issues.ts
```

### 方法 3：使用 node + esm

```bash
npm install -g ts-node --legacy-peer-deps
cd server
node --loader ts-node/esm fix-database-issues.ts
```

## 常见问题

### npm 依赖冲突

如果在安装 tsx 时遇到依赖冲突错误，请使用 `--legacy-peer-deps` 标志：

```bash
npm install tsx --save-dev --legacy-peer-deps
```

### __dirname 未定义错误

如果遇到 "__dirname is not defined in ES module scope" 错误，我们已经修复了 `run-fix.ts` 文件中的这个问题。请确保您使用的是最新版本的修复脚本。

## 验证修复

修复完成后，您可以：

1. 访问着陆页，检查是否还有500错误
2. 检查数据库中是否已创建必要的表和数据
3. 尝试登录，确认会话功能正常工作

## 注意事项

- 在运行修复脚本之前，请确保已备份您的数据库
- 如果修复过程中遇到错误，请检查数据库连接和配置
- 修复完成后，需要重启服务器才能使更改生效
