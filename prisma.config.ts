import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

type Env = {
  DATABASE_URL: string
  DIRECT_URL?: string
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env<Env>('DIRECT_URL') || process.env.DIRECT_URL || '',
  },
})
