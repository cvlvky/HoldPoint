/* QCS 2024 reference data — paraphrased from the user's QCS-2024 copy in Google Drive.
   Clause refs use the form S05 P08 §8.3.3 (Section, Part, clause). Values in **bold**. */
const DRIVE_ROOT = "1_4dYlzxob8uoYagZ3bsH9wroVf8wb2vv";

const QCS_SECTIONS = [
  ["00","Preface & Index","1DHT9dNSs98BuaPmOEOyK0PIKhB72BF0i"],
  ["01","General","1RrYd3xXTzIi2dMcCBQVwhJngOva0rnYu"],
  ["02","Quality Assurance & Quality Control","1T5gkNn-ynsi9fzaeVQhwzMp1VXJ4mkH2"],
  ["03","Ground Investigation","1K0-kV_pGi1NGwZNp5RbNrWDJGumCHMO_"],
  ["04","Foundations & Retaining Structures","1Cwo6YoYxw_AXaMdCghKQ9aKG4xGE792R"],
  ["05","Concrete","1Zg-Nd5XVjN1-Yytx1gtvRoldrBIFNkXc"],
  ["06","Road Works","1XUv0bIEjIs-Cihm0uvSiNzeN2f3fZnNG"],
  ["07","Green Construction","1ICMrb38XfOXo9Tt8m5PMStYK6xaRiaAg"],
  ["08","Drainage Works","1z8zh8NwJXbB1IShecl0rgxwlNx6XXtjM"],
  ["09","Mechanical & Electrical Equipment","1VqcSd7x-HD4MLnoOBp6xx52AlhQYSrVY"],
  ["10","Instrumentation, Control & Automation","1h2tk9tNiOBDrD61tW2qtyIBcdQkeQizO"],
  ["11","Health & Safety","1I-6TDHP0W2ycN1cS_uBqg0AIVdUDAfpA"],
  ["12","Earthworks Related to Buildings","1LG0Xj1z8EfuouFoQOrH9kX-H-3blm_wX"],
  ["13","Masonry","1cmw65no7t8ewtm2fCn1-zzGFX5EPoINz"],
  ["14","Roofing","1y52RhvmyCCu_72A9UDLAiFhG-zYBu_OQ"],
  ["15","Insulation of Buildings","1lQ39-CD91zbJPNEEVd0O-QbjOWRLBGZf"],
  ["16","Structural Steel Works","1-w1eyezpz2BCowX1HJUefhZCOocQfFRJ"],
  ["17","Metal Works","1qkRLUQaK90oW5VVgq_2DfhamvdoVP_BC"],
  ["18","Carpentry, Joinery & Ironmongery","1GsUiLOJgSRmyBS8MFByBzKYgNv1P73_n"],
  ["19","Plumbing Works","1SlCCiThw-uA0w5g-1k_dSQUCKMqdEFlw"],
  ["20","Drainage Works for Buildings","1Y-iHdQliBJgUqBgy1SzhWyKjl6P6flu0"],
  ["21","Electrical & Communications Works","1PZEyE90uJlKQXiN6GpBGpWKAWa4IxW_t"],
  ["22","Air Conditioning, Refrigeration & Ventilation","1tkvTEnv2wC_RP7ur8htKlrhx25HMz8i_"],
  ["23","Fire Protection & Life Safety","1dH9PHeAUTM7VKoaYv9pkOdzdM37NzdPN"],
  ["24","Finishes to Buildings","1Ja9Kl_e3I05Fo-yeggkTlod7K2IMJedt"],
  ["25","Glass & Glazing","1GH0HYF7JwREoqfahPyEiKhyY3R3GjMHE"],
  ["26","Painting & Decorating","1PHXKSvp27hOQZjrRkuWNjyAM5ee3OaG1"],
  ["27","External Works","1XGvT-SjwGWco0Or7XSAZ205DC9ND4ljJ"],
  ["28","Landscaping","1ZkyPu8MAse1ofG8wIXvBVacOmlN2NCle"],
  ["29","Railways","1ZKKk2NWtP-00M9wSEoGLCSTcyhG1tFHz"],
  ["30","Project Testing & Commissioning","1eX32EjIEzkNNHO2LefbJgoF7GcgvyGzJ"],
  ["31","Maintenance, Repair & Rehabilitation","1u6Guy5Wls_hScDgeI1uAQZO4Ian1Jd9D"],
  ["32","Environmental Management","1VlIgf9bT53ISf78IlzT87ti6CKAYcGJw"]
];

/* Part PDFs used as clause sources (file ids in the user's Drive) */
const QCS_PARTS = {
  "S05P01":["S05 Part 01 General","1O8KUEbqOhbk_Ke9heLmojGB9RGbWrhi8"],
  "S05P06":["S05 Part 06 Property Requirements","18S3ODfGT3YATWHoYthXoW8-1eiFl-AX5"],
  "S05P07":["S05 Part 07 Concrete Plants","1LE0PspXalHNttvGLOASNhYj_Iov-PrV6"],
  "S05P08":["S05 Part 08 Transportation & Placing","11SeCLEyHmjhSxo0vxiYrR8CSxxr_2y0s"],
  "S05P09":["S05 Part 09 Formwork","1KA2ObPAnI4WeEz3ZL9GOZoge6FR37a4s"],
  "S05P10":["S05 Part 10 Curing","1c0Aa7dRRDcKLEXqs4dMQRlbBfABIAIRC"],
  "S05P11":["S05 Part 11 Reinforcement","1eGmHbWoiZmOcOpOpogTa_jLKVUjMIYez"],
  "S05P12":["S05 Part 12 Joints","1rT4eiZ_0YjKjhUo0fnhUp3QH1UnfLoDA"],
  "S05P13":["S05 Part 13 Testing Hardened Concrete","1EWanP4k5KFUHr8xhSN4jkkt0geoH30wP"],
  "S05P14":["S05 Part 14 Protective Treatments","1S5kRDqtD1Sa_-aMPUn6H6XVCd3DifRb1"],
  "S05P15":["S05 Part 15 Hot Weather Concreting","1pQpmJAc38DM-F7P_QFmTIiprNaYKbZx9"],
  "S05P16":["S05 Part 16 Miscellaneous","1jgQzbE26UTwfRhSYD4xDm5N19MdYjOLW"],
  "S05P17":["S05 Part 17 Structural Precast","1gJ2VigMNM5pTY78t6AT3ayHyyURnH4uk"],
  "S05P19":["S05 Part 19 Water Retaining Structures","1HRgfDYE9cGRrqIo4k9nQWM6sdj_IDjq_"],
  "S05P21":["S05 Part 21 Post-installed Anchors","1LPnXbIaWMkk3LQvP4QK-E2z3YGzLALXD"],
  "S12P02":["S12 Part 02 Excavation","1jVW9JvQAMK6XzYSofSM9Yj-iN5BsIKoM"],
  "S12P03":["S12 Part 03 Filling","1hStv6aV7cuQYd4NSw4arGx6OBpj5q7eb"],
  "S12P04":["S12 Part 04 Utility Trenches","1r6bn82ZE1pI4KGmX-3Y4DjqWhWfQ4DXP"],
  "S12P05":["S12 Part 05 Protective Membranes","1g7UG9p0P3YsB3o2LgYWQxWaCr9FX05Ut"],
  "S13P02":["S13 Part 02 Mortar & Grout","1yqnaR8PIs3WKKkM9GNw95rEvW0ERi2QR"],
  "S13P04":["S13 Part 04 Unit Masonry","1MbywgkDy5rLSsDhXGZsh9YmpcLUV2k8b"],
  "S13P05":["S13 Part 05 Masonry Laying","1eAY-ElsrWt76lcEHuGvwLcYRIB39Q99l"],
  "S04P01":["S04 Part 01 Piling General","1BUv-EUoMFooPNS-SIWSHvhM5l2vUqsry"],
  "S04P02":["S04 Concrete Works for Piling","1-R8R-lXouhYsT8tsBmE5nJQXiCbkzHQ6"],
  "S02P07":["S02 Part 07 Inspection & Test","16607AqvcYciIC66oP11ES8qHcCTGp6Ra"],
  "S02P15":["S02 Part 15 App. A Testing Frequencies","1u8QpHcTGEoJzAA7wtYUtYkv16j8AL9ob"],
  "S02P16":["S02 Part 16 App. B Templates (ITP, NCR)","1r7Ozn49Cf97K5FFegGQpfyfvNM8S6tpP"],
  "S14MEM":["S14 Membrane Roofing","19dVaVMoW3pzcASFtDyksMqtUKJQ_QAgK"],
  "S16ERE":["S16 Accuracy of Erected Steelwork","1BUK34WUwvLybkka_jv54l1kyXy7hrG9h"],
  "S16WLD":["S16 Welding","1sghvo8eoew6a3yyJNCe009_Bt4pJl_nq"],
  "S11PPE":["S11 Personal Protective Equipment","1ytIQceMk0GzkVIMWAdoBpPN5JaHsKUTR"],
  "S31CON":["S31 Repair of Concrete Structures","1QS66lKHUkPJS7qPqeDpoR-j_kpFqBpNp"],
  "S01DEW":["S01 Part 23 Construction Dewatering","1lBtm8hFBztNOv4_RP7tjQ986Lxa-wNDG"]
};

