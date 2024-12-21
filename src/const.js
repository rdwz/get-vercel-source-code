import dotenv from 'dotenv'
dotenv.config()

const VERCEL_API_BASE = process.env.VERCEL_API_BASE
const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_TEAM = process.env.VERCEL_TEAM

export {
  VERCEL_API_BASE,
  VERCEL_API_TOKEN,
  VERCEL_TEAM,
}
