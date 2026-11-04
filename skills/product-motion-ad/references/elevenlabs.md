# ElevenLabs: VO & SFX

## Akses
1. Bila tool `mcp__elevenlabs__creative_*` sudah ada di sesi: pakai langsung
   (`creative_list_voices`, `creative_generate_speech`, `creative_transcribe_audio`, `creative_get_flow_run_status` untuk generation_id/URL hasil). Jangan ulangi panggilan generate untuk "retry" — itu memotong kredit lagi.
2. Bila server belum terpasang: `claude mcp add -s user --transport http elevenlabs https://api.us.elevenlabs.io/v1/mcp`
   (host `api.elevenlabs.io` bisa gagal "Protected resource ... does not match"). User harus login lewat `/mcp` -> elevenlabs -> Authenticate di terminal `claude` (buka dengan tool terminal bila tersedia). Agen tidak bisa memulai OAuth.
3. Bila sudah login tetapi tool belum termuat di sesi ini: jalankan Claude headless dengan env bersih
   (env sesi desktop mengarahkan ke kredit API dan gagal "Credit balance is too low"):
   ```bash
   env -i PATH="$PATH" HOME="$HOME" USERPROFILE="$USERPROFILE" APPDATA="$APPDATA" LOCALAPPDATA="$LOCALAPPDATA" \
     SYSTEMROOT="$SYSTEMROOT" TEMP="$TEMP" TMP="$TMP" USERNAME="$USERNAME" COMPUTERNAME="$COMPUTERNAME" \
     claude -p "$(cat prompt.txt)" --allowedTools "mcp__elevenlabs" "Bash" "Write" "Read"
   ```
   Jalankan dari folder proyek Remotion, di background. Prompt harus menyebut path file keluaran dan meminta verifikasi.

## Memilih suara
- Bila user memberi link `elevenlabs.io/voices/<voice_id>`, pakai voice_id itu persis.
- Selain itu: `creative_list_voices` dengan `languages: ["id"]` (atau bahasa target), `use_cases: ["social_media","advertisement","conversational"]`. Contoh teruji ID: "Zan - Conversational" `zmqLb9Ysr8fUvDD7hXK8` (natural), "Alif" `R2tdno8o9nwUiDvfnMIJ` (profesional, lebih formal).

## Prompt VO (satu take + timestamp)
```
STEP 1 - Text to speech, ONE single continuous take:
- voice_id EXACTLY <ID>. Model: check creative_get_model_schema for a speed parameter; prefer eleven_v3
  if it supports speed, else eleven_multilingual_v2 with speed ~1.15. Stability natural/low, style moderate.
- Delivery: natural human <bahasa> content-creator voiceover, casual like talking to a friend, UPBEAT and
  BRISK (snappy social-media ad pace, short natural pauses). Not robotic, not announcer, not slow,
  not over-excited. No emotion tags.
- Text (exactly): <naskah, satu kalimat per baris>
- If several takes: pick the fastest-paced one that pronounces every word correctly.
- Save to ./public/vo/full.mp3
STEP 2 - Transcribe that audio with creative_transcribe_audio (Scribe), word-level timestamps, <bahasa>.
  Save ./public/vo/words.json as [{"text","start","end"}] (seconds) for every spoken word; drop tag entries.
STEP 3 - Check transcript: first words must be "<kata pembuka>" and every line present. If a word is
  mispronounced, regenerate ONCE and redo steps 1-2.
Final answer: total duration and first 6 transcribed words.
```
Target: ±35 detik untuk ±80 kata. Bila lebih dari 45 detik: pendekkan naskah (jangan memperlambat video).
Audio bisa dipercepat sedikit dengan `playbackRate` di `<Audio>` (pitch tetap) — maks 1.1, dan bagi timestamp dengan rate yang sama.

## Prompt SFX (sekali per proyek, bisa dipakai ulang)
```
Generate professional motion-graphics sound effects (text-to-sound-effects). Clean, modern, premium
tech-ad style, no music, no voice, no long reverb tails. Save each as ./public/sfx/<id>.mp3:
whoosh: fast airy swoosh transition, 0.6s
whoosh-low: deep cinematic whoosh with subtle sub, 0.8s
slam: punchy cinematic impact hit with bass thump, for big text slamming on screen, 1.0s
logo-hit: bright cinematic logo reveal hit with shimmer, 1.5s
click: crisp UI mouse click, 0.2s
pop: soft bubbly UI pop for a notification card appearing, 0.3s
success: short pleasant success chime, two rising notes, 0.8s
typing: soft fast keyboard typing, 1.5s
riser: short tension riser building up, 1.2s
glitch: tiny digital glitch / data blip, 0.3s
Verify each file is non-empty audio.
```

## Mixing (di `DEFS[].sfx`)
- VO volume 1. Whoosh transisi 0.5, slam 0.75, logo-hit 0.5–0.6, click 0.6–0.7, pop 0.2–0.45, typing 0.3, success 0.45–0.5, riser 0.3, glitch 0.3–0.5.
- Letakkan SFX di waktu desain gerakan yang sama (klik saat `press`, pop saat spring kartu mulai, slam saat ketukan hook).
- Tanpa musik latar kecuali user memberi file musik; bila ada: volume 0.12–0.18 dan duck saat VO.