const TOPICS = ["Concrete","Hot weather","Curing","Formwork","Reinforcement","Mix & testing","Hardened concrete","Waterproofing","Earthworks","Masonry","Piling","QA/QC","Safety","Steel"];

/* Rule cards. v = 1 marks values read from a scanned table: confirm in the PDF. */
const RULES = [
{id:"conc-prepour",topic:"Concrete",title:"Before any pour",ref:"S05 P08 §8.1.3, §8.3.2",part:"S05P08",pts:[
"Engineer inspects and approves **in writing** the base, formwork and reinforcement before concrete is placed; give at least **24 h notice** (§8.3.2.1).",
"If the pour does not start within **24 h** of approval, approval must be obtained again; check form cleanliness immediately before the pour.",
"Submit the pour method statement (batching rate, trucks, pumps, sequence, QC, standby plant) at least **3 days** before a major pour; a pre-pour meeting with the supplier may be called (§8.1.3).",
"Wood forms oiled or wetted; reinforcement lightly sprayed with water just before pouring (§8.3.2.2–3).",
"Embedded items, anchor bolts and sleeves fixed with templates; aluminium items fully protected (§8.3.2.4).",
"Remove all water from excavations; divert flows so they never wash over fresh concrete (§8.3.2.6).",
"Runways for barrows/pumps must not rest on reinforcement (§8.3.2.7)."],
tags:"pre-pour inspection notice approval method statement pour card rebar wet excavation dewater"},

{id:"conc-time-temp",topic:"Concrete",title:"Time and temperature limits",ref:"S05 P08 §8.2.1, §8.3.3 · P15 §15.2",part:"S05P08",pts:[
"Truck discharge complete within **90 min** or **300 drum revolutions** after water is added, whichever comes first; the Engineer may set a shorter time in hot weather (§8.2.1).",
"Place within **15 min** of mixing unless carried in agitator trucks (§8.3.3.1).",
"Do not deposit concrete that has started its initial set or has held its water for more than **1.5 h / 300 revolutions** (§8.3.3.7).",
"Fresh concrete at placement **≤ 32 °C** unless trials prove a higher limit; never place above **35 °C** (§15.2.2, P06 §6.3.1.4).",
"No concrete when the shade temperature exceeds **40 °C** (§15.2.3).",
"Measure every truck just before placing and write the temperature on the delivery ticket (§15.2.4)."],
tags:"90 minutes 300 revolutions 32 35 40 temperature truck ticket initial set agitator"},

{id:"conc-placing",topic:"Concrete",title:"Placing concrete",ref:"S05 P08 §8.3.3",part:"S05P08",pts:[
"Place in even horizontal layers, each merged into the previous one before initial set (§8.3.3.2).",
"Free fall **≤ 1.5 m** unless approved; drop vertically through a tapered down-pipe without hitting forms (§8.3.3.5).",
"Never into standing water inside the formwork (§8.3.3.6).",
"No concreting in dust storms, or in continuous heavy rain unless fully covered (§8.3.1.6, §8.3.3.12–13).",
"Underwater placing only for unreinforced work, continuous, with a tremie kept embedded; tremie required where water depth exceeds **1 m** (§8.3.3.14–15).",
"Cold-weather pours follow EN 1992-1-1 / CIRIA 67 / ACI 306; hot-weather pours follow Part 15 (§8.3.3.8–9)."],
tags:"free fall 1.5 m layers tremie dust storm rain standing water"},

{id:"conc-compaction",topic:"Concrete",title:"Compaction",ref:"S05 P08 §8.3.4",part:"S05P08",pts:[
"Poker (immersion) vibrators **≥ 10,000 cycles/min**; external vibrators **≥ 3,000 cycles/min**; standby vibrators on site.",
"Insert vertically at regular spacing, penetrating about **100 mm** into the layer below; withdraw slowly so no voids remain.",
"Do not touch reinforcement or forms; never use the vibrator to move concrete sideways.",
"Stop vibrating once water or grout appears at the surface; start as soon as there is enough concrete to immerse the poker.",
"Trained operators; foreman with **≥ 5 years** placing experience; a steel fixer and a carpenter stand by on every pour (§8.3.4.6, §8.3.4.10)."],
tags:"vibrator poker 10000 cycles 100 mm honeycomb segregation standby"},

{id:"conc-joints",topic:"Concrete",title:"Construction joints and slab bays",ref:"S05 P08 §8.3.2.8, §8.3.3.19–24",part:"S05P08",pts:[
"Against set concrete: roughen, remove laitance and loose particles, moisten, apply grout **not leaner than 1:2** (cement:sand) and place new concrete before the grout sets.",
"Horizontal joints: brush coat of grout, then about **75 mm** of the mix with coarse aggregate reduced by **50 %**.",
"Ground slabs where joints are not detailed: strips **≤ 4.0 m** wide in alternate sequence, **≥ 3 days** between adjacent strips, crack-inducer joints **≤ 5.0 m**, contraction joints **≤ 15.0 m**, a contraction joint at every 4th construction joint (§8.3.3.20).",
"Waterstops held rigidly on profiled stop-ends; joints welded strictly to the manufacturer's method (§8.3.3.21–24).",
"Get the Engineer's acceptance of the casting sequence and joint layout before starting (§8.3.3.22)."],
tags:"construction joint laitance grout 1:2 75 mm waterstop slab on grade bay 4 m 5 m 15 m crack inducer"},

{id:"conc-supervision",topic:"Concrete",title:"Supervision, pumping and records",ref:"S05 P08 §8.2.2–8.3.1",part:"S05P08",pts:[
"Pours supervised by a competent person with **≥ 5 years** concreting experience (§8.3.1.2).",
"Sections thicker than **600 mm** need approved precautions against thermal cracking (§8.3.1.5).",
"Check pump access before the pour; the first lubricating grout through the pump must not go into the permanent works (§8.2.2).",
"Keep pipeline shock away from formwork and fresh concrete; flush chutes and pipes away from the works.",
"Give the Engineer the delivery notes within **24 h** (§8.2.3); provide lighting for night pours and a backup plant arrangement (§8.2.1.4)."],
tags:"pump lubricating grout delivery note 600 mm thermal cracking supervisor 5 years backup plant"},

{id:"hot-period",topic:"Hot weather",title:"Hot-weather period and pour hours",ref:"S05 P15 §15.1.3, §15.3",part:"S05P15",pts:[
"The hot-weather period starts when the maximum shade temperature exceeds **35 °C on 3 consecutive days**, and ends when it stays below 35 °C for 3 consecutive days.",
"Keep a calibrated site thermometer recording shade temperature at a representative spot.",
"During the hot-weather period plan pours so that **no concreting happens between 10:00 and 17:00**.",
"Name one co-ordinator to match batching, delivery and placing rates; issue a weekly concreting programme.",
"Submit temperature-control proposals at least **1 month** before the hot season.",
"Evaporation above **0.75 kg/m²/h**, low humidity or high wind also count as hot-weather conditions (§15.1.3.4)."],
tags:"hot weather 35 three days 10:00 17:00 shade thermometer evaporation 0.75 coordinator"},

{id:"hot-cooling",topic:"Hot weather",title:"Keeping the mix cool",ref:"S05 P15 §15.4–15.6",part:"S05P15",pts:[
"Never add water that raises the w/c ratio; adjust plasticiser within the range stated on the mix design.",
"Shade aggregate stockpiles; sprinkling coarse aggregate is **not permitted**.",
"Chill mixing water (not below **5 °C**) in insulated, white-painted tanks; ice must be fully melted before mixing completes.",
"Cement must be **≤ 75 °C** entering the mixer; no freshly ground hot cement.",
"White-painted truck drums; flush a drum left in the sun with cold water and drain it before batching.",
"Plant checks concrete temperature every **50 m³ or every hour**, whichever is more frequent; liquid nitrogen only with approval."],
tags:"ice chilled water 5 °C cement 75 white drum aggregate shade admixture retarder liquid nitrogen"},

{id:"hot-placing",topic:"Hot weather",title:"Placing in hot conditions",ref:"S05 P15 §15.8–15.10 · P09 §9.4.3.5",part:"S05P15",pts:[
"If the **first truck** of a pour exceeds the temperature limit, do not start.",
"A later truck over the limit is rejected; continuing the pour is the Engineer's decision.",
"Spray formwork with water to cool it before the pour (P09 §9.4.3.5).",
"Control evaporation from the first minutes: fog spray, wind breaks, sun shades.",
"Calibrate site thermometers weekly against a glass thermometer (10–100 °C range); measure per ASTM C1064.",
"Protect test specimens and keep them moist; record casting and transfer times."],
tags:"first truck reject fog spray thermometer calibration specimens"},

{id:"cure-duration",topic:"Curing",title:"How long to cure",ref:"S05 P10 §10.2.1, §10.2.3",part:"S05P10",pts:[
"Cure for **at least 7 days** and until in-place strength reaches **70 %** of specified, whichever is longer (§10.2.1.4).",
"Water curing for the first **7 days**, then water or membrane until the specified strength is reached (§10.2.3.2).",
"Curing runs **24 hours a day**, holidays included, with plant and labour assigned (§10.2.1.1).",
"Low w/c mixes are preferably water cured (§10.2.1.5)."],
tags:"curing 7 days 70 percent water membrane 24 hours holidays"},

{id:"cure-methods",topic:"Curing",title:"Curing methods",ref:"S05 P10 §10.2.3–10.2.11",part:"S05P10",pts:[
"Protect fresh concrete from sun, wind, rain and drying; shade exposed surfaces for the whole curing period.",
"Unformed surfaces: polythene immediately, then wet hessian under **1000-gauge** polythene once hard enough; laps **≥ 100 mm**.",
"Formed surfaces: keep forms on and moist; continue curing as soon as forms are stripped.",
"Membrane compound only after the water sheen has gone and within **2 h** of stripping; never on bleed water; keep the film intact for **14 days** (§10.2.3.7–8, §10.2.8).",
"No membrane where concrete, render or toppings will be bonded unless proven harmless or fully removed.",
"Curing water within **15 °C** of the concrete temperature; aim for no more than about **11 °C** cooler (§10.2.1.3, §10.2.11.3)."],
tags:"hessian polythene 1000 gauge membrane compound 2 hours 14 days thermal shock 15 °C"},

{id:"cure-mass",topic:"Curing",title:"Mass concrete and steam curing",ref:"S05 P10 §10.2.9, §10.2.12 · P06 §6.6.1",part:"S05P10",v:1,pts:[
"Mass concrete = least dimension over **1.5 m** (pile caps, transfer plates) (P06 §6.1.3.7). Monitor with thermocouples.",
"Limits (P06 §6.6.1): placing temperature **≤ 27 °C**, core-to-surface difference **≤ 20 °C**, peak **≤ 70 °C**, temperature drop after curing **≤ 11 °C per 24 h**.",
"Unreinforced mass without GGBS/pozzolan: cure **≥ 2 weeks**; with GGBS/pozzolan **≥ 3 weeks**; reinforced mass **≥ 7 days or 70 %** strength.",
"Do not stop curing until the temperature differential is favourable and the Engineer agrees.",
"Steam curing: start **≥ 2 h** after placing, steam at **65–80 °C**, heating or cooling rate **≤ 22 °C/h**."],
tags:"mass concrete thermocouple 20 °C 70 °C 27 °C 11 °C pile cap raft steam"},

{id:"fw-design",topic:"Formwork",title:"Formwork design and submittals",ref:"S05 P09 §9.1.3–9.1.4",part:"S05P09",v:1,pts:[
"Shop drawings with calculations: panels, props (size and spacing), joists, ties, kickers, joints, penetrations, shoring/reshoring sequence and stripping times.",
"Method statement with risk assessment before work starts; allow the Engineer **14 days** to review (§9.1.3.4–6).",
"Design to BS 5975 and EN 1992-1-1 with Concrete Society TR13; erection supervised by a person with **≥ 5 years** experience.",
"Design loads include pour rate and height, slump, temperature, and a live load of **2.5 kPa** (**3.75 kPa** with motorised carts); minimum combined load **6.5 kPa** (**7.75 kPa**) (§9.1.4.12).",
"Confirm ground under falsework is adequate; get approval before loading any section.",
"Job mock-ups for columns, slabs and beams, staircases and fair-faced concrete before production work (§9.1.4.13)."],
tags:"falsework design BS 5975 TR13 shop drawings props reshoring mock-up live load"},

{id:"fw-erection",topic:"Formwork",title:"Erection checks",ref:"S05 P09 §9.1.4, §9.3.5–9.4",part:"S05P09",pts:[
"Watertight joints and tie holes; adjustable props to line and level; **20 mm chamfers** on exposed corners of columns, walls and beams.",
"Faces clean, no nails, debris or standing water; verify lines and levels before closing.",
"Release agent applied before rebar is placed and kept **off reinforcement** and construction joints.",
"Form ties: no metal left within the cover; snap-tie holes **≤ 10 mm**; safety factor **≥ 1.5**.",
"Top forms where a slope exceeds **15°**; placing/vibration windows where needed; kickers for walls and columns.",
"Conduits: none other than conduits in slabs **≤ 125 mm**; outside diameter **≤ 1/3** of thickness; not below bottom bars or over top bars; in walls spaced **≥ 3 diameters**; supported clear of rebar (§9.4.8).",
"Telltales on supported forms and a watchman checking forms during the pour (§9.4.14)."],
tags:"chamfer 20 mm ties snap tie release agent conduit 125 mm one third telltale kicker"},

{id:"fw-striking",topic:"Formwork",title:"Striking times and reshoring",ref:"S05 P09 §9.5, Table 9.1, §9.8",part:"S05P09",v:1,pts:[
"Minimum periods from placing (Table 9.1): beam sides, walls, columns **1 day**; slab soffits, props left **4 days**; beam/joist/girder soffits, props left **10 days**; props to slabs **11 days**; props to beams **15 days**.",
"Notify the Engineer in writing before removal; strike only when the concrete can resist damage.",
"Wet the concrete as soon as forms loosen and keep it wet until curing is applied; a fog-spray hose must be ready at each location.",
"Reshore beams and slabs immediately after stripping; strike without shock or vibration.",
"Early loading: stress from any load **≤ 0.33** × actual strength at that age; propping through two floors (§9.8).",
"Meeting these periods does not replace passing cube results (§9.5.2.2)."],
tags:"stripping de-shuttering 1 day 4 days 10 days 11 days 15 days reshore props soffit early loading"},

{id:"fw-finish",topic:"Formwork",title:"Finishes and tolerances",ref:"S05 P09 §9.3, §9.5.3, §9.7",part:"S05P09",pts:[
"Formed finishes F1, F2, F3: internal concrete defaults to **F3**, external below ground to **F1**.",
"Exposed F3: no honeycombing, fins, stains or nail marks; minor blowholes **≤ 0.5 %** of each m².",
"Unformed finishes: tamped, floated, steel trowelled, brushed (~**1 mm** texture); non-slip carborundum at **1.5 kg/m²**.",
"Plumb of columns and walls **±5 mm** per storey; full height ≤ 20 m: **±20 mm**; 20–150 m: **±H/1000**; over 150 m: **±150 mm**.",
"Lift shafts: **±5 mm** per storey; full height ≤ 20 m **±10 mm**; 20–150 m **±0.5H/1000**; over 150 m **±75 mm**.",
"Fill tie holes with non-shrink grout; dry-pack repairs per §9.5.4; rub down within **3 days** of striking."],
tags:"F1 F2 F3 fair face blowholes 0.5 percent plumb tolerance lift shaft chamfer dry pack"},

{id:"rb-material",topic:"Reinforcement",title:"Bars, storage and condition",ref:"S05 P11 §11.1–11.2",part:"S05P11",pts:[
"Minimum grade **B500** (ISO 6935 / BS 4449) or ASTM A615 **Grade 75 (520 MPa)**; lower grades only for links/secondary bars **≤ 10 mm** where designed.",
"Mill certificates for every batch and **3 copies** of the test report with each consignment; bundles tagged and traceable.",
"Store on racks **≥ 450 mm** above ground, covered, tagged with schedule and bar mark.",
"No loose rust, mill scale, oil, paint or mud; heavy rust is sand-blasted (never with dune sand).",
"Tie wire **1.6 mm** black annealed; fabric welded intersections ≤ **300 mm** (plain) / **400 mm** (deformed).",
"Exposure class X5: consider epoxy-coated, low-carbon chromium or stainless bars."],
tags:"B500 BS 4449 A615 grade 75 mill certificate storage 450 mm rust tie wire 1.6 mm"},

{id:"rb-testing",topic:"Reinforcement",title:"Rebar testing",ref:"S05 P11 §11.3 · S02 App. A §15.9",part:"S02P15",pts:[
"Contractor tests each bar size at own cost: dimensions and mass, tensile, bend and rebend.",
"Submit results **3 weeks** before concreting starts; full retest when the source changes; failed steel leaves site.",
"Appendix A frequency: tensile **1 test per 30 t** (3 pieces per diameter), bend and rebend **1 per 30 t** each.",
"Mechanical couplers: **1 test per 100 splices**, reducible to 1 per 250 after consecutive passes.",
"Testing is mandatory even when mill certificates exist (App. A note).",
"Give **24 h notice** before closing forms or placing concrete (§11.3.2)."],
tags:"tensile bend rebend 30 t coupler 100 splices mill certificate test frequency"},

{id:"rb-fixing",topic:"Reinforcement",title:"Cutting, bending and fixing",ref:"S05 P11 §11.4–11.5",part:"S05P11",pts:[
"Cut and bend cold to BS 8666 / ISO 3766; never heat; no straightening or rebending without approval.",
"Fix securely so the cage keeps its shape during placing and vibration; tie-wire ends turned inwards.",
"Never use rebar to support walkways or to carry electric current.",
"Laps as drawn or to EN 1992-1-1 / BS 8666; hooks need a straight extension of **≥ 4Ø** (mild steel) or **≥ 6Ø** (high yield).",
"Welding only if authorised: controlled conditions, each run **≤ 5Ø**, no welds at bends, joints staggered.",
"Keep rebar clear of non-ferrous metals; bundled bars and couplers only as detailed.",
"Do not fix reinforcement until the tanking/membrane protection is complete (§11.5.10)."],
tags:"BS 8666 bending heat hooks 4d 6d lap welding coupler tie wire ends tanking"},

{id:"rb-cover",topic:"Reinforcement",title:"Cover and spacers",ref:"S05 P11 §11.5.7 · P06 Table 6.7",part:"S05P06",pts:[
"Use approved spacers: concrete (at least the strength of the member) or plastic; spacer to links equals the nominal cover.",
"Spacer bars between layers: same diameter as main bars but **≥ 25 mm**, at **1.5 m** centres.",
"Minimum cover by exposure (Table 6.7), for C40 / C50 / C60 / C75: **X3** 70 / 65 / 60 / 55 mm; **X4** 75 / 70 / 65 / 60 mm; **X5** 80 / 75 / 70 / 65 mm (triple blend). X0–X2: see Table 6.7.",
"Severe and extreme exposure needs high cement replacement; consider coated bars or surface treatment.",
"Hardened check by covermeter, accurate to **±5 % or ±2 mm** (P13 §13.3)."],
tags:"cover spacer chair X3 X4 X5 70 75 80 mm covermeter exposure"},

{id:"rb-epoxy",topic:"Reinforcement",title:"Epoxy-coated bars",ref:"S05 P11 §11.6",part:"S05P11",pts:[
"Fusion-bonded epoxy only; check every bar visually for holes, cracks and damage.",
"Holidays: up to 2 per 300 mm accepted; **3 or more per 300 mm** means recoat or replace; use a **67.5 V** holiday detector.",
"Patch cut ends before oxidation (end damage ≤ **12 mm**); no flame cutting.",
"Padded slings, no dropping or dragging; dielectric-coated chairs and ties; inspect again before concreting."],
tags:"epoxy coated holiday 67.5 V patch dielectric"},

{id:"mix-exposure",topic:"Mix & testing",title:"Exposure classes in Qatar",ref:"S05 P06 §6.1.3, Tables 6.1–6.2",part:"S05P06",pts:[
"**X0** no risk: blinding, plain concrete. **X1** mild: internal dry, external ≥ 3 m above ground.",
"**X2** moderate: external RC less than 3 m above ground; fluctuating water levels.",
"**X3** aggressive: in contact with groundwater, including the capillary zone; saline water.",
"**X4** severe: within 1 km of the sea or on saline water table/sabkha, more than 3 m above ground.",
"**X5** extreme: as X4 but cyclic wet/dry, less than 3 m above ground or in the capillary zone; splash and tidal zones.",
"Sulphate: **S1** < 1,500 mg/l SO₄; **S2** 1,500–3,000; **S3** 3,001–6,000; **S4** > 6,000; **S5** > 6,000 with Mg > 1,000 mg/l.",
"Two aggressive features that lead to the same class move it up one class (§6.2.1.3)."],
tags:"exposure class X0 X1 X2 X3 X4 X5 sulphate S1 S2 S3 S4 S5 sabkha sea 1 km capillary"},

{id:"mix-grades",topic:"Mix & testing",title:"Grades and mix limits",ref:"S05 P06 Table 6.4, §6.5",part:"S05P06",pts:[
"Grade = 28-day cube strength (150 or 100 mm cubes); 150×300 cylinders may be used. Mixes with FA, SF or GGBS may be judged at 56 or 90 days if approved.",
"Min cementitious / max w/c: **C25** 260 / 0.65 · **C30** 300 / 0.58 · **C35** 320 / 0.55 · **C40** 335 / 0.50 · **C45** 355 / 0.47 · **C50** 370 / 0.45 · **C60** 380 / 0.40 · **C75** 390 / 0.35.",
"Cylinder equivalents: C25→20, C30→25, C35→28, C40→32, C45→35, C50→40, C60→50, C75→60 MPa. Above C75 needs special approval.",
"No calcium chloride or chloride-based admixtures with reinforcement or embedded metal (§6.5.2.2).",
"Below-ground concrete gets surface protection against moisture unless the design says otherwise (§6.5.6.3)."],
tags:"grade C25 C30 C35 C40 C45 C50 C60 C75 cementitious w/c cylinder cube 56 90 days chloride"},

{id:"mix-trials",topic:"Mix & testing",title:"Mix designs and trial mixes",ref:"S05 P06 §6.1.4, §6.6, §6.7",part:"S05P06",pts:[
"Submit mix designs at least **30 days** before placing; mixes with less than 6 months of history are verified by an approved independent lab.",
"Trial mix at least **35 days** before concreting, in the Engineer's presence, using the works plant: **≥ 50 %** of drum capacity and **≥ 3 m³**.",
"Hold the trial in the truck for **120 min** (1–6 rpm), then mix 2 min at full speed; check slump every **30 min** to the longest delivery time.",
"Trial can be waived with **≥ 30** results less than 6 months old from an approved agency.",
"Target mean strength: f'cr = f'c + 1.65 Ss, and f'c + 2.33 Ss − 3.5 (f'c ≤ 35) or 0.9 f'c + 2.33 Ss (f'c > 35); without records f'c + 8.5 (20–35 MPa) or 1.1 f'c + 5 (> 35 MPa).",
"Delivery tickets show cement type and content, cementitious, max aggregate, quantities, admixture, target slump and temperature, w/c and grade.",
"Declare any change of source, or a cement change of more than **20 kg/m³** (§6.7.13)."],
tags:"mix design trial mix 35 days 3 m3 120 min slump retention target mean strength standard deviation delivery ticket"},

{id:"mix-fresh",topic:"Mix & testing",title:"Fresh concrete on site",ref:"S05 P06 §6.3, Table 6.3, §6.8.2",part:"S05P06",pts:[
"Slump to EN 12350-2 (or flow table EN 12350-5), measured at delivery.",
"Slump tolerance for spot samples at first discharge (Table 6.3): target ≤ 40 mm: **−30 / +40**; 50–90 mm: **−40 / +50**; ≥ 100 mm: **−50 / +60** mm.",
"One site adjustment only, with an approved admixture, no increase in w/c, Engineer's approval (§6.8.2.5).",
"Slump must hold for **30 min** from arrival or adjustment; the first and last 0.25 m³ are exempt (§6.8.2.6).",
"Air-entrained concrete: **±1.5 %** of specified air (§6.8.2.7).",
"SCC field checks: slump flow **550–750 mm**; lab V-funnel 6–25 s, L-box > 0.80, J-ring < 10 mm."],
tags:"slump tolerance table 6.3 flow table SCC slump flow air content adjustment admixture"},

{id:"mix-cubes",topic:"Mix & testing",title:"Cubes: sampling and handling",ref:"S05 P06 §6.8.2, §6.9 · S02 App. A §15.17",part:"S02P15",pts:[
"Appendix A: **1 set (6 cubes) per 30 m³**, and at least **1 set per mix per day**; both 7-day (3 cubes) and 28-day (2 cubes) tests are mandatory.",
"S05 §6.8.2(8)(a) asks for **at least 7 specimens** per sample (2 at 7 d, 3 at 28 d, 2 spare). Agree the count in your ITP.",
"Record slump and temperature every time you sample (§6.9.3).",
"Mould on a level base (within **20 mm per m**); keep at **20–26 °C** for up to 48 h without moisture loss; do not move before **14 h**.",
"Transport to the lab within **4 h**, shaded and cushioned.",
"Mark each cube: time, date, sampler, element, mix reference, ticket number, technician."],
tags:"cube sampling frequency 30 m3 set 6 cubes 7 days 28 days curing 20 26 °C 14 h transport 4 h marking"},

{id:"mix-accept",topic:"Mix & testing",title:"Strength acceptance",ref:"S05 P06 §6.8.2(8)(g)",part:"S05P06",pts:[
"EN 206 route (as written in QCS): average of test results **≥ fck + 2 MPa**, and every individual result **≥ fck − 4 MPa**. A result is the mean of 2 or more specimens of one sample at the same age.",
"ACI 318 route: every average of 3 consecutive tests **≥ f'c**; no single test below **f'c − 3.5 MPa** (f'c ≤ 35) or **0.9 f'c** (f'c > 35).",
"Discard specimens with clear sampling or curing defects; a range over **15 %** of the mean is set aside unless investigated.",
"7-day failures can stop the work pending 28-day results; confirmed failures lead to in-situ assessment (P13).",
"Fibre-reinforced concrete is not accepted on compressive strength alone."],
tags:"acceptance criteria fck +2 -4 ACI 318 3.5 MPa 0.9 consecutive tests failure"},

{id:"mix-reject",topic:"Mix & testing",title:"When to reject concrete",ref:"S05 P06 §6.10",part:"S05P06",pts:[
"Reject a load with the wrong class or grade, slump or temperature outside limits, oversized aggregate, or w/c over the maximum.",
"Unsatisfactory results can stop the work; failed work may be broken out and rebuilt at the contractor's cost.",
"Honeycombed or defective work can be rejected even with good cubes.",
"No repair until the Engineer has inspected and accepted the method; unapproved repairs are themselves grounds for rejection."],
tags:"reject truck wrong grade slump temperature honeycomb repair approval"},

{id:"hc-cores",topic:"Hardened concrete",title:"Cores and non-destructive tests",ref:"S05 P13",part:"S05P13",pts:[
"NDT is never the sole basis to accept or reject; use it to evaluate when cubes fail. Testing by an approved independent lab.",
"Cores **≥ 100 mm** diameter (preferably ≥ 3× max aggregate, never < 2×); avoid cutting bars; 100 mm cores for ≤ 20 mm aggregate, 150 mm for ≤ 40 mm.",
"Core length before capping **≥ 0.95 D**; prepared length **1.0–1.2 D**; assess per EN 13791 (or ACI 214.4 / 318).",
"Carbonation with 1–2 % phenolphthalein; fill core holes with non-shrink repair mortar.",
"Rebound hammer (EN 12504-2): **≥ 12 readings** per location on a 20–50 mm grid in ≤ 300×300 mm; no generic manufacturer curve.",
"UPV (EN 12504-4): **≥ 40 readings** per element; path ≥ 100 mm (≤ 20 mm aggregate). Covermeter accuracy ±5 % or ±2 mm.",
"Appendix A: rebound, UPV, covermeter **1 per 500 m²**; absorption, water penetration, RCPT, chloride **1 per 500 m³** (when specified)."],
tags:"core test EN 13791 rebound hammer UPV covermeter carbonation phenolphthalein NDT"},

{id:"wp-below",topic:"Waterproofing",title:"Below-ground protection",ref:"S05 P14 §14.1, §14.3 · P11 §11.5.10",part:"S05P14",pts:[
"Impervious membrane or tanking to **all concrete in contact with soil** (based on the soil report); foundations also get a protective coating such as epoxy (§14.1.7.5–6).",
"Typical system: primer + preformed self-adhesive bituminous membrane (HDPE film with rubber-bitumen), laps and details to the manufacturer.",
"Protection board before backfill; protect from traffic and backfilling; repair any damage before cover-up.",
"Approved specialist applicator with **≥ 5 years** experience; manufacturer's representative at the first application; pre-work meeting on site.",
"Guarantee **10 years** (penetrative primer 5 years); samples 300×300 mm.",
"Rebar is fixed only after membrane protection is complete (P11 §11.5.10).",
"Appendix A: membrane thickness **1 test per 10,000 m²** (liquid systems 1 per 100 m², non-destructive); waterstop 1 per 1,000 m."],
tags:"tanking membrane bituminous self adhesive protection board primer applicator guarantee 10 years"},

{id:"wp-coatings",topic:"Waterproofing",title:"Coatings and penetrating treatments",ref:"S05 P14 §14.2, §14.4, §14.5",part:"S05P14",pts:[
"Epoxy coating: 2 coats, total dry film **≥ 200 µm**; chase and fill cracks with epoxy, wait **24 h**; above-ground coat laps **≥ 150 mm** over the below-ground coat.",
"Silane-siloxane primer: surface dry **24 h**; at least 2 flood coats of **≥ 0.4 l/m²**, **≥ 6 h** apart; not above **35 °C** or in wind; protect from rain and sea water for 6 h.",
"Fill cracks wider than 0.2 mm first; add 4 stripe coats on fine cracks (≤ 0.3 mm RC, ≤ 0.2 mm water-retaining).",
"Anti-carbonation coating: 2 pigmented topcoats, **≥ 150 µm** total, pinhole free.",
"Potable water tanks: solvent-free epoxy **≥ 400 µm** or **1.5 mm** PVC membrane."],
tags:"epoxy 200 micron silane siloxane flood coat 0.4 l anti-carbonation 150 micron potable tank 400 micron"},

{id:"wr-test",topic:"Waterproofing",title:"Water-retaining structure test",ref:"S05 P19",part:"S05P19",pts:[
"Test after completion and **at least 28 days** after the last section is cast; buried tanks are tested **before** membrane, drains or backfill go against the walls.",
"Fill in stages of **≤ 1 m per 24 h**; test each compartment separately.",
"Clean first; fill to top water level and let it stabilise for **21 days**, topping up.",
"Test for **7 days** using 2 evaporation trays, 2 rain gauges and a hook gauge with vernier.",
"Pass: net fall (less evaporation and rain) **≤ 1/500 of average depth or 10 mm**, whichever is less.",
"Visible leaks or damp patches are repaired from the water face by injection even if the test passes; repeat until watertight.",
"Roofs: keep wet by hosing for **3 successive days** before the roof membrane; no damp patches on the soffit."],
tags:"water tank watertightness test 21 days stabilise 7 days 1/500 10 mm evaporation tray hook gauge fire water tank oil pit"},

{id:"ew-excavation",topic:"Earthworks",title:"Excavation",ref:"S12 P02",part:"S12P02",pts:[
"Excavations **≥ 1.5 m** deep need a designed support system submitted **≥ 1 week** before work: drawings, deflection, earth pressure, surcharge.",
"No shoring under permanent structures; tiebacks onto neighbouring land need written owner approval.",
"Dewatering design with standby pumps and power, discharge point and settlement protection; designs signed by a qualified engineer.",
"Condition survey of adjacent structures before work; survey original ground levels.",
"Notify the Engineer at formation level for inspection; take the last layer out just before construction and compact the formation to **95 % MDD**.",
"Soft or unsuitable spots: remove and refill in layers **≤ 200 mm** loose to 95 % MDD, or with **C25** concrete. Over-excavation is filled with C25 at the contractor's cost.",
"No blasting without approval; excavated material belongs to the Owner and needs written approval to remove."],
tags:"excavation shoring 1.5 m dewatering formation 95 percent MDD soft spot over-excavation C25 condition survey"},

{id:"ew-fill",topic:"Earthworks",title:"Fill material limits",ref:"S12 P03 §3.2",part:"S12P03",v:1,pts:[
"Suitable fill: liquid limit **≤ 35 %**, plasticity index **≤ 10 %**, organic **≤ 2 %**, free draining, fines passing 75 µm **≤ 20 %**.",
"Unsuitable: rock particles over **75 mm**; organic over 2 %; combustible material.",
"Salts: water-soluble over **5 %** (chloride > 1 %, sulphate > 1.5 %) or acid-soluble over **10 %** (chloride > 2 %, sulphate > 3 %) makes fill unsuitable.",
"Recycled materials are suitable when they meet the same limits.",
"Suitable excavated material is reused as backfill; surplus disposed only as the Engineer approves."],
tags:"fill liquid limit 35 plasticity 10 organic 2 percent 75 mm salts chloride sulphate recycled"},

{id:"ew-compaction",topic:"Earthworks",title:"Backfilling and compaction",ref:"S12 P03 §3.4–3.7 · S02 App. A §15.4",part:"S12P03",pts:[
"Backfill only after the permanent works are approved and debris removed; probe the bottom; below water use rock fill only.",
"Plate vibrator, pedestrian vibrating roller or small tandem roller; layers **≤ 200 mm** loose.",
"Moisture within **±3 %** of optimum; compact to **≥ 95 %** of MDD (heavy compaction, 4.5 kg rammer, BS 1377); potable water only.",
"No layer is covered until tested and inspected; slope finished backfill away from the structure.",
"Services and ducts go in before fill under ground slabs; trim and blind with sand. Blinding **≥ 75 mm** immediately after excavation.",
"Appendix A: Proctor **1 per 1,000 m³** (and each source); field density **1 per 200 m² per layer**, **1 per 20 m** of trench per layer, 1 per 75 m per lane for roads; CBR lab 1 per 1,000 m³, in-situ 1 per 2,000 m² of final layer; plate load ≥ 3 per site and 1 per 3,000 m²."],
tags:"backfill compaction 200 mm layer 95 percent OMC 3 percent field density test FDT 200 m2 20 m trench proctor CBR plate load"},

{id:"ew-geotextile",topic:"Earthworks",title:"Geotextile fabric",ref:"S12 P05",part:"S12P05",pts:[
"Lay on a smooth surface, never stretched; overlaps **≥ 15 %** of panel width; longitudinal joints **500 mm**.",
"Pin or weight overlaps; spread a sand layer before aggregate; never drive trucks on the fabric.",
"Drop aggregate from minimum height with a loader; replace any damaged or displaced fabric; seal around penetrations."],
tags:"geotextile overlap 15 percent 500 mm sand layer"},

{id:"ms-laying",topic:"Masonry",title:"Laying blockwork",ref:"S13 P05 §5.3",part:"S13P05",pts:[
"Set out every wall first for correct bond and minimum cutting; position in plan within **±15 mm** of the grid line.",
"Joints average **10 mm**; full bed and perpend joints; keys filled.",
"Wet blocks and the top of the previous day's work before laying; stretcher bond; adjust each block while the mortar is plastic.",
"Build course by course: no part more than **800 mm** above another (rack back); cavity leaves within **400 mm** of each other.",
"Partitions **100 mm**; **150 mm** where plumbing fixtures are fixed back to back; keep at least one web when chasing for services."],
tags:"blockwork joint 10 mm 800 mm racking stretcher bond wetting partition 100 150 mm setting out"},

{id:"ms-ties",topic:"Masonry",title:"Ties, soffit gaps and curing",ref:"S13 P05 §5.5–5.15",part:"S13P05",pts:[
"Joint reinforcement **≥ 20 mm** from the face, laps **≥ 75 mm**; vertical bars **12 mm** clear of blocks, supported at ≤ 80Ø.",
"Ties into columns and walls embedded **≥ 200 mm** in the bed joint.",
"Non-load-bearing partitions stop **20 mm** below the slab soffit; fill with **M7** mortar after the slab has deflected.",
"Polythene slip layer where a slab bears on blockwork.",
"Fill cores with M6 mortar or 15 MPa concrete at jambs, ends, junctions and sills; lifts **≤ 1.2 m**, wait **24 h**.",
"Cavity **≥ 50 mm**; tie spacing for 50–75 mm cavity **1000 × 400 mm**, 75–100 mm 800 × 400, 100–150 mm 500 × 400; extra ties within 250 mm of openings.",
"DPC laps **≥ 100 mm** and sealed; cover new walls with wet hessian for **≥ 3 days**.",
"Water-penetration test on external walls **7 days** before plaster or paint (1 h spray, wind < 8 km/h)."],
tags:"wall ties 200 mm soffit gap 20 mm M7 mortar core filling 1.2 m cavity ties DPC 100 mm hessian 3 days water penetration"},

{id:"ms-mortar",topic:"Masonry",title:"Mortar and grout mixes",ref:"S13 P02 Table 2.1–2.2",part:"S13P02",pts:[
"Nominal mixes by mass (kg), cement:lime:sand or cement:sand: **M2** 70:50:740 or 85:775 (2 MPa); **M4** 105:35:725 or 110:755 (4 MPa); **M6** 135:25:700 or 155:710 (6 MPa); **M12** 190:20:655 or 190:675 (12 MPa).",
"Gauge accurately, allowing for bulking of sand; mix only as needed.",
"Mortar in contact with ground uses sulphate-resisting cement; lime as putty (EN 459-1).",
"Cement grout used within **1 h** unless retarded; grout strength **17.5 MPa** at 28 days.",
"Appendix A: blocks tested per type, per batch, **1 per 5,000 units** or **1 per 1,000 m²** (compressive test = 5 samples); mortar per mix."],
tags:"mortar M2 M4 M6 M7 M12 mix ratio lime sand grout 17.5 MPa block testing 5000 units"},

{id:"pile-tolerance",topic:"Piling",title:"Pile tolerances and records",ref:"S04 P01 §1.4, Table 1.1",part:"S04P01",pts:[
"Position: pile centre within **75 mm** of design in any direction at cut-off level.",
"Verticality: set within **1 in 100**; finished pile within **1 in 75**.",
"Rake: set within 1 in 50; finished deviation **1 in 25** (rake up to 1:6) or **1 in 15** (steeper).",
"No forcible corrections to concrete piles.",
"Keep records per Table 1.1: reference, type, size, levels, tip and cut-off, casing, reinforcement, concrete volume, interruptions; report unexpected ground at once.",
"Competent piling supervisor; plan sequence to avoid damaging adjacent fresh piles."],
tags:"pile position 75 mm verticality 1 in 75 rake records cut-off bored pile"},

{id:"pile-tests",topic:"Piling",title:"Pile testing frequency",ref:"S02 App. A §15.3, §15.1",part:"S02P15",pts:[
"Static load test: **≥ 1 per site** and **1 %** of piles (ASTM D1143).",
"Low-strain integrity test: **all piles** (ASTM D5882).",
"Cross-hole sonic logging: **10–15 %** of piles; 5 access tubes for piles over 1,000 mm diameter, 3 for smaller.",
"Calliper logging 10–15 %; high-strain dynamic test about 5 %; tension and lateral tests as the Engineer requests.",
"Boreholes for buildings: **≥ 3 per site**, about 1 per 300 m² on a ~20 m grid."],
tags:"pile test static load 1 percent integrity all piles cross hole sonic 10 15 percent tubes borehole"},

{id:"qa-itp",topic:"QA/QC",title:"Inspection requests and ITPs",ref:"S02 P07",part:"S02P07",pts:[
"Each ITP lists the procedure, clauses, prerequisites, tools, conditions, acceptance criteria, records and **Hold / Witness / Surveillance / Review** points.",
"Run a Request-for-Inspection system; give **12 h** notice for inspection and test requests unless agreed otherwise (S05 asks 24 h before concreting).",
"Inspectors are not the people who did the work; sign an inspection report for each item before it is covered up.",
"Report failures immediately; re-inspection and re-testing at the contractor's cost.",
"Keep a calibration log (equipment, ID, last and next calibration) and valid certificates on site.",
"QCS 2024 is issued by Qatar Standards as a voluntary technical guide; the contract names the edition that governs."],
tags:"ITP hold point witness surveillance inspection request IR WIR 12 hours calibration NCR"},

{id:"qa-freq",topic:"QA/QC",title:"Testing frequencies at a glance",ref:"S02 Part 15 Appendix A",part:"S02P15",pts:[
"Concrete: cubes 1 set (6) per **30 m³** and ≥ 1 per mix per day; mass-concrete temperature 1 test (3 points) per **50 m²**; mixing water **1 per 2,000 m³**.",
"Rebar: tensile, bend, rebend **1 per 30 t** per diameter; couplers **1 per 100 splices**.",
"Structural steel: 1 per **20 t** hot rolled, 40 t cast, 60 t heavy sections; welds UT/RT/MT/PT on **20 %** of weld length.",
"Earthworks: field density **1 per 200 m² per layer** / **1 per 20 m** trench; Proctor and gradation 1 per 1,000 m³.",
"Masonry: units **1 per 5,000** or **1 per 1,000 m²** per type and batch; mortar per mix.",
"Waterproofing: membrane properties **1 per 10,000 m²**; liquid film thickness 1 per 100 m².",
"Piles: integrity all; sonic logging 10–15 %; static load 1 %.",
"Frequencies are mandatory regardless of manufacturer certificates (App. A notes 1–2)."],
tags:"testing frequency appendix A cubes rebar steel FDT blocks membrane piles water"},

{id:"hse-heat",topic:"Safety",title:"Heat stress rules in Qatar",ref:"MoL Ministerial Decision 17/2021",part:"",pts:[
"Outdoor work is banned from **10:00 to 15:30** between **1 June and 15 September**.",
"Work must stop whenever the site **WBGT exceeds 32.1 °C**, at any time of year.",
"Post the daily working schedule at the site; provide shade, water and rest.",
"Separate from this, QCS forbids pours between 10:00 and 17:00 during the hot-weather period (S05 P15).",
"Violations can be reported to the Ministry of Labour hotline **16505**."],
tags:"heat stress summer ban 10:00 15:30 June September WBGT 32.1 Ministry of Labour"},

{id:"st-steel",topic:"Steel",title:"Structural steel and welds",ref:"S02 App. A §15.10 · S16",part:"S16ERE",pts:[
"Mill material tests: tensile, chemical, hardness, Charpy **1 per 20 t** hot rolled, **1 per 40 t** cast, **1 per 60 t** heavy sections (> 100 kg/m), **1 per 80 t** for lots over 200 t.",
"Weld NDT (UT, RT, MT or PT) on **20 %** of welded length unless the specification asks more.",
"Erection accuracy and welding workmanship follow S16 (open the parts for limits)."],
tags:"structural steel welding NDT UT RT MPI 20 percent Charpy"},

{id:"anc-grout",topic:"Concrete",title:"Anchor bolts, baseplates and grout",ref:"S05 P08 §8.3.2.4–9 · P21",part:"S05P21",pts:[
"Set anchor bolts, sleeves and inserts with rigid templates; hold them so they cannot move during the pour.",
"No drilling or shot-firing into concrete without approval; the contractor makes good any damage.",
"Under baseplates, soleplates, tanks and bridge seats use **non-shrink, pre-packaged precision grout**, mixed with water only, formed and cured as specified.",
"Post-installed anchors and bars follow S05 Part 21 (approved system and installation tests)."],
tags:"anchor bolt template baseplate grout non-shrink post-installed anchor chemical anchor"}
];

