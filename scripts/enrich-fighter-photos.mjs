/**
 * enrich-fighter-photos.mjs
 * 
 * Télécharge automatiquement les photos des fighters depuis UFC.com
 * et les upload dans le bucket Supabase "fighters".
 * 
 * Usage :
 *   node enrich-fighter-photos.mjs
 * 
 * Prérequis :
 *   npm install @supabase/supabase-js node-fetch
 * 
 * Variables à renseigner ci-dessous :
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// ── CONFIG — à remplir ────────────────────────────────────────
const SUPABASE_URL = 'https://pyditxaqdbmyxcuzttzd.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZGl0eGFxZGJteXhjdXp0dHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDU2MTM4MSwiZXhwIjoyMDkwMTM3MzgxfQ.dBkVl_NZPt8r5iWfM12ViooIq9N3QaCvSMD8sWr-884'
// Délai entre chaque requête (ms) pour ne pas surcharger UFC.com
const DELAY_MS = 800
// Mettre à true pour écraser les photos déjà existantes
const OVERWRITE_EXISTING = false
// ─────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

/**
 * Cherche un fighter sur UFC.com par son nom
 * et retourne l'URL de sa photo officielle
 */
async function fetchUFCPhoto(fighterName) {
  try {
    // UFC.com a une API de recherche publique
    const slug = fighterName
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')

    const searchUrl = `https://www.ufc.com/athlete/${slug}`
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      timeout: 10000,
    })

    if (!res.ok) return null

    const html = await res.text()

    // Extraire l'image principale du profil UFC
    const imgMatch = html.match(
      /<img[^>]+class="[^"]*hero-profile__image[^"]*"[^>]+src="([^"]+)"/
    ) || html.match(
      /property="og:image"\s+content="([^"]+)"/
    )

    if (!imgMatch) return null

    let imgUrl = imgMatch[1]
    // S'assurer que c'est une URL absolue
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl
    if (!imgUrl.startsWith('http')) return null
    // Filtrer les images génériques UFC (pas des photos de fighters)
    if (imgUrl.includes('placeholder') || imgUrl.includes('default') || imgUrl.includes('logo')) return null

    return imgUrl
  } catch (err) {
    return null
  }
}

/**
 * Télécharge une image depuis une URL et retourne le buffer
 */
async function downloadImage(url) {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 15000,
    })
    if (!res.ok) return null
    const buffer = await res.buffer()
    // Vérifier que c'est bien une image (magic bytes)
    if (buffer.length < 100) return null
    return buffer
  } catch {
    return null
  }
}

/**
 * Upload une image dans le bucket Supabase et met à jour le profil
 */
async function uploadToSupabase(fighterId, fighterName, imageBuffer, contentType = 'image/jpeg') {
  const ext = contentType.includes('png') ? 'png' : 'jpg'
  const path = `${fighterId}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('fighters')
    .upload(path, imageBuffer, { contentType, upsert: true })

  if (uploadErr) throw new Error(`Upload error: ${uploadErr.message}`)

  const { data: urlData } = supabase.storage.from('fighters').getPublicUrl(path)
  const publicUrl = urlData.publicUrl + '?t=' + Date.now()

  const { error: updateErr } = await supabase
    .from('fighters')
    .update({ photo_url: publicUrl })
    .eq('id', fighterId)

  if (updateErr) throw new Error(`DB update error: ${updateErr.message}`)

  return publicUrl
}

async function main() {
  console.log('🥊 Octagon Picks — Enrichissement photos fighters\n')

  // Récupérer les fighters sans photo (ou tous si OVERWRITE_EXISTING)
  let query = supabase.from('fighters').select('id, name, photo_url').order('name')
  if (!OVERWRITE_EXISTING) {
    query = query.is('photo_url', null)
  }

  const { data: fighters, error } = await query
  if (error) { console.error('Erreur Supabase:', error.message); process.exit(1) }
  if (!fighters?.length) { console.log('✅ Tous les fighters ont déjà une photo !'); return }

  console.log(`📋 ${fighters.length} fighter(s) à enrichir\n`)

  let success = 0
  let failed = 0
  let skipped = 0

  for (const fighter of fighters) {
    process.stdout.write(`  🔍 ${fighter.name.padEnd(30)} `)

    // 1. Chercher la photo sur UFC.com
    const photoUrl = await fetchUFCPhoto(fighter.name)

    if (!photoUrl) {
      console.log('❌ Photo introuvable')
      failed++
      await sleep(DELAY_MS)
      continue
    }

    // 2. Télécharger l'image
    const buffer = await downloadImage(photoUrl)
    if (!buffer) {
      console.log('❌ Téléchargement échoué')
      failed++
      await sleep(DELAY_MS)
      continue
    }

    // Détecter le type MIME
    const contentType = photoUrl.includes('.png') ? 'image/png' : 'image/jpeg'

    // 3. Upload dans Supabase
    try {
      const savedUrl = await uploadToSupabase(fighter.id, fighter.name, buffer, contentType)
      console.log(`✅ OK (${Math.round(buffer.length / 1024)}kb)`)
      success++
    } catch (err) {
      console.log(`❌ ${err.message}`)
      failed++
    }

    await sleep(DELAY_MS)
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Succès  : ${success}
❌ Échecs  : ${failed}
⏭️  Ignorés : ${skipped}
━━━━━━━━━━━━━━━━━━━━━━━━━━
  `)

  if (failed > 0) {
    console.log(`💡 Pour les fighters non trouvés, vérifie leur nom exact sur ufc.com/athlete/[slug]`)
    console.log(`   Exemple : "Israel Adesanya" → ufc.com/athlete/israel-adesanya`)
  }
}

main().catch(console.error)
