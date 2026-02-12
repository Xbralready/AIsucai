# Veo API Pricing Comparison: Cheapest Access Methods (Feb 2026)

> **Data collected**: 2026-02-11 | **Exchange rate used**: 1 USD = 7.25 CNY (approximate)
> **Note**: All Veo models generate 8-second videos by default. Prices are per-second unless noted.

---

## 1. MASTER COMPARISON TABLE: Per-Second Pricing (USD)

| Provider | Model | No Audio | With Audio | 4K w/ Audio |
|----------|-------|----------|------------|-------------|
| **Google Gemini API** | Veo 2 | -- | $0.35/s | -- |
| **Google Gemini API** | Veo 3 Fast | -- | $0.15/s | -- |
| **Google Gemini API** | Veo 3 Standard | -- | $0.40/s | -- |
| **Google Gemini API** | Veo 3.1 Fast | -- | $0.15/s | $0.35/s |
| **Google Gemini API** | Veo 3.1 Standard | -- | $0.40/s | $0.60/s |
| **fal.ai** | Veo 3 Fast | $0.10/s | $0.15/s | -- |
| **fal.ai** | Veo 3 Standard | $0.20/s | $0.40/s | -- |
| **fal.ai** | Veo 3.1 Fast | $0.10/s | $0.15/s | $0.35/s |
| **fal.ai** | Veo 3.1 Standard | $0.20/s | $0.40/s | $0.60/s |
| **Replicate** | Veo 3 Fast | $0.10/s | $0.15/s | -- |
| **Replicate** | Veo 3.1 Fast | $0.10/s | $0.15/s | -- |
| **Replicate** | Veo 3.1 Standard | -- | $0.40/s | -- |
| **Kie.ai** | Veo 3 Fast | -- | $0.05/s* | -- |
| **Kie.ai** | Veo 3 Quality | -- | $0.25/s* | -- |
| **CometAPI** | veo3-fast | -- | ~$0.05/s* | -- |
| **CometAPI** | veo3-pro | -- | ~$0.25/s* | -- |
| **YingTu/LaoZhang** | Veo 3.1 Fast | -- | ~$0.03/s* | -- |
| **YingTu/LaoZhang** | Veo 3.1 Quality | -- | ~$0.08/s* | -- |
| **AIMLAPI** | Veo 3 | -- | $0.79/s | -- |
| **Novita.ai** | Veo 3 (video only) | $0.50/s | $0.75/s | -- |

> *Kie.ai, CometAPI, and YingTu/LaoZhang use flat per-video pricing; per-second rate is derived by dividing by 8s.

---

## 2. PER-VIDEO COST COMPARISON (8-second video, WITH AUDIO, 720p/1080p)

| Provider | Model | 8s Cost (USD) | 8s Cost (CNY) | Rank |
|----------|-------|---------------|---------------|------|
| **YingTu/LaoZhang** | Veo 3.1 Fast | ~$0.15 | ~1.09 | 1 (CHEAPEST) |
| **YingTu/LaoZhang** | Veo 3.1 Quality | ~$0.65 | ~4.71 | 2 |
| **Kie.ai** | Veo 3 Fast | $0.40 | 2.90 | 3 |
| **CometAPI** | veo3-fast | $0.40 | 2.90 | 3 (tie) |
| **fal.ai** | Veo 3 Fast / 3.1 Fast | $0.80* | 5.80 | 5 |
| **fal.ai** | Veo 3.1 Fast (no audio) | $0.80 | 5.80 | 5 (tie) |
| **Replicate** | Veo 3 Fast / 3.1 Fast | $1.20 | 8.70 | 7 |
| **Google Gemini API** | Veo 3 Fast / 3.1 Fast | $1.20 | 8.70 | 7 (tie) |
| **Kie.ai** | Veo 3 Quality | $2.00 | 14.50 | 9 |
| **CometAPI** | veo3-pro / veo3 | $2.00 | 14.50 | 9 (tie) |
| **fal.ai** | Veo 3 Std / 3.1 Std | $3.20 | 23.20 | 11 |
| **Google Gemini API** | Veo 3 / 3.1 Standard | $3.20 | 23.20 | 11 (tie) |
| **Replicate** | Veo 3.1 Standard | $3.20 | 23.20 | 11 (tie) |
| **AIMLAPI** | Veo 3 | $6.32 | 45.82 | 14 |
| **Novita.ai** | Veo 3 (w/ audio) | $6.00 | 43.50 | 15 |

