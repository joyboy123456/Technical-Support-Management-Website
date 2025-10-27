// src/server/status.ts
// 设备状态标准化工具

export type CanonicalStatus =
  | 'AVAILABLE'
  | 'IN_USE'
  | 'MAINTENANCE'
  | 'BORROWED'
  | 'OFFLINE'
  | 'OTHER'

const buckets: Record<CanonicalStatus, string[]> = {
  AVAILABLE: ['可用', 'available'],
  IN_USE: ['使用中', '运行中', 'in_use', 'running'],
  MAINTENANCE: ['维修中', '维护', 'maintenance', 'maintaining'],
  BORROWED: ['借出', 'borrowed'],
  OFFLINE: ['离线', 'offline'],
  OTHER: []
}

export function normalizeStatus(input?: string | null): CanonicalStatus {
  const raw = (input || '').trim().toLowerCase()
  if (!raw) return 'OTHER'

  for (const key of Object.keys(buckets) as CanonicalStatus[]) {
    if (buckets[key].some(k => raw === k)) return key
  }

  if (raw.includes('借')) return 'BORROWED'
  if (raw.includes('修') || raw.includes('维')) return 'MAINTENANCE'
  if (raw.includes('离线') || raw.includes('off')) return 'OFFLINE'
  if (raw.includes('用') || raw.includes('run')) return 'IN_USE'
  if (raw.includes('可用') || raw.includes('avail')) return 'AVAILABLE'
  return 'OTHER'
}
