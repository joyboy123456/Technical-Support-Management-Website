import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type SupabaseAdminClient = SupabaseClient

type MaybeLocation = { id: string; name?: string } | null

type CheckoutSeedResult = {
  marker: string
  location?: { id: string; name?: string }
  actions: { id: string; at_time: string; action_type: string }[]
}

type CheckoutSeedOptions = {
  location?: { id: string; name?: string }
  marker?: string
  dayOffsets?: number[]
}

const supabaseUrl = process.env.PLAYWRIGHT_SUPABASE_URL
  ?? process.env.SUPABASE_URL
  ?? process.env.VITE_SUPABASE_URL

const supabaseServiceKey = process.env.PLAYWRIGHT_SUPABASE_SERVICE_ROLE_KEY
  ?? process.env.SUPABASE_SERVICE_ROLE_KEY

let cachedAdminClient: SupabaseAdminClient | null = null

export const hasSupabaseAdminConfig = Boolean(supabaseUrl && supabaseServiceKey)

export function getSupabaseAdminClient(): SupabaseAdminClient {
  if (!hasSupabaseAdminConfig) {
    throw new Error('Supabase admin credentials are not configured for Playwright tests')
  }

  if (!cachedAdminClient) {
    cachedAdminClient = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return cachedAdminClient
}

export async function fetchAnyLocation(): Promise<MaybeLocation> {
  if (!hasSupabaseAdminConfig) {
    return null
  }

  const client = getSupabaseAdminClient()
  const { data, error } = await client
    .from('locations')
    .select('id, name')
    .order('created_at', { ascending: true })
    .limit(1)

  if (error) {
    console.warn('Failed to fetch locations for operations dashboard tests', error)
    return null
  }

  if (!data || data.length === 0) {
    return null
  }

  return data[0]
}

export async function seedCheckoutActions(options: CheckoutSeedOptions = {}): Promise<CheckoutSeedResult> {
  const client = getSupabaseAdminClient()

  const marker = options.marker ?? `PLAYWRIGHT-CHECKOUT-${Date.now()}`
  const now = new Date()
  const offsets = options.dayOffsets ?? [0, 1, 3]

  const rows = offsets.map(offset => {
    const at = new Date(now)
    at.setDate(now.getDate() - offset)

    return {
      action_type: '出库' as const,
      asset_type: '打印机' as const,
      qty: (offset % 3) + 1,
      from_location_id: options.location?.id ?? null,
      to_location_id: null,
      by_user: 'Playwright Ops Dashboard',
      related_person: 'E2E 自动化',
      work_order: marker,
      remark: `Playwright regression seed offset ${offset}`,
      at_time: at.toISOString(),
      status: 'completed'
    }
  })

  const { data, error } = await client
    .from('actions')
    .insert(rows)
    .select('id, at_time, action_type')

  if (error) {
    throw new Error(`Failed to seed checkout actions for operations dashboard tests: ${error.message}`)
  }

  return {
    marker,
    location: options.location,
    actions: data ?? []
  }
}

export async function cleanupSeededActions(actionIds: string[]): Promise<void> {
  if (!hasSupabaseAdminConfig) {
    return
  }

  if (!actionIds.length) {
    return
  }

  const client = getSupabaseAdminClient()
  const { error } = await client
    .from('actions')
    .delete()
    .in('id', actionIds)

  if (error) {
    console.warn('Failed to cleanup seeded actions after operations dashboard tests', {
      error: error.message,
      actionIds
    })
  }
}
