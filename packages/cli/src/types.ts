export type Severity = 'error' | 'warning' | 'info'
export type Confidence = 'high' | 'medium' | 'low'

export interface Finding {
  ruleId: string
  severity: Severity
  confidence: Confidence
  message: string
  remediation: string
  feature?: string
  file?: string
  line?: number
  evidence?: string
  autofix: false
}

export interface Endpoint {
  feature: string
  method: string
  path: string
  file: string
  line: number
  framework: 'elysia-static' | 'next-route-handler'
  snippet: string
  access?: 'protected' | 'public' | 'unreviewed'
  policy?: string
  reviewStatus?: 'current' | 'stale' | 'expired' | 'incomplete' | 'unreviewed'
}

export interface PermissionEntry {
  feature: string
  method: string
  path: string
  access: 'protected' | 'public' | 'unreviewed'
  policy?: string
  resourceScope?: string
  authorizationTest?: string
  reason?: string
  reviewer?: string
  reviewedAt?: string
  expiresAt?: string
}

export interface AuditReport {
  tool: 'elysia9x'
  version: string
  generatedAt: string
  projectRoot: string
  endpoints: Endpoint[]
  findings: Finding[]
  summary: { total: number; errors: number; warnings: number; info: number }
}
