import path from 'node:path'
import { defineConfig } from 'prisma/config'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: path.join(process.cwd(), '.env') })
loadEnv({ path: path.join(process.cwd(), '.env.local'), override: true })

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
})
