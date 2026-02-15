# SkillGarden -- Remaining Work

## Security (Priority)
- [ ] Rotate ElevenLabs key (old `sk_4cbf...` exposed in git history)
- [ ] Rotate Blaxel key (old `bl_aaab...` exposed in git history)
- [ ] Rotate White Circle key (old `wc-83d4...` exposed in git history)
- [ ] After rotating, update Vercel env vars: `vercel env rm <NAME> production` then `vercel env add <NAME> production` from `mockup/` dir

## Serverless Proxy
- [ ] Create `mockup/api/blaxel.js` -- Vercel serverless function that reads `process.env.BLAXEL_API_KEY` and proxies requests to the Blaxel agent
- [ ] Create `mockup/api/elevenlabs.js` -- same pattern for ElevenLabs
- [ ] Create `mockup/api/whitecircle.js` -- same pattern for White Circle
- [ ] Update `blaxel-client.js` to call `/api/blaxel` instead of direct Blaxel URL
- [ ] Without the proxy, the demo still works via client-side keyword matching fallback

## Testing
- [ ] Open `dashboard.html` in browser -- verify neutral constellation (uniform blue-grey, no level numbers)
- [ ] Paste "AI Boom in Finance" -- verify illumination lights up relevant nodes
- [ ] Click "Assess My Knowledge" -- verify quiz questions appear
- [ ] Complete assessment -- verify nodes gain tier colors and level numbers
- [ ] Reset -- verify constellation returns to neutral
- [ ] Verify on `skillgarden.vercel.app` after deploy

## Minor Polish
- [ ] `index.html` line 105: CTA says "Enter Yavuz's Dashboard" -- update text if needed
- [ ] Git branch mismatch: local `main` tracks remote `master` -- consider aligning