> *fal.ai bills $0.10/s (no audio) or $0.15/s (with audio) for fast models. 8s with audio = $1.20. The $0.80 figure is for 8s WITHOUT audio.

### CORRECTED fal.ai breakdown for 8s video:
- Veo 3/3.1 Fast, no audio: 8 x $0.10 = **$0.80 (5.80 CNY)**
- Veo 3/3.1 Fast, with audio: 8 x $0.15 = **$1.20 (8.70 CNY)**
- Veo 3/3.1 Std, no audio: 8 x $0.20 = **$1.60 (11.60 CNY)**
- Veo 3/3.1 Std, with audio: 8 x $0.40 = **$3.20 (23.20 CNY)**

---

## 3. COST BY VIDEO DURATION (with audio, 1080p, Fast tier)

### Cheapest Option: YingTu/LaoZhang (flat per-video pricing)

| Duration | YingTu Fast | fal.ai Fast | Replicate Fast | Google Gemini |
|----------|-------------|-------------|----------------|---------------|
| 5s | ~$0.15 (1.09 CNY) | $0.75 (5.44 CNY) | $0.75 (5.44 CNY) | $0.75 (5.44 CNY) |
| 8s | ~$0.15 (1.09 CNY) | $1.20 (8.70 CNY) | $1.20 (8.70 CNY) | $1.20 (8.70 CNY) |
| 10s* | ~$0.30 (2.18 CNY) | $1.50 (10.88 CNY) | $1.50 (10.88 CNY) | $1.50 (10.88 CNY) |
| 15s* | ~$0.30 (2.18 CNY) | $2.25 (16.31 CNY) | $2.25 (16.31 CNY) | $2.25 (16.31 CNY) |

> *Videos >8s require multiple generations stitched together. YingTu flat-rate pricing per video may apply per generation.

### Standard/Quality Tier (with audio, 1080p)

| Duration | Kie.ai Quality | fal.ai Std | Google Gemini Std |
|----------|---------------|------------|-------------------|
| 5s | ~$1.25 (9.06 CNY) | $2.00 (14.50 CNY) | $2.00 (14.50 CNY) |
| 8s | $2.00 (14.50 CNY) | $3.20 (23.20 CNY) | $3.20 (23.20 CNY) |
| 10s* | ~$2.50 (18.13 CNY) | $4.00 (29.00 CNY) | $4.00 (29.00 CNY) |
| 15s* | ~$3.75 (27.19 CNY) | $6.00 (43.50 CNY) | $6.00 (43.50 CNY) |

---

## 4. FREE TIERS & TRIAL CREDITS

| Provider | Free Tier / Credits | Notes |
|----------|-------------------|-------|
| **Google Gemini API** | NO free tier for Veo | New Google Cloud accounts may get promotional credits; students get Pro free for 1 year in some regions |
| **fal.ai** | ~$1-10 promotional credits | Varies; promotional codes like "MOCHILAUNCH10" have offered $10; sign up and check |
| **Replicate** | Limited free compute credits | Small amount for community models; requires payment method on file |
| **Kie.ai** | Free initial credits on signup | Can test in their Playground; exact amount varies |
| **CometAPI** | Not confirmed | Check their platform for current offers |
| **YingTu/LaoZhang** | Not confirmed | Min deposit $5; ~33 Fast videos at $0.15 each |
| **AIMLAPI** | Not confirmed | -- |
| **Novita.ai** | Not confirmed | -- |