/* Table helpers for calculators */
const GRADES = [
  {g:"C25",cube:25,cyl:20,cem:260,wc:0.65},{g:"C30",cube:30,cyl:25,cem:300,wc:0.58},
  {g:"C35",cube:35,cyl:28,cem:320,wc:0.55},{g:"C40",cube:40,cyl:32,cem:335,wc:0.50},
  {g:"C45",cube:45,cyl:35,cem:355,wc:0.47},{g:"C50",cube:50,cyl:40,cem:370,wc:0.45},
  {g:"C60",cube:60,cyl:50,cem:380,wc:0.40},{g:"C75",cube:75,cyl:60,cem:390,wc:0.35}
];
const COVER_T67 = { /* min cover mm by exposure for C40, C50, C60, C75 (C30 not permitted) */
  X3:{C40:70,C50:65,C60:60,C75:55,blend:"PC/FA, PC/GGBS, PC/SF or triple blend"},
  X4:{C40:75,C50:70,C60:65,C75:60,blend:"PC/FA, PC/GGBS, PC/SF or triple blend"},
  X5:{C40:80,C50:75,C60:70,C75:65,blend:"Triple blend only"}
};
const STRIP_T91 = [
  {k:"sides",label:"Beam sides, walls and columns",d:1},
  {k:"slab",label:"Slab soffits (props left under)",d:4},
  {k:"beam",label:"Beam, joist and girder soffits (props left under)",d:10},
  {k:"propslab",label:"Props to slabs",d:11},
  {k:"propbeam",label:"Props to beams",d:15}
];
const MORTAR_T21 = { /* kg by mass, cement:sand route and cement:lime:sand route */
  M2:{c:85,s:775,cl:[70,50,740],mpa:2}, M4:{c:110,s:755,cl:[105,35,725],mpa:4},
  M6:{c:155,s:710,cl:[135,25,700],mpa:6}, M12:{c:190,s:675,cl:[190,20,655],mpa:12}
};
