# Charter — w07-vozabordo · "Voz a Bordo"

> The constitution of this product. When my agent and I disagree about a feature at 2am, this is the referee. Written BEFORE the first line of code (2026-09-23).

**What it exists to do:** help whoever runs a road-safety program on CDMX's concession routes pick WHICH routes should get a passenger sticker ("you have the right to tell him: slow down, please"), assign them at random against control routes, and find out, on the public crash ledger and without watching anyone, whether crashes went down. And before spending a peso: tell them honestly whether the ledger CAN see the effect.

**For whom:** the coordinator of a road-safety program (SEMOVI, an NGO, a route organization that wants to try it). Second actor: the passenger who reads the sticker and scans its QR.

**What it will never do:**
1. Record a chofer, a unit, a plate or a license plate. No field in the database identifies a vehicle.
2. Store a complaint, a rating or a passenger report. The heckle happens between two people inside the micro and leaves no record.
3. Publish a route-level number when the route runs fewer than 11 units (a ramal of 8 is identifiable in an afternoon).
4. Say "it worked" without a control group and without showing the placebo.
5. Pass off an estimate as a measurement: everything simulated, estimated or computed by a model is labeled on screen.
6. Be a ride-hailing app or a complaints app.

**Long view (3 sentences):** if this slice worked, in three years Voz a Bordo is the protocol by which CDMX (and then the metro area, once Edomex has a crash ledger) tests passenger-side safety interventions route by route, with random assignment and a public placebo, the way Kenya did with Zusha!. The random assignments and the results would be open data, so the program can't choose "its" routes after the fact. The load-bearing walls: the chofer never carries a device, no record identifies a unit or a person, and nothing gets published below the minimum group size.