---

## 5. PROVIDER-BY-PROVIDER DETAILED BREAKDOWN

### A. Google Gemini API (Official)
- **URL**: https://ai.google.dev/gemini-api/docs/pricing
- **Models**: Veo 2 ($0.35/s), Veo 3 Fast ($0.15/s), Veo 3 Std ($0.40/s), Veo 3.1 Fast ($0.15/s), Veo 3.1 Std ($0.40/s)
- **Audio**: Included by default; no discount for disabling audio on Gemini API
- **4K**: Veo 3.1 Fast 4K = $0.35/s, Veo 3.1 Std 4K = $0.60/s
- **Free tier**: None for video generation
- **Pros**: Official, most reliable, full model access
- **Cons**: No audio-off discount; mid-range pricing

### B. fal.ai
- **URL**: https://fal.ai/models/fal-ai/veo3.1/fast
- **Models**: Veo 3 Fast, Veo 3 Std, Veo 3.1 Fast, Veo 3.1 Std
- **Key advantage**: Audio-off discount (saves ~33%)
- **Veo 3.1 Fast**: $0.10/s (no audio), $0.15/s (with audio)
- **Veo 3.1 Std**: $0.20/s (no audio), $0.40/s (with audio)
- **4K**: Veo 3.1 Fast 4K = $0.30/s (no audio), $0.35/s (audio); Veo 3.1 Std 4K = $0.40/s (no audio), $0.60/s (audio)
- **Pros**: Transparent per-second pricing; audio-off savings; wide model selection
- **Cons**: No flat per-video pricing; slightly more expensive than budget providers

### C. Replicate
- **URL**: https://replicate.com/google/veo-3-fast
- **Models**: Veo 3 Fast, Veo 3.1 Fast, Veo 3.1 Standard
- **Veo 3 Fast**: $0.10/s (no audio), $0.15/s (with audio)
- **Veo 3.1 Fast**: $0.10/s (no audio), $0.15/s (with audio)
- **Veo 3.1 Standard**: ~$0.40/s
- **Pros**: Well-known platform; good developer experience; transparent pricing
- **Cons**: Similar to fal.ai pricing; limited free credits

### D. Kie.ai (Budget Option)
- **URL**: https://kie.ai/v3-api-pricing
- **Models**: Veo 3 Fast, Veo 3 Quality
- **Veo 3 Fast**: $0.40 per 8s video (~$0.05/s)
- **Veo 3 Quality**: $2.00 per 8s video (~$0.25/s)
- **Credit system**: $0.005 per credit
- **Free credits**: Yes, upon signup
- **Pros**: 60-70% cheaper than fal.ai/Replicate for equivalent quality
- **Cons**: Less well-known; reliability unverified; limited to Veo 3 (not 3.1 confirmed)

### E. CometAPI (Budget Option)
- **URL**: https://www.cometapi.com
- **Models**: veo3-fast, veo3, veo3-pro, veo3-pro-frames
- **veo3-fast**: $0.40 per video
- **veo3 / veo3-pro**: $2.00 per video
- **veo3-pro-frames**: $0.40 per video
- **Pros**: Flat per-video pricing; very affordable
- **Cons**: Less transparent; reliability concerns

### F. YingTu / LaoZhang.ai (CHEAPEST)
- **URL**: https://yingtu.ai / https://docs.laozhang.ai
- **Models**: Veo 3.1 Fast, Veo 3.1 Standard
- **Veo 3.1 Fast**: ~$0.15 per video (FLAT RATE, regardless of duration up to 8s)
- **Veo 3.1 Quality**: ~$0.65 per video
- **Min deposit**: $5 (~33 Fast videos)
- **Pros**: Cheapest option found; 79-95% savings vs official; good for China-based devs (low latency ~20ms)
- **Cons**: Limited track record; potential reliability concerns; claims seem extremely aggressive

