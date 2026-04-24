import { createClient } from '@/lib/supabase/server'
import { createClient as createAdmin } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { fighterId, fighterName } = await req.json()
  if (!fighterId || !fighterName)
    return NextResponse.json({ error: 'fighterId and fighterName required' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
  if (!profile?.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Construire le slug UFC.com
  const slug = fighterName
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim().replace(/\s+/g, '-')

  // Scraper UFC.com
  let photoUrl: string | null = null
  try {
    const res = await fetch(`https://www.ufc.com/athlete/${slug}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(10000),
    })

    if (res.ok) {
      const html = await res.text()
      const match =
        html.match(/<img[^>]+class="[^"]*hero-profile__image[^"]*"[^>]+src="([^"]+)"/) ||
        html.match(/property="og:image"\s+content="([^"]+)"/)

      if (match) {
        let url = match[1]
        if (url.startsWith('//')) url = 'https:' + url
        if (url.startsWith('http') && !/placeholder|default|logo|generic/i.test(url)) {
          photoUrl = url
        }
      }
    }
  } catch {
    return NextResponse.json({ success: false, reason: 'fetch_failed' })
  }

  if (!photoUrl) {
    return NextResponse.json({ success: false, reason: 'not_found', slug })
  }

  // Télécharger l'image
  let imageBuffer: ArrayBuffer
  try {
    const imgRes = await fetch(photoUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(12000),
    })
    if (!imgRes.ok) return NextResponse.json({ success: false, reason: 'download_failed' })
    imageBuffer = await imgRes.arrayBuffer()
    if (imageBuffer.byteLength < 500) return NextResponse.json({ success: false, reason: 'image_too_small' })
  } catch {
    return NextResponse.json({ success: false, reason: 'download_failed' })
  }

  // Upload dans Supabase Storage
  const ext = photoUrl.includes('.png') ? 'png' : 'jpg'
  const storagePath = `${fighterId}.${ext}`
  const contentType = ext === 'png' ? 'image/png' : 'image/jpeg'

  const { error: uploadErr } = await admin.storage
    .from('fighters')
    .upload(storagePath, imageBuffer, { contentType, upsert: true })

  if (uploadErr) return NextResponse.json({ success: false, reason: uploadErr.message })

  const { data: urlData } = admin.storage.from('fighters').getPublicUrl(storagePath)
  const publicUrl = urlData.publicUrl + '?t=' + Date.now()

  const { error: dbErr } = await admin.from('fighters').update({ photo_url: publicUrl }).eq('id', fighterId)
  if (dbErr) return NextResponse.json({ success: false, reason: dbErr.message })

  return NextResponse.json({ success: true, photo_url: publicUrl, size_kb: Math.round(imageBuffer.byteLength / 1024) })
}
