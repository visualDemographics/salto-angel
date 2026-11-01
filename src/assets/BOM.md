# Bill of Materials (BOM): Salto Ángel Modular 3D Recreation
**Document Version:** 1.0.0  
**Target Architecture:** Three.js + GLSL Procedural Pipeline  
**Scale Reference:** 979 m Total Elevation Drop (1 World Unit = ~25 meters, Full Canyon Height = ~40 units)

---

## Part 1: Morphological & Geometric Proportions Analysis

### 1.1 Why Salto Ángel Differs from a "Regular Waterfall"
A standard waterfall in 3D graphics is typically modeled as a river flowing over a flat edge into a circular plunge pool with a vertical cliff behind it. **Salto Ángel (Kerepakupai Merú)** violates almost every rule of standard waterfall morphology:

1. **Subterranean Emergence beneath an Overhanging Rim (Photos #01, #08, #15)**:
   - The river does *not* flow smoothly over the top crest. It flows across the sandstone labyrinth of Auyán-tepui, drains into subterranean karst fissures (*sumideros*), and erupts out of a recessed cleft **15 to 30 meters below the overhanging summit rim**.
   - The summit rim above the waterfall forms a projecting castellated cornice of ancient Precambrian quartzite blocks with deep vertical fractures (*grietas*).

2. **Extreme Aspect Ratio & Aerodynamic Atomization (Photos #07, #13, #15)**:
   - **807 meters of unbroken free-fall** (the longest on Earth), followed by a 172-meter lower cascade chute.
   - The water begins as a concentrated, high-velocity twin stream (~15–20 meters wide) and accelerates under gravity. At ~300 meters down, air drag tears the liquid column into distinct aerodynamic "water comets" and billowing vapor.
   - By 600 meters down, the stream expands into an ethereal, pulsing mist veil **over 120 meters wide**, buffeted sideways by canyon thermals.

3. **Colossal Structural Asymmetry (Photos #01, #06, #12, #15)**:
   - **The Left Wall (Grand Amphitheater)**: A towering, smooth, concave cliff of oxidized salmon-terracotta quartzite with vertical manganese-iron desert varnish streaks.
   - **The Right Buttress (The Prow)**: A colossal, monolithic rock bastion projecting forward into the canyon by over 200 meters. It is deeply stratified with 4–5 horizontal stepped benches (terraces) hosting lush vegetation.
   - **The Central Recess (The Wet Alcove)**: The cliff cuts inward *behind* the waterfall into a semi-circular chasm. The rock surface inside is pitch black (obsidian/slate) from continuous water saturation, micro-algae, and heavy shadow.

4. **Two-Stage Cascading Hydrology (Photos #03, #04, #15)**:
   - The plunge does not hit a calm lake. It crashes onto a colossal boulder scree cone (the cauldron), boiling into a permanent vapor cloud.
   - From the cauldron, the runoff gathers into a high-velocity, turbulent whitewater torrent (*Cañón del Diablo Rapids*) rushing down between giant sandstone boulders through primary Guiana rainforest.

5. **Stratified Botanical Zonation (Photos #01, #03, #10, #17)**:
   - **Zone A (Summit Tepui, > 2,000 m)**: Stunted bonsai trees, rosette bromeliads (*Brocchinia*), carnivorous pitcher plants (*Heliamphora*), and crustose lichens clinging to bare rock pavement.
   - **Zone B (Cliff Shelves & Terraces)**: Thick cushion mats of highland mosses, hanging lycopods, and ledge scrub anchored into horizontal crevices.
   - **Zone C (Talus Scree & Riverbed)**: Wet mossy boulders, tree ferns (*Cyathea*), river palms (*Mauritia*), and spray-drenched shrubs.
   - **Zone D (Valley Canopy)**: Massive emergent rainforest trees (*Dimorphandra*, Cecropia) with broad, umbrella-shaped flat crowns and heavily buttressed root trunks.

---

## Part 2: Categorized Bill of Materials (108 Modular Assets)
Sorted by functional importance:
- **Tier 1 (Critical)**: Macro-Geological Framework & Waterfall Fluid Dynamics
- **Tier 2 (High)**: Mid-Scale Rock Buttresses, Terraces & Primary Canopy
- **Tier 3 (Medium)**: Scree Field, Rapids Boulder Field & Ledge Flora
- **Tier 4 (Detail)**: Summit Endemics, Epiphytes, Debris & Spray Clouds

---

### Category A: Macro-Geological Cliff Modules (Assets 001 – 035)

| Asset ID | Asset Name | Importance | Dimensions ($W \times H \times D$) | Morphological Description & Procedural Strategy | Reference Alignment |
|:---|:---|:---|:---|:---|:---|
| **CLIFF-001** | Summit Emergence Cleft Arch | **Critical** | $8 \times 12 \times 10$ | Deep parabolic notch carved into the cliff edge beneath an overhanging rock roof; twin subterranean eruption conduits. | Photos #01, #15 |
| **CLIFF-002** | Left Amphitheater Concave Wall A | **Critical** | $24 \times 32 \times 12$ | Sheer, concave curved quartzite face with subtle horizontal bedding shelves and vertical manganese patina streaks. | Photos #09, #13, #15 |
| **CLIFF-003** | Left Amphitheater Concave Wall B | **Critical** | $24 \times 32 \times 12$ | Lower transition block of the left amphitheater, sloping forward into the scree cone at $y < -4.0$. | Photos #02, #15 |
| **CLIFF-004** | Right Buttress Main Prow | **Critical** | $20 \times 36 \times 24$ | Monumental rock bastion projecting forward; vertical columnar joints and sharp 90° planar fracture faces. | Photos #06, #12, #17 |
| **CLIFF-005** | Right Buttress Mid-Terrace Shelf | **Critical** | $18 \times 6 \times 12$ | Flat horizontal bench at mid-height ($y \approx 2.5$) with 1.5m recessed back-wall and stepped ledge lips for shrub mats. | Photos #01, #12, #17 |
| **CLIFF-006** | Right Buttress Lower Step Base | **High** | $22 \times 16 \times 18$ | Heavily fractured basal foundation of the right bastion entering the jungle scree. | Photos #06, #11 |
| **CLIFF-007** | Central Wet Alcove Back-Wall | **Critical** | $16 \times 34 \times 10$ | Deeply recessed concave chasm directly behind the water column; obsidian/charcoal wet patina, water-smoothed rock. | Photos #08, #13, #15 |
| **CLIFF-008** | Summit Castellated Battlement Spire A | **High** | $6 \times 8 \times 6$ | Rectangular vertical stone pillar forming the fortress skyline rim; sharp columnar jointing. | Photos #01, #06, #20 |
| **CLIFF-009** | Summit Castellated Battlement Spire B | **High** | $5 \times 10 \times 5$ | Tall, slender pinnacle spire with weathered rounded cap and deep vertical fissures. | Photos #01, #06 |
| **CLIFF-010** | Summit Overhang Cornice Block | **High** | $14 \times 4 \times 8$ | Cantilevered quartzite roof projecting 3–5m out over the abyss above the waterfall chute. | Photos #01, #15 |
| **CLIFF-011** | Plateau Tabletop Pavement Slab A | **High** | $24 \times 3 \times 24$ | Flat summit plateau block with deep orthogonal grietas (fissure cracks) and circular weathering pans (*tinajitas*). | Photos #01, #02 |
| **CLIFF-012** | Plateau Tabletop Pavement Slab B | **Medium** | $20 \times 3 \times 20$ | Peat-filled plateau depression module with rocky ridges. | Photo #01 |
| **CLIFF-013** | Columnar Rib Bastion (Triple Pillar) | **High** | $10 \times 28 \times 8$ | Group of three fused vertical polygonal columns with horizontal bedding joints every 2.5m. | Photos #02, #06 |
| **CLIFF-014** | Columnar Rib Bastion (Single Fluted) | **Medium** | $5 \times 26 \times 6$ | Slender vertical pilaster with bevelled facet edges. | Photo #06 |
| **CLIFF-015** | Diagonal Fault Shear Chasm | **High** | $8 \times 30 \times 12$ | Deep diagonal tectonic crack ($15^\circ$ tilt) cutting through strata; shadow trap. | Photos #02, #15 |
| **CLIFF-016** | Horizontal Strata Shelf Module A | **High** | $20 \times 4 \times 6$ | Stepped horizontal sedimentary ledge with $0.8\text{m}$ cantilever overhang and underside shadow AO. | Photos #02, #06, #17 |
| **CLIFF-017** | Horizontal Strata Shelf Module B | **Medium** | $14 \times 3 \times 5$ | Narrow stepped shelf with micro-fracture rubble. | Photo #17 |
| **CLIFF-018** | Stepped Amphitheater Corner Ledge | **High** | $12 \times 14 \times 12$ | $90^\circ$ inside corner module connecting left wall to central alcove with stepped terrace shelves. | Photos #09, #15 |
| **CLIFF-019** | Protruding Buttress Corner Prow | **High** | $14 \times 18 \times 14$ | $90^\circ$ outside corner module with triangular prow geometry. | Photos #06, #12 |
| **CLIFF-020** | Basal Talus Transition Wall Left | **High** | $22 \times 16 \times 16$ | Sloping bedrock ramp ($45^\circ$) where sheer cliff meets the valley floor talus. | Photos #04, #15 |
| **CLIFF-021** | Basal Talus Transition Wall Right | **High** | $22 \times 16 \times 16$ | Right-hand sloping ramp transitioning into the dense river jungle. | Photos #04, #11 |
| **CLIFF-022** | Weathered Quartzite Cornice Arch | **Medium** | $10 \times 6 \times 6$ | Weathered natural stone bridge / lintel spanning a vertical grieta near the rim. | Photo #01 |
| **CLIFF-023** | Mushroom Rock Pinnacle Hoodoo | **Medium** | $4 \times 8 \times 4$ | Undercut pedestal rock spire with wide top cap supporting bonsai vegetation. | Photo #06 |
| **CLIFF-024** | Subterranean Cave Conduit Egress | **Critical** | $6 \times 6 \times 8$ | Dark elliptical conduit tunnel mouth inside the cleft where water erupts. | Photos #01, #15 |
| **CLIFF-025** | Secondary Stream Fracture Notch | **Critical** | $4 \times 10 \times 6$ | Narrow vertical slot $8\text{m}$ to the right of the main cleft where the secondary stream cascades. | Photos #01, #15 |
| **CLIFF-026** | Threadlet Seep Fissure Block | **High** | $3 \times 14 \times 4$ | Thin vertical wall fracture with baked wet stain texture and dripping water points. | Photos #01, #15 |
| **CLIFF-027** | Massive Terracotta Shear Slab | **High** | $16 \times 24 \times 5$ | Flat, unjointed vertical monolithic plate of salmon quartzite with iron-oxide crust. | Photos #09, #13 |
| **CLIFF-028** | Fractured Columnar Block Pack A | **Medium** | $12 \times 16 \times 8$ | Cluster of 6 interlocking rectangular columns at varied heights. | Photo #06 |
| **CLIFF-029** | Fractured Columnar Block Pack B | **Medium** | $10 \times 14 \times 7$ | Cluster of 4 sheared columns with prominent cross-bedding angles. | Photo #02 |
| **CLIFF-030** | Hanging Overhang Ceiling Wedge | **High** | $12 \times 6 \times 10$ | Inverted pyramid ceiling module for deep chasm shadow cavities. | Photo #13 |
| **CLIFF-031** | Mid-Cliff Drainage Chute Gully | **High** | $6 \times 20 \times 5$ | Concave vertical trough worn smooth by wet-season secondary cascades. | Photos #02, #09 |
| **CLIFF-032** | Terraced Mossy Bench Module A | **High** | $16 \times 4 \times 7$ | Stepped horizontal bench with baked green moss UV mapping. | Photo #17 |
| **CLIFF-033** | Terraced Mossy Bench Module B | **Medium** | $12 \times 3 \times 5$ | Narrower moss terrace for high buttress walls. | Photo #17 |
| **CLIFF-034** | Plateau Rim Skyline Notched Crest | **High** | $24 \times 6 \times 8$ | Modular repeating skyline rim piece with irregular crenellations and dips. | Photos #06, #20 |
| **CLIFF-035** | Valley Gorge Flank Wall (Distant) | **Medium** | $30 \times 20 \times 15$ | Low-detail peripheral canyon wall block for background framing. | Photos #05, #16 |

---

### Category B: Boulders, Talus Scree & Riverbed Geology (Assets 036 – 055)

| Asset ID | Asset Name | Importance | Dimensions ($W \times H \times D$) | Morphological Description & Procedural Strategy | Reference Alignment |
|:---|:---|:---|:---|:---|:---|
| **ROCK-036** | Giant Cauldron Impact Monolith | **Critical** | $8 \times 6 \times 7$ | Colossal rectangular sandstone block at the plunge foot; water-polished top, fractured sides, deep ground AO. | Photos #03, #15 |
| **ROCK-037** | Tabular Sandstone Bedding Slab | **High** | $6 \times 2.2 \times 5$ | Flat, wide rectangular slab with clear horizontal sedimentary layer lines and edge chips. | Photo #03 |
| **ROCK-038** | Angular Voronoi Cleavage Boulder A | **High** | $4 \times 3.5 \times 3.5$ | 8-plane sliced boulder with sharp cleavage facets and terracotta weathering tint. | Photos #03, #04 |
| **ROCK-039** | Angular Voronoi Cleavage Boulder B | **High** | $3.5 \times 3 \times 4$ | Pyramidal cleaved rock block with dark wet base and lichen-encrusted apex. | Photos #03, #04 |
| **ROCK-040** | Water-Polished Riverbed Tor | **High** | $5 \times 2.8 \times 4$ | Rounded, smoothed quartzite boulder worn by tumbling rapids; wet specular finish. | Photos #03, #04 |
| **ROCK-041** | Churning Rapids Chute Siphon Rock | **High** | $6 \times 3.5 \times 5$ | Split rock pair forming a narrow hydrodynamic constriction channel for rapids. | Photos #03, #04 |
| **ROCK-042** | Talus Scree Cone Field Module A | **Critical** | $20 \times 12 \times 16$ | Continuous sloping mesh of tumbled boulders ($35^\circ$ slope) with grass growing in crevices. | Photos #03, #15 |
| **ROCK-043** | Talus Scree Cone Field Module B | **High** | $18 \times 10 \times 14$ | Upper steep scree cone module connecting directly to the central chasm base. | Photo #15 |
| **ROCK-044** | Moss-Covered Riverbed Boulder A | **High** | $3 \times 2.2 \times 2.8$ | Rounded boulder with thick velvet green moss cap on top and dark wet waterline below. | Photo #03 |
| **ROCK-045** | Moss-Covered Riverbed Boulder B | **Medium** | $2.4 \times 1.8 \times 2.2$ | Low oblong river boulder partially submerged in amber river water. | Photo #03 |
| **ROCK-046** | Lichen-Crusted Dry Talus Rock | **Medium** | $3.2 \times 2.6 \times 3.0$ | High-scree dry boulder with pale green and orange crustose lichen patches. | Photo #03 |
| **ROCK-047** | Stepped Rapids Bedrock Shelf | **High** | $12 \times 3 \times 8$ | Horizontal geological rock bar spanning the river gorge, creating a 3m waterfall drop. | Photos #03, #15 |
| **ROCK-048** | Rapids Plunge Pool Rim | **High** | $14 \times 2.5 \times 10$ | Semi-circular stone basin rim holding an amber-tinted eddy pool. | Photo #03 |
| **ROCK-049** | Shattered Quartzite Rubble Mound | **Medium** | $6 \times 2 \times 6$ | Low pile of fist- to head-sized sharp angular rock chips (*gelifraction* debris). | Photo #03 |
| **ROCK-050** | Fallen Column Fragment (Prism) | **Medium** | $2.5 \times 7 \times 2.5$ | Toppled vertical columnar joint lying horizontally across the talus slope. | Photos #02, #06 |
| **ROCK-051** | Weathered Ironstone Cap Rock | **Medium** | $4 \times 1.5 \times 3.5$ | Dark purplish-black heavy cap boulder with pitted ferricrete texture. | Photo #01 |
| **ROCK-052** | River Gorge Shoreline Kerb Rock | **Medium** | $8 \times 2 \times 3$ | Elongated riverbank rock ledge containing the whitewater rapids channel. | Photo #04 |
| **ROCK-053** | Submerged Rapids Obstacle Boulder | **High** | $3 \times 2.5 \times 3$ | Rounded river rock creating standing bow waves and white foam rooster tails. | Photos #03, #04 |
| **ROCK-054** | Spray-Drenched Obsidian Basalt Block | **High** | $3.5 \times 3 \times 3.5$ | Jet-black wet block directly within the waterfall spray fallout radius. | Photos #08, #13 |
| **ROCK-055** | Scree Transition Pebble Fringe | **Medium** | $10 \times 0.8 \times 8$ | Flat gravel/cobble plane blending large boulders into the surrounding soil. | Photo #03 |

---

### Category C: Botanical & Vegetation Assets (Assets 056 – 085)

| Asset ID | Asset Name | Importance | Dimensions ($W \times H \times D$) | Morphological Description & Procedural Strategy | Reference Alignment |
|:---|:---|:---|:---|:---|:---|
| **FLORA-056** | Emergent Rainforest Tree (Giant) | **Critical** | $12 \times 18 \times 12$ | Colossal canopy tree (*Dimorphandra excelsa*); 4-flanged buttress trunk, 5 ascending boughs, flattened umbrella crown of 24 lobes. | Photos #01, #10, #15 |
| **FLORA-057** | Emergent Rainforest Tree (Medium) | **Critical** | $8 \times 14 \times 8$ | Standard canopy tree; 3 boughs, 16 umbrella lobes, dark brown fibrous bark. | Photos #04, #12, #15 |
| **FLORA-058** | Slender Cecropia Valley Tree | **High** | $4 \times 12 \times 4$ | White/grey slender trunk, sparse candelabra branches, giant palmate star-shaped leaves. | Photos #03, #10 |
| **FLORA-059** | Moriche Riverbed Palm (*Mauritia*) | **High** | $5 \times 11 \times 5$ | Ringed columnar trunk, spherical crown of giant fan-shaped leaves along riverbank. | Photos #04, #10 |
| **FLORA-060** | Giant Mountain Tree Fern (*Cyathea*) | **High** | $4 \times 6 \times 4$ | Fibrous brown trunk, rosette of 10 arched feathery bipinnate fronds in spray zones. | Photos #03, #10 |
| **FLORA-061** | Dwarf Tepui Bonsai Tree (*Bonnetia*) | **Critical** | $3 \times 4 \times 3$ | Stunted, gnarled, twisted dark wood trunk, dense leathery rosettes of micro-leaves for summit rim. | Photo #01 |
| **FLORA-062** | Highland Summit Rosette Bromeliad | **High** | $1.8 \times 1.4 \times 1.8$ | Spiky star rosette (*Brocchinia reducta*) with yellow-green tubular leaves growing on rock bareness. | Photo #01 |
| **FLORA-063** | Cliff-Face Epiphytic Bromeliad Clump | **High** | $1.2 \times 0.9 \times 1.2$ | Cluster of 4-6 bromeliads rooted directly into vertical rock fissures. | Photos #01, #17 |
| **FLORA-064** | Carnivorous Pitcher Plant Clump | **Medium** | $1.0 \times 0.6 \times 1.0$ | Rosette of red-veined green urn-shaped pitchers (*Heliamphora*) for wet peat ledges. | Photo #01 |
| **FLORA-065** | Ledge Shrub Cushion Mound A | **Critical** | $3.5 \times 1.2 \times 3.0$ | Flattened elliptical dome of dense, compact highland scrub with baked crevice AO. | Photos #01, #12, #17 |
| **FLORA-066** | Ledge Shrub Cushion Mound B | **High** | $2.5 \times 0.9 \times 2.2$ | Smaller elongated cushion mat for narrow horizontal rock strata benches. | Photo #17 |
| **FLORA-067** | Hanging Rock Epiphyte Curtain | **High** | $2.0 \times 4.5 \times 0.8$ | Draped curtain of hanging club-moss (*Lycopodium*) and climbing lianas over cliff overhangs. | Photos #01, #10 |
| **FLORA-068** | Understory Broadleaf Shrub Clump | **High** | $2.8 \times 2.2 \times 2.8$ | Dense hemispherical cluster of large tropical leaves (*Philodendron*, *Heliconia*) for river floor. | Photos #03, #10 |
| **FLORA-069** | Riverbed Spray-Zone Herb Mat | **Medium** | $3.0 \times 0.4 \times 3.0$ | Low creeping carpet of saturated aquatic herbs and mosses on wet rock surfaces. | Photo #03 |
| **FLORA-070** | Rainforest Canopy Lobe Cluster (High-Poly) | **High** | $4.0 \times 1.8 \times 4.0$ | Dense cluster of 7 overlapping ellipsoidal leaf lobes for foreground tree crowns. | Photo #01 |
| **FLORA-071** | Rainforest Canopy Lobe Cluster (Low-Poly) | **Medium** | $3.0 \times 1.4 \times 3.0$ | 3-lobe foliage cluster for distant valley instancing. | Photos #05, #15 |
| **FLORA-072** | Summit Wiregrass Turf Tussock | **Medium** | $1.2 \times 0.8 \times 1.2$ | Stiff, prickly dome of endemic grasses (*Stegolepis*) growing in rock pans. | Photo #01 |
| **FLORA-073** | Mossy Buttress Terrace Mat A | **Critical** | $8 \times 0.6 \times 5$ | Large undulating organic sheet of velvet moss and dwarf shrublets for the main right buttress. | Photos #12, #17 |
| **FLORA-074** | Mossy Buttress Terrace Mat B | **High** | $6 \times 0.5 \times 4$ | Secondary moss mat module tailored to fit stepped $1.5\text{m}$ rock benches. | Photo #17 |
| **FLORA-075** | Twisted Summit Woody Vine | **Medium** | $0.8 \times 3.5 \times 0.8$ | Gnarly, bark-textured liana crawling over stone battlements. | Photo #01 |
| **FLORA-076** | Riverbank Giant Bamboo Clump | **Medium** | $3.5 \times 8.0 \times 3.5$ | Cluster of arched green-yellow bamboo culms along the rapids gorge. | Photos #04, #10 |
| **FLORA-077** | Epiphytic Orchid Cluster (*Cattleya*) | **Medium** | $0.8 \times 0.6 \times 0.6$ | Thick pseudobulbs with leathery leaves and purple/white floral accent on tree boughs. | Photo #10 |
| **FLORA-078** | Pale Beard Lichen Drapery (*Usnea*) | **High** | $1.5 \times 2.8 \times 0.4$ | Wispy pale grey-green lichen strands hanging from dwarf trees and summit rocks. | Photo #01 |
| **FLORA-079** | Scree Slope Grassy Meadow Patch | **High** | $10 \times 0.5 \times 8$ | Vibrant emerald green grassy patch covering soil between scree boulders. | Photos #03, #15 |
| **FLORA-080** | Sun-Bleached Dead Snag Tree | **Medium** | $1.2 \times 7.0 \times 1.5$ | Ghostly white weathered tree skeleton standing above the canopy on the ridge. | Photos #01, #11 |
| **FLORA-081** | Stilted Mangrove-Style Root Base | **High** | $3.0 \times 2.5 \times 3.0$ | Flying buttress stilt root cluster for wet riverbed trees. | Photo #10 |
| **FLORA-082** | Sub-Montane Clusia Leaf Cluster | **Medium** | $2.2 \times 1.8 \times 2.2$ | Thick, rubbery, succulent-like leaves forming a dense rounded bush. | Photo #01 |
| **FLORA-083** | Cliff Crevice Fern Tuft (*Blechnum*) | **Medium** | $1.4 \times 1.0 \times 1.4$ | Stiff arched fern fronds sprouting horizontally from horizontal rock fissures. | Photos #01, #17 |
| **FLORA-084** | Peat Humus Soil Bed Module | **Medium** | $6.0 \times 0.3 \times 6.0$ | Dark, sponge-like acidic organic soil layer for plateau crevices. | Photo #01 |
| **FLORA-085** | Rainforest Canopy Density Card Cluster | **Medium** | $16 \times 8 \times 16$ | Impostor mesh cluster of 12 foliage crowns for extreme-distance valley filling. | Photos #05, #15 |

---

### Category D: Fluid Dynamics & Waterfall Modular Chutes (Assets 086 – 098)

| Asset ID | Asset Name | Importance | Dimensions ($W \times H \times D$) | Morphological Description & Procedural Strategy | Reference Alignment |
|:---|:---|:---|:---|:---|:---|
| **WATER-086** | Primary Cascade Emergence Chute | **Critical** | $3.5 \times 8.0 \times 4.0$ | Ballistic 3D curved crest trough where main torrent erupts from cleft lip ($y \in [11.5, 14.5]$). | Photos #01, #15 |
| **WATER-087** | Secondary Cascade Emergence Chute | **Critical** | $2.0 \times 7.0 \times 3.5$ | Parallel right crest trough emerging from adjacent fissure notch ($y \in [11.5, 14.2]$). | Photos #01, #15 |
| **WATER-088** | Upper Compact Core Ribbon (Main) | **Critical** | $4.0 \times 14.0 \times 2.5$ | High-density hyper-stretched liquid column ($y \in [4.0, 12.0]$); dense white core, minimal spread. | Photos #08, #15 |
| **WATER-089** | Upper Compact Core Ribbon (Sec) | **High** | $2.2 \times 13.0 \times 2.0$ | Parallel secondary dense stream with vertical filament banding. | Photos #08, #15 |
| **WATER-090** | Atomized Cometary Pulse Veil (Mid) | **Critical** | $8.0 \times 16.0 \times 4.5$ | Expanding parabolic spray shroud ($y \in [-2.0, 6.0]$); water comets, downward gravitational bursts. | Photos #07, #15, #18 |
| **WATER-091** | Dispersed Ethereal Vapor Curtain | **Critical** | $14.0 \times 18.0 \times 6.0$ | Wide, translucent billowing spray curtain ($y \in [-8.0, 2.0]$) spreading over $100\text{m}$ width. | Photos #07, #13, #15 |
| **WATER-092** | Side Trickle Threadlet Chute Left | **High** | $0.8 \times 12.0 \times 1.2$ | Delicate fine stream dripping from lateral rock crevice at $x \approx -2.2$. | Photos #01, #15 |
| **WATER-093** | Side Trickle Threadlet Chute Right| **Medium** | $0.6 \times 10.0 \times 1.0$ | Thin capillary stream on right wall fading into mist halfway down. | Photo #15 |
| **WATER-094** | Cauldron Impact Boil Ring | **Critical** | $16.0 \times 4.0 \times 16.0$ | Concentric circular turbulent foam surges where plunging water collides with talus basin. | Photos #03, #15 |
| **WATER-095** | Upper Rapids Stepped Chute Module | **Critical** | $6.0 \times 8.0 \times 12.0$ | S-curving whitewater rapid cascading over bedrock steps from $y = -8.5$ to $-11.5$. | Photos #03, #04, #15 |
| **WATER-096** | Lower Rapids Meander Chute Module| **Critical** | $7.5 \times 6.0 \times 16.0$ | Violent boiling river channel winding between talus boulders toward foreground ($y \in [-11.5, -15.0]$). | Photos #03, #04 |
| **WATER-097** | Lateral Standing Wave Rooster Tail | **High** | $2.5 \times 2.0 \times 3.0$ | Curving 3D rooster tail spray mesh formed as rapids hit boulder obstacles. | Photos #03, #04 |
| **WATER-098** | Riverbed Amber Calm Eddy Pool | **High** | $10.0 \times 0.2 \times 10.0$ | Transparent deep-amber/whiskey colored water pool (*agua negra*) with swirling surface foam scum. | Photo #03 |

---

### Category E: Atmospheric Clouds, Mist & Micro-Details (Assets 099 – 108)

| Asset ID | Asset Name | Importance | Dimensions ($W \times H \times D$) | Morphological Description & Procedural Strategy | Reference Alignment |
|:---|:---|:---|:---|:---|:---|
| **ATMO-099** | Orographic Summit Rim Cloud Veil | **High** | $36 \times 6 \times 12$ | Wispy horizontal cloud bank skimming the castellated battlements ($y \in [12.0, 15.0]$). | Photos #01, #15 |
| **ATMO-100** | Left Amphitheater Mid-Cliff Cloud | **Critical** | $18 \times 10 \times 14$ | Volumetric stratocumulus bank wrapping the left salmon-terracotta wall ($y \in [0.0, 7.0]$). | Photos #06, #14, #15 |
| **ATMO-101** | Right Buttress Flank Cloud Mass | **Critical** | $22 \times 12 \times 16$ | Massive billowing cloud deck hugging the protruding right bastion ($y \in [-1.0, 6.0]$). | Photos #06, #14, #15 |
| **ATMO-102** | Cauldron Base Billowing Mist Cauldron| **Critical** | $20 \times 12 \times 20$ | High-density turbulent mist explosion ascending continuously from the plunge foot. | Photos #03, #13, #15 |
| **ATMO-103** | Rapids Gorge Ground Spray Fog | **High** | $12 \times 4 \times 24$ | Low-hanging river vapor hugging the rapids channel between jungle ridges. | Photos #04, #15 |
| **DECAL-104**| Black Manganese Patina Stain Decal | **High** | $4 \times 18 \times 0.2$ | Vertical desert varnish wash streak running down red quartzite cliffs. | Photos #09, #13, #15 |
| **DECAL-105**| Iron-Oxide Salmon Rust Streak Decal| **High** | $5 \times 14 \times 0.2$ | Vibrant orange-salmon leaching stain on overhang lips. | Photos #09, #13 |
| **DECAL-106**| Crustose Lichen Map Decal (White/Grey)| **Medium** | $3 \times 3 \times 0.1$ | Pale mottled patch for boulder tops and summit pavement rocks. | Photos #01, #03 |
| **DECAL-107**| Dark Green Crevice Slime Decal | **Medium** | $2 \times 8 \times 0.1$ | Wet organic algae film in vertical fracture shadow zones. | Photos #08, #13 |
| **PROP-108** | Weathered Fallen Rainforest Drift Log | **Medium** | $1.2 \times 0.8 \times 8.0$ | Stripped river driftwood log wedged between rapids boulders. | Photos #03, #04 |

---

## Part 3: Priority Implementation Roadmap

To transform the current monolithic displaced plane into an authentic geological wonder, the assets should be built and integrated in three focused phases:

### Milestone 1: The Fortress Framework (Macro Cliffs & Chutes)
- Build **CLIFF-001** (Emergence Cleft), **CLIFF-002/003** (Concave Amphitheater), **CLIFF-004/005** (Protruding Buttress & Terraces), and **CLIFF-007** (Wet Alcove).
- Integrate **WATER-086/087** (Twin Chutes) and **WATER-090/091** (Atomized Mist Shrouds).
- *Result*: The fundamental silhouette, asymmetry, and 807m drop proportions match Photos #01, #06, #12, and #15 immediately.

### Milestone 2: River Rapids, Scree Cauldron & Vegetation Density
- Assemble **ROCK-042/043** (Talus Scree Cones) and **WATER-095/096** (Stepped Rapids).
- Populate the riverbed with **ROCK-036** (Cauldron Monolith) and **ROCK-037–041** (Angular Boulders).
- Replace background trees with **FLORA-056/057** (Emergent Umbrellas), **FLORA-065/066** (Terrace Shrub Cushions), and **FLORA-073/074** (Moss Mats).

### Milestone 3: Macro-Weathering & Endemic Detailing
- Add **CLIFF-008–010** (Castellated Battlements & Cornice) to the summit rim.
- Scatter **FLORA-061** (Dwarf Bonnetia Bonsai) and **FLORA-062** (Brocchinia Bromeliads) along the rim.
- Apply **DECAL-104/105** (Manganese & Iron Stains) and activate **ATMO-100/101** (Shoulder Cloud Decks).