### G. AIMLAPI
- **URL**: https://aimlapi.com/veo-3
- **Veo 3**: $0.79/s ($6.32 per 8s video)
- **Verdict**: MOST EXPENSIVE option; avoid

### H. Novita.ai
- **URL**: https://novita.ai
- **Veo 3 (video only)**: $0.50/s; **with audio**: $0.75/s
- **Verdict**: Expensive; avoid for Veo specifically

---

## 6. RANKING: CHEAPEST TO MOST EXPENSIVE (8s video, with audio)

| Rank | Provider | Model | 8s Video Cost | CNY |
|------|----------|-------|---------------|-----|
| 1 | YingTu/LaoZhang | Veo 3.1 Fast | $0.15 | 1.09 |
| 2 | Kie.ai | Veo 3 Fast | $0.40 | 2.90 |
| 3 | CometAPI | veo3-fast | $0.40 | 2.90 |
| 4 | YingTu/LaoZhang | Veo 3.1 Quality | $0.65 | 4.71 |
| 5 | fal.ai | Veo 3.1 Fast (no audio) | $0.80 | 5.80 |
| 6 | fal.ai | Veo 3.1 Fast (w/ audio) | $1.20 | 8.70 |
| 7 | Replicate | Veo 3.1 Fast (w/ audio) | $1.20 | 8.70 |
| 8 | Google Gemini | Veo 3.1 Fast | $1.20 | 8.70 |
| 9 | Kie.ai | Veo 3 Quality | $2.00 | 14.50 |
| 10 | CometAPI | veo3-pro | $2.00 | 14.50 |
| 11 | Google Gemini | Veo 2 | $2.80 | 20.30 |
| 12 | fal.ai | Veo 3.1 Std (w/ audio) | $3.20 | 23.20 |
| 13 | Google Gemini | Veo 3.1 Std | $3.20 | 23.20 |
| 14 | Novita.ai | Veo 3 (w/ audio) | $6.00 | 43.50 |
| 15 | AIMLAPI | Veo 3 | $6.32 | 45.82 |

---

## 7. RECOMMENDATIONS

### Best Overall Value (Trusted Platform)
**fal.ai Veo 3.1 Fast** -- $0.10/s without audio ($0.80/video) or $0.15/s with audio ($1.20/video). Well-established platform with transparent pricing and good developer experience.

### Cheapest Possible (If You Accept Risk)
**YingTu/LaoZhang** -- $0.15 per video flat rate. Extremely cheap but limited track record. Good for China-based developers needing low latency.

### Best Budget Option with Free Credits
**Kie.ai** -- $0.40 per 8s Fast video with free credits on signup. Good entry point for testing.

### Best for Production Use
**Google Gemini API** or **fal.ai** -- Official Google pricing is transparent and reliable at $0.15/s for Veo 3.1 Fast. fal.ai matches this rate and adds audio-off discounts.

### Key Cost-Saving Tips
1. Use **Veo 3.1 Fast** instead of Standard -- saves 62.5% with minimal quality loss
2. Disable audio if not needed -- saves ~33% on fal.ai/Replicate
3. Use 720p/1080p instead of 4K -- saves ~50% on 4K surcharges
4. Consider batch generation during off-peak hours on some platforms
5. Start with Kie.ai free credits to test before committing to a provider

---

## 8. DATA QUALITY NOTES

- Pricing from Google Gemini API is from official documentation (high confidence)
- fal.ai and Replicate pricing is from their official model pages (high confidence)
- Kie.ai and CometAPI pricing is from their marketing pages (medium confidence)
- YingTu/LaoZhang pricing is from third-party review sites (low-medium confidence; claims of 95% savings should be verified)
- All prices are subject to change; verify on provider websites before committing
- USD to CNY conversion at 7.25 is approximate; check live rates
