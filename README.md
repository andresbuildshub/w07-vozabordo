# Voz a Bordo · w07-vozabordo

**Live:** https://w07-vozabordo.vercel.app · Crystal Ball Studio, Week 7 (AI 2041 ch. 6 "The Holy Driver") · T7 · ADVERSARY

Helps whoever runs a road-safety program on CDMX's concession routes test a Zusha!-style passenger sticker: pick routes with real crash data, find out **before spending** whether the public ledger can see the effect, assign sticker vs control at random, count stickers placed (on-device QR), and evaluate against a placebo. It never records a chofer, a unit, a plate or a complaint.

- **Data:** SSC "hechos de tránsito" 2018–2024 (vehicle type MICROBUS, 3,107 events) + CDMX static GTFS (137 concession-corridor routes). Rebuild with `python scripts/build_data.py` (inputs listed in its header).
- **Model:** Empirical Bayes route ranking, DBSCAN hotspots, Monte Carlo power (offline); permutation test in the browser.
- **Docs:** `docs/CHARTER.md`, `docs/PACKET.md` (mockup + mermaid), `docs/PROMPTS.md`, `docs/DECISIONS.md`.
- **Tests:** `npm test` (6 node tests). E2E with Playwright against production (fake camera feeding a real QR).
- **Env (Vercel only):** `BLOB_READ_WRITE_TOKEN`, `PROGRAM_CODE`.
