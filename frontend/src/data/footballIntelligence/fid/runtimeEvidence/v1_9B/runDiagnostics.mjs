import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const frontend = resolve(here, '../../../../../..')
const sha = (path) => createHash('sha256').update(readFileSync(path)).digest('hex').toUpperCase()
const check = (condition, message) => { if (!condition) throw new Error(message) }

const metadata = JSON.parse(readFileSync(join(here, 'OfficialPackageMetadata.json'), 'utf8'))
check(metadata.name === 'pg' && metadata.selectedVersion === '8.22.0', 'exact package identity mismatch')
check(metadata.distTags.latest === '8.22.0' && metadata.deprecated === false && metadata.prerelease === false, 'release gate mismatch')
check(metadata.dist.integrity.startsWith('sha512-') && metadata.dist.tarball === 'https://registry.npmjs.org/pg/-/pg-8.22.0.tgz', 'integrity gate mismatch')
check(metadata.repository.includes('brianc/node-postgres'), 'repository mismatch')
check(metadata.license === 'MIT' && metadata.engines.node === '>= 16.0.0', 'license/engine mismatch')
check(!existsSync(join(frontend, 'node_modules/pg')), 'pg unexpectedly present')

const fidMigrations = readdirSync(join(frontend, 'src/data/footballIntelligence/fid/persistence/deployment/sql')).filter((x) => /^\d{3}_.*\.sql$/.test(x)).sort()
check(fidMigrations.length === 14 && fidMigrations[0].startsWith('001_') && fidMigrations[13].startsWith('014_'), 'FID migration inventory mismatch')
check(!fidMigrations.some((x) => x.startsWith('015_')), 'migration 015 present')
const supabase = readdirSync(join(frontend, 'supabase/migrations')).sort()
check(JSON.stringify(supabase) === JSON.stringify(['20260714_create_research_repository_tables.sql']), 'Supabase inventory mismatch')

for (const [dir, file] of [['v1_8B', 'refV1_8BAdditiveInventory.json'], ['v1_9', 'refV1_9AdditiveInventory.json'], ['v1_9A', 'refV1_9AAdditiveInventory.json']]) {
  const inventoryPath = join(here, '..', dir, file)
  const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'))
  for (const entry of inventory.entries) {
    const path = entry.relativePath.startsWith('src/') ? join(frontend, entry.relativePath) : join(dirname(inventoryPath), entry.relativePath)
    check(sha(path) === entry.sha256, `${dir} entry mismatch: ${entry.relativePath}`)
  }
  const ordered = dir === 'v1_8B'
    ? inventory.entries
    : inventory.entries.map((entry) => ({ relativePath: entry.relativePath, sha256: entry.sha256 }))
  const aggregate = createHash('sha256').update(JSON.stringify(ordered)).digest('hex').toUpperCase()
  check(aggregate === inventory.aggregateSha256, `${dir} aggregate mismatch`)
}

const decision = readFileSync(join(here, 'InstallationReadinessGates.md'), 'utf8')
check(decision.includes('OUTCOME_B_EXACT_PG_VERSION_APPROVED_BUT_INSTALLATION_AUTHORIZATION_REQUIRES_INDEPENDENT_REVIEW'), 'outcome absent')
check(!readdirSync(here).some((x) => /Authorization/i.test(x)), 'authorization artifact must be absent')
console.log('REF-V1.9B read-only diagnostics: PASS')
