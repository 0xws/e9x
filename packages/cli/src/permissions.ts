import { access, readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Endpoint, Finding, PermissionEntry } from './types.ts'
import { addFinding, readJson, readText, routeKey, toPosix } from './utils.ts'
import { discoverEndpoints } from './scanner.ts'

interface PermissionManifest { version?: number; routes?: PermissionEntry[] }
interface PolicyManifest { version?: number; policies?: Array<string | { id?: string; name?: string }> }

async function fileExists(file: string): Promise<boolean> {
  try { await access(file); return true } catch { return false }
}

export async function auditPermissions(
  root: string,
  findings: Finding[],
  featureFilter?: string,
): Promise<Endpoint[]> {
  const endpointsAll = await discoverEndpoints(root)
  const endpoints = featureFilter
    ? endpointsAll.filter((endpoint) => endpoint.feature === featureFilter)
    : endpointsAll
  const manifestPath = path.join(root, '.elysia9x', 'permissions.json')
  const policyPath = path.join(root, '.elysia9x', 'policies.json')

  if (!(await fileExists(manifestPath))) {
    addFinding(findings, 'AUTHZ.MANIFEST_MISSING', 'error', 'high',
      '.elysia9x/permissions.json is missing.',
      'Run `elysia9x init`, inventory every API endpoint and explicitly classify it as protected or reviewed public.',
      { file: '.elysia9x/permissions.json' })
    return endpoints.map((endpoint) => ({ ...endpoint, access: 'unreviewed' as const, reviewStatus: 'unreviewed' as const }))
  }

  let manifest: PermissionManifest
  try {
    manifest = JSON.parse(await readText(manifestPath)) as PermissionManifest
  } catch {
    addFinding(findings, 'AUTHZ.MANIFEST_INVALID', 'error', 'high',
      '.elysia9x/permissions.json is not valid JSON.',
      'Fix the JSON syntax and validate each route declaration against the Elysia9X permission schema.',
      { file: '.elysia9x/permissions.json' })
    return endpoints.map((endpoint) => ({ ...endpoint, access: 'unreviewed' as const, reviewStatus: 'unreviewed' as const }))
  }
  if (!Array.isArray(manifest.routes)) {
    addFinding(findings, 'AUTHZ.MANIFEST_SCHEMA_INVALID', 'error', 'high',
      'Permission manifest must contain a routes array.',
      'Use { version: 1, routes: [...] } and validate route entries.',
      { file: '.elysia9x/permissions.json' })
    return endpoints.map((endpoint) => ({ ...endpoint, access: 'unreviewed' as const, reviewStatus: 'unreviewed' as const }))
  }
  const declared = manifest.routes.filter((entry): entry is PermissionEntry => Boolean(entry && typeof entry === 'object' && typeof entry.feature === 'string' && typeof entry.method === 'string' && typeof entry.path === 'string' && typeof entry.access === 'string'))
  if (declared.length !== manifest.routes.length) addFinding(findings, 'AUTHZ.ROUTE_ENTRY_INVALID', 'error', 'high',
    'One or more permission entries are missing feature, method, path or access.',
    'Correct malformed entries; each route requires feature, method, path and access.',
    { file: '.elysia9x/permissions.json' })
  let policies: PolicyManifest = {}
  if (await fileExists(policyPath)) {
    try { policies = JSON.parse(await readFile(policyPath, 'utf8')) as PolicyManifest }
    catch { addFinding(findings, 'AUTHZ.POLICY_REGISTRY_INVALID', 'error', 'high',
      '.elysia9x/policies.json is not valid JSON.',
      'Repair the policy registry; do not replace it with an empty allow-all policy.',
      { file: '.elysia9x/policies.json' }) }
  }
  const policyEntries = Array.isArray(policies.policies) ? policies.policies : []
  if (await fileExists(policyPath) && !Array.isArray(policies.policies)) addFinding(findings, 'AUTHZ.POLICY_REGISTRY_SCHEMA_INVALID', 'error', 'high',
    'Policy registry must contain a policies array.',
    'Use { version: 1, policies: [...] } and give every policy a stable ID.',
    { file: '.elysia9x/policies.json' })
  const policyIds = new Set(policyEntries.map((entry) => typeof entry === 'string' ? entry : entry.id ?? entry.name).filter((value): value is string => typeof value === 'string' && value.length > 0))
  const declarations = new Map<string, PermissionEntry>()
  const config = await readJson<{ reviewMaxAgeDays?: number }>(path.join(root, '.elysia9x', 'config.json'), {})
  const reviewMaxAgeDays = Number.isFinite(config.reviewMaxAgeDays) ? Math.max(1, config.reviewMaxAgeDays!) : 180

  for (const entry of declared) {
    if (featureFilter && entry.feature !== featureFilter) continue
    const key = routeKey(entry)
    if (declarations.has(key)) addFinding(findings, 'AUTHZ.DUPLICATE_DECLARATION', 'error', 'high',
      `Duplicate permission declaration for ${key}.`,
      'Keep exactly one canonical declaration for each feature, HTTP method and normalized route.',
      { file: '.elysia9x/permissions.json', feature: entry.feature })
    declarations.set(key, entry)
  }

  const discoveredKeys = new Set<string>()
  for (const endpoint of endpoints) {
    const key = routeKey(endpoint)
    discoveredKeys.add(key)
    const entry = declarations.get(key)
    if (!entry) {
      addFinding(findings, 'AUTHZ.MISSING_DECLARATION', 'error', 'high',
        `Endpoint has no access declaration: ${endpoint.method} ${endpoint.path}.`,
        'Add an explicit protected policy or a reviewed public declaration. Never infer public access from missing metadata.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line, evidence: endpoint.framework })
      continue
    }

    if (!['protected', 'public'].includes(entry.access)) {
      addFinding(findings, 'AUTHZ.INVALID_ACCESS_STATE', 'error', 'high',
        `Endpoint ${endpoint.method} ${endpoint.path} is marked ${entry.access}; only protected or public can pass.`,
        'Set access to protected with a registered policy, or public with reason, reviewer, review date and expiry.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
      continue
    }

    if (entry.access === 'protected') {
      if (!entry.policy) addFinding(findings, 'AUTHZ.POLICY_MISSING', 'error', 'high',
        `Protected endpoint ${endpoint.method} ${endpoint.path} has no policy ID.`,
        'Reference a policy registered in .elysia9x/policies.json.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
      else if (!policyIds.has(entry.policy)) addFinding(findings, 'AUTHZ.POLICY_UNKNOWN', 'error', 'high',
        `Policy ${entry.policy} is not present in the policy registry.`,
        'Register and test the policy, or correct the policy ID in the permission inventory.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line, evidence: entry.policy })

      if (!entry.resourceScope) addFinding(findings, 'AUTHZ.RESOURCE_SCOPE_UNDECLARED', 'warning', 'medium',
        `Resource scope is not documented for ${endpoint.method} ${endpoint.path}.`,
        'Document object-level, ownership and tenant constraints, or explain why this operation has no resource scope.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })

      if (!entry.authorizationTest) addFinding(findings, 'AUTHZ.TEST_REFERENCE_MISSING', 'warning', 'high',
        `No authorization test reference for ${endpoint.method} ${endpoint.path}.`,
        'Add allow, deny and object/tenant boundary tests and reference the test file.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
      else if (!(await fileExists(path.resolve(root, entry.authorizationTest)))) addFinding(findings, 'AUTHZ.TEST_REFERENCE_BROKEN', 'error', 'high',
        `Authorization test file does not exist: ${entry.authorizationTest}.`,
        'Correct the test reference or add the missing authorization tests.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })

      const reviewFields = ['reviewer', 'reviewedAt', 'expiresAt'] as const
      const reviewMissing = reviewFields.filter((field) => !entry[field])
      if (reviewMissing.length) addFinding(findings, 'AUTHZ.REVIEW_INCOMPLETE', 'error', 'high',
        `Protected endpoint ${endpoint.method} ${endpoint.path} lacks review metadata: ${reviewMissing.join(', ')}.`,
        'Record the reviewer, reviewedAt and expiresAt after an independent permission review.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
      else {
        const reviewedAt = Date.parse(entry.reviewedAt!)
        const expiresAt = Date.parse(entry.expiresAt!)
        if (Number.isNaN(reviewedAt) || Number.isNaN(expiresAt)) addFinding(findings, 'AUTHZ.REVIEW_DATE_INVALID', 'error', 'high',
          `Protected endpoint ${endpoint.method} ${endpoint.path} has invalid review dates.`,
          'Use ISO-8601 dates or timestamps for reviewedAt and expiresAt.',
          { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
        else {
          if (expiresAt < Date.now()) addFinding(findings, 'AUTHZ.REVIEW_EXPIRED', 'error', 'high',
            `Protected endpoint ${endpoint.method} ${endpoint.path} has an expired review.`,
            'Re-review the permission and renew its expiry.',
            { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
          if (Date.now() - reviewedAt > reviewMaxAgeDays * 24 * 60 * 60 * 1000) addFinding(findings, 'AUTHZ.REVIEW_STALE', 'warning', 'high',
            `Protected endpoint ${endpoint.method} ${endpoint.path} was reviewed more than ${reviewMaxAgeDays} days ago.`,
            'Re-review the permission and update review metadata.',
            { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
        }
      }

      const enforcementMarker = /\bauthorize\s*\(|\brequirePermission\b|\bassertPermission\b|\benforcePolicy\b|\bpermission\s*:/
      if (!enforcementMarker.test(endpoint.snippet)) addFinding(findings, 'AUTHZ.ENFORCEMENT_UNVERIFIED', 'warning', 'low',
        `Could not find a recognizable authorization marker near ${endpoint.method} ${endpoint.path}.`,
        'Inspect composed middleware, Elysia macros and use-case enforcement. Static text matching cannot prove authorization.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
    }

    if (entry.access === 'public') {
      const required = ['reason', 'reviewer', 'reviewedAt', 'expiresAt'] as const
      const missing = required.filter((field) => !entry[field])
      if (missing.length) addFinding(findings, 'AUTHZ.PUBLIC_REVIEW_INCOMPLETE', 'error', 'high',
        `Public endpoint ${endpoint.method} ${endpoint.path} lacks: ${missing.join(', ')}.`,
        'Record a reason, reviewer, reviewedAt and expiresAt for every intentionally public endpoint.',
        { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
      else {
        const reviewDate = Date.parse(entry.reviewedAt!)
        const expiryDate = Date.parse(entry.expiresAt!)
        if (Number.isNaN(reviewDate) || Number.isNaN(expiryDate)) addFinding(findings, 'AUTHZ.PUBLIC_REVIEW_DATE_INVALID', 'error', 'high',
          `Public endpoint ${endpoint.method} ${endpoint.path} has invalid review dates.`,
          'Use ISO-8601 dates or timestamps for reviewedAt and expiresAt.',
          { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
        else {
          if (expiryDate < Date.now()) addFinding(findings, 'AUTHZ.PUBLIC_REVIEW_EXPIRED', 'error', 'high',
            `Public endpoint ${endpoint.method} ${endpoint.path} has an expired review.`,
            'Re-review public exposure and renew expiry, or protect the endpoint.',
            { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
          if (Date.now() - Date.parse(entry.reviewedAt!) > reviewMaxAgeDays * 24 * 60 * 60 * 1000) addFinding(findings, 'AUTHZ.PUBLIC_REVIEW_STALE', 'warning', 'high',
            `Public endpoint ${endpoint.method} ${endpoint.path} was reviewed more than ${reviewMaxAgeDays} days ago.`,
            'Re-review the public exposure and update review metadata.',
            { feature: endpoint.feature, file: endpoint.file, line: endpoint.line })
        }
      }
    }
  }

  for (const entry of declared) {
    if (featureFilter && entry.feature !== featureFilter) continue
    if (!discoveredKeys.has(routeKey(entry))) addFinding(findings, 'AUTHZ.ORPHAN_DECLARATION', 'warning', 'high',
      `Permission declaration has no matching discovered endpoint: ${entry.method} ${entry.path}.`,
      'Remove the stale entry or improve route discovery if this endpoint is dynamically registered.',
      { feature: entry.feature, file: '.elysia9x/permissions.json' })
  }

  if (!(await fileExists(policyPath))) addFinding(findings, 'AUTHZ.POLICY_REGISTRY_MISSING', 'warning', 'high',
    '.elysia9x/policies.json is missing.',
    'Create a policy registry and version policy identifiers and their tests.',
    { file: toPosix(path.relative(root, policyPath)) })

  return endpoints.map((endpoint) => {
    const entry = declarations.get(routeKey(endpoint))
    if (!entry) return { ...endpoint, access: 'unreviewed' as const, reviewStatus: 'unreviewed' as const }
    const reviewDatesValid = Boolean(entry.reviewedAt && entry.expiresAt
      && !Number.isNaN(Date.parse(entry.reviewedAt)) && !Number.isNaN(Date.parse(entry.expiresAt)))
    const isExpired = reviewDatesValid && Date.parse(entry.expiresAt!) < Date.now()
    const isStale = reviewDatesValid && Date.now() - Date.parse(entry.reviewedAt!) > reviewMaxAgeDays * 24 * 60 * 60 * 1000
    const isIncomplete = !entry.reviewer || !reviewDatesValid || (entry.access === 'public' && !entry.reason)
    const reviewStatus = isExpired ? 'expired' : isIncomplete ? 'incomplete' : isStale ? 'stale' : 'current'
    return {
      ...endpoint,
      access: entry.access === 'protected' || entry.access === 'public' ? entry.access : 'unreviewed',
      ...(entry.policy ? { policy: entry.policy } : {}),
      reviewStatus,
    }
  })
}
