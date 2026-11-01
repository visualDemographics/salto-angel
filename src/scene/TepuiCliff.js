import * as THREE from 'three';
import {
  // 1. Cleft & Cornice
  createCliff001EmergenceCleftArch,
  createCliff010OverhangCorniceBlock,
  createCliff024SubterraneanCaveConduitEgress,
  createCliff025SecondaryStreamFractureNotch,
  // 2. Amphitheater Wall
  createCliff002LeftAmphitheaterConcaveWallA,
  createCliff003LeftAmphitheaterConcaveWallB,
  createCliff007CentralWetAlcoveBackWall,
  createCliff018SteppedAmphitheaterCornerLedge,
  // 3. Buttress & Terrace
  createCliff004RightButtressMainProw,
  createCliff005RightButtressMidTerraceShelf,
  createCliff006RightButtressLowerStepBase,
  createCliff019ProtrudingButtressCornerProw,
  // 4. Columnar & Spire
  createCliff008SummitCastellatedSpireA,
  createCliff009SummitCastellatedSpireB,
  createCliff013ColumnarRibBastionTriplePillar,
  createCliff014ColumnarRibBastionSingleFluted,
  // 5. Plateau Pavement
  createCliff011PlateauTabletopPavementSlabA,
  createCliff012PlateauTabletopPavementSlabB,
  // 6. Strata Shelves & Benches
  createCliff016HorizontalStrataShelfA,
  createCliff017HorizontalStrataShelfB,
  createCliff032TerracedMossyBenchA,
  createCliff033TerracedMossyBenchB,
  // 7. Basal Talus & Gorge Flank
  createCliff020BasalTalusTransitionWallLeft,
  createCliff021BasalTalusTransitionWallRight,
  createCliff035ValleyGorgeFlankWallDistant,
  // 8. Tectonic Chasms & Slabs
  createCliff015DiagonalFaultShearChasm,
  createCliff026ThreadletSeepFissureBlock,
  createCliff027MassiveTerracottaShearSlab,
  createCliff031MidCliffDrainageChuteGully,
  // 9. Pinnacles, Hoodoos & Arches
  createCliff022WeatheredQuartziteCorniceArch,
  createCliff023MushroomRockPinnacleHoodoo,
  createCliff030HangingOverhangCeilingWedge,
  createCliff034PlateauRimSkylineNotchedCrest,
  // 10. Columnar Block Packs
  createCliff028FracturedColumnarBlockPackA,
  createCliff029FracturedColumnarBlockPackB
} from '../assets/MacroCliffModules.js';
import {
  createRock036GiantCauldronImpactMonolith,
  createRock037TabularSandstoneBeddingSlab,
  createRock038AngularVoronoiCleavageBoulderA,
  createRock039AngularVoronoiCleavageBoulderB
} from '../assets/CanyonBoulderAssets.js';
import { createTepuiRockMaterial } from '../assets/TepuiRockAssets.js';

/**
 * Salto Ángel — Authentic Calibrated Modular 3D Geological Cliff Architecture.
 * Strictly calibrated to reference photographs (Photos #02, #09, #15):
 * 1. Open Skyline & Visible Flat Tepui Tabletop: Plateau rim is capped at Y = +14.2 to +15.3,
 *    allowing blue sky and passing clouds to frame the monumental summit citadel.
 * 2. Unobstructed Top-Rim Cataract Emergence: All rock in the central cascade corridor
 *    (X in [-2.2, +2.2], Y in [-8.5, +14.2]) is recessed behind Z = -5.5, ensuring the
 *    entire 22.7m waterfall drop emerges visibly at the top rim and plunges freely in mid-air.
 * 3. Asymmetric Geological Zones:
 *    - West: Flat sheer vertical salmon-ochre monolith over triangular dark niche
 *    - Center: Recessed wet obsidian alcove back wall
 *    - East: Towering dark-charcoal fortress bastion with spray-wet horizontal shoulder
 *    - Base: V-shaped talus scree ramps descending into dense valley rainforest
 */
export function createTepuiCliff(sharedUniforms) {
  const group = new THREE.Group();
  group.name = 'ModularTepuiCliffSystem';

  const material = createTepuiRockMaterial(sharedUniforms);
  const geometries = [];

  function addModule(name, fn, pos, rot = [0, 0, 0], scale = [1, 1, 1]) {
    const geom = fn();
    geometries.push(geom);
    const mesh = new THREE.Mesh(geom, material);
    mesh.name = name;
    mesh.scale.set(scale[0], scale[1], scale[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }

  // =========================================================================
  // 1. SUMMIT TABLETOP PLATEAU & SKYLINE CREST (Flat Auyán-tepui Tabletop)
  // =========================================================================
  // Plateau tabletop slabs forming the flat horizontal mesa surface (Y = 13.5 to 14.8)
  addModule(
    'PlateauTabletopWest',
    createCliff011PlateauTabletopPavementSlabA,
    [-14.0, 13.5, -14.0],
    [0, 0, 0],
    [0.85, 0.55, 0.85]
  );
  addModule(
    'PlateauTabletopEast',
    createCliff012PlateauTabletopPavementSlabB,
    [14.0, 13.5, -14.0],
    [0, 0, 0],
    [0.85, 0.55, 0.85]
  );

  // Distant summit plateau extension to the horizon (seamlessly seals horizon behind cliff rim Z <= -6.0)
  const plateauBackdropGeom = new THREE.PlaneGeometry(280, 80, 64, 32);
  plateauBackdropGeom.rotateX(-Math.PI * 0.5);
  const pbPos = plateauBackdropGeom.attributes.position;
  const pbV = new THREE.Vector3();

  for (let i = 0; i < pbPos.count; i++) {
    pbV.fromBufferAttribute(pbPos, i);
    // Gentle natural tabletop undulation without sharp drops that breach the rim
    pbV.y += Math.sin(pbV.x * 0.10) * 0.22 + Math.cos(pbV.z * 0.12) * 0.18;
    pbPos.setXYZ(i, pbV.x, pbV.y, pbV.z);
  }
  plateauBackdropGeom.computeVertexNormals();
  plateauBackdropGeom.setAttribute('aAO', new THREE.BufferAttribute(new Float32Array(pbPos.count).fill(0.95), 1));
  plateauBackdropGeom.setAttribute('aCurvature', new THREE.BufferAttribute(new Float32Array(pbPos.count).fill(0.50), 1));
  plateauBackdropGeom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(pbPos.count).fill(0.0), 1));
  geometries.push(plateauBackdropGeom);

  const plateauBackdrop = new THREE.Mesh(plateauBackdropGeom, material);
  plateauBackdrop.name = 'PlateauBackdropPlane';
  plateauBackdrop.position.set(0, 13.5, -46.0);
  group.add(plateauBackdrop);

  // Monolithic mountain core backdrop plane (seals all sky leaks through apertures/clefts, strictly capped at tabletop rim Y <= 13.8)
  const mountainCoreBackdropGeom = new THREE.PlaneGeometry(280, 36.5, 64, 16);
  const mcbPos = mountainCoreBackdropGeom.attributes.position;
  for (let i = 0; i < mcbPos.count; i++) {
    const vx = mcbPos.getX(i);
    const vy = mcbPos.getY(i);
    if (vy > 15.0 && Math.abs(vx) < 3.8) {
      const notchDip = (1.0 - Math.abs(vx) / 3.8) * 2.8;
      mcbPos.setY(i, vy - notchDip);
    }
  }
  mountainCoreBackdropGeom.computeVertexNormals();
  mountainCoreBackdropGeom.setAttribute('aAO', new THREE.BufferAttribute(new Float32Array(mcbPos.count).fill(0.35), 1));
  mountainCoreBackdropGeom.setAttribute('aCurvature', new THREE.BufferAttribute(new Float32Array(mcbPos.count).fill(0.42), 1));
  mountainCoreBackdropGeom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(mcbPos.count).fill(0.0), 1));
  geometries.push(mountainCoreBackdropGeom);

  const mountainCoreBackdrop = new THREE.Mesh(mountainCoreBackdropGeom, material);
  mountainCoreBackdrop.name = 'MountainCoreBackdropPlane';
  mountainCoreBackdrop.position.set(0, -4.5, -12.0);
  group.add(mountainCoreBackdrop);

  // Wrap-around lateral flank backdrop wings to seal oblique 45° viewpoints (Left & Right Oblique)
  const flankWingGeom = new THREE.PlaneGeometry(130, 36.5, 16, 16);
  flankWingGeom.setAttribute('aAO', new THREE.BufferAttribute(new Float32Array(flankWingGeom.attributes.position.count).fill(0.40), 1));
  flankWingGeom.setAttribute('aCurvature', new THREE.BufferAttribute(new Float32Array(flankWingGeom.attributes.position.count).fill(0.45), 1));
  flankWingGeom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(flankWingGeom.attributes.position.count).fill(0.0), 1));
  geometries.push(flankWingGeom);

  const westBackdropWing = new THREE.Mesh(flankWingGeom, material);
  westBackdropWing.name = 'WestBackdropWing';
  westBackdropWing.position.set(-36.0, -4.5, -7.0);
  westBackdropWing.rotation.set(0, Math.PI * 0.35, 0);
  group.add(westBackdropWing);

  const eastBackdropWing = new THREE.Mesh(flankWingGeom, material);
  eastBackdropWing.name = 'EastBackdropWing';
  eastBackdropWing.position.set(36.0, -4.5, -7.0);
  eastBackdropWing.rotation.set(0, -Math.PI * 0.35, 0);
  group.add(eastBackdropWing);

  // Continuous basal canyon bedrock foundation (seals bottom against any sky-leaks when foliage is hidden)
  const basalBedrockGeom = new THREE.PlaneGeometry(280, 100, 32, 24);
  basalBedrockGeom.rotateX(-Math.PI * 0.5);
  const bbPos = basalBedrockGeom.attributes.position;
  basalBedrockGeom.setAttribute('aAO', new THREE.BufferAttribute(new Float32Array(bbPos.count).fill(0.55), 1));
  basalBedrockGeom.setAttribute('aCurvature', new THREE.BufferAttribute(new Float32Array(bbPos.count).fill(0.45), 1));
  basalBedrockGeom.setAttribute('aPartType', new THREE.BufferAttribute(new Float32Array(bbPos.count).fill(0.0), 1));
  geometries.push(basalBedrockGeom);

  const basalBedrock = new THREE.Mesh(basalBedrockGeom, material);
  basalBedrock.name = 'BasalCanyonBedrockFoundation';
  basalBedrock.position.set(0, -14.5, 10.0);
  group.add(basalBedrock);

  // CLIFF-034: Plateau Rim Skyline Notched Crest crowning the summit rim
  addModule(
    'PlateauRimNotchedCrestCentral',
    createCliff034PlateauRimSkylineNotchedCrest,
    [0.0, 12.65, -7.0],
    [0, 0, 0],
    [0.42, 0.45, 0.40]
  );

  // CLIFF-010: Cantilevered overhang cornice brow crowning the top rim
  addModule(
    'OverhangCorniceRim',
    createCliff010OverhangCorniceBlock,
    [-0.2, 12.75, -7.6],
    [0, 0, 0],
    [0.42, 0.40, 0.32]
  );

  // CLIFF-022: Weathered natural stone bridge arch spanning summit grieta
  addModule(
    'WeatheredCorniceArchWest',
    createCliff022WeatheredQuartziteCorniceArch,
    [-6.5, 13.0, -6.2],
    [0, 0.15, 0],
    [0.45, 0.45, 0.45]
  );

  // Fortress battlement spires flanking the skyline (re-aligned flush to the plateau tabletop)
  addModule(
    'SummitSpireWestA',
    createCliff008SummitCastellatedSpireA,
    [-14.5, 11.75, -6.0],
    [0, 0.2, 0],
    [0.55, 0.42, 0.55]
  );
  addModule(
    'SummitSpireWestB',
    createCliff009SummitCastellatedSpireB,
    [-20.0, 11.20, -6.5],
    [0, -0.15, 0],
    [0.55, 0.42, 0.55]
  );
  addModule(
    'SummitSpireEastA',
    createCliff009SummitCastellatedSpireB,
    [15.5, 11.20, -5.5],
    [0, -0.25, 0],
    [0.55, 0.42, 0.55]
  );
  addModule(
    'SummitSpireEastB',
    createCliff008SummitCastellatedSpireA,
    [21.5, 11.00, -6.2],
    [0, 0.18, 0],
    [0.55, 0.38, 0.55]
  );

  // CLIFF-023: Mushroom Rock Pinnacle Hoodoo on northwest skyline shoulder
  addModule(
    'MushroomPinnacleHoodooNorthWest',
    createCliff023MushroomRockPinnacleHoodoo,
    [-24.0, 11.40, -5.8],
    [0, 0.35, 0],
    [0.55, 0.42, 0.55]
  );

  // CLIFF-030: Hanging Overhang Ceiling Wedge deep within summit shadow cavity
  addModule(
    'HangingCeilingWedgeCleft',
    createCliff030HangingOverhangCeilingWedge,
    [-0.2, 13.2, -7.2],
    [0, 0, 0],
    [0.40, 0.35, 0.35]
  );

  // =========================================================================
  // 2. SUBTERRANEAN EMERGENCE CLEFT ARCH, CAVERNS & TECTONIC CHASMS
  // =========================================================================
  // CLIFF-001: 807m emergence arch recessed behind waterfall (aligned <= 13.8m mesa rim)
  addModule(
    'EmergenceCleftArch',
    createCliff001EmergenceCleftArch,
    [-0.3, 11.8, -7.2],
    [0, 0, 0],
    [0.42, 0.38, 0.32]
  );

  // CLIFF-024: Cavern interior conduit mouth flush behind arch
  addModule(
    'SubterraneanConduitMouth',
    createCliff024SubterraneanCaveConduitEgress,
    [-0.3, 11.4, -8.6],
    [0, 0, 0],
    [0.45, 0.45, 0.45]
  );

  // CLIFF-025: Secondary stream fracture notch (creates twin chute notch)
  addModule(
    'SecondaryFractureNotch',
    createCliff025SecondaryStreamFractureNotch,
    [1.4, 12.5, -6.8],
    [0, -0.12, 0],
    [0.42, 0.38, 0.32]
  );

  // CLIFF-015: Diagonal tectonic shear chasm cutting through west rim (aligned <= 12.5m rim)
  addModule(
    'DiagonalFaultShearChasmWest',
    createCliff015DiagonalFaultShearChasm,
    [-5.2, 6.8, -6.2],
    [0, 0.15, 0],
    [0.40, 0.38, 0.38]
  );

  // =========================================================================
  // 3. CENTRAL WET ALCOVE BACK WALL & MONOLITHIC SHEAR SLABS
  // =========================================================================
  // CLIFF-007: Central wet alcove plunge back wall recessed behind water
  addModule(
    'CentralWetAlcoveBackWall',
    createCliff007CentralWetAlcoveBackWall,
    [0.0, 2.5, -7.8],
    [0, 0, 0],
    [0.45, 0.45, 0.40]
  );

  // CLIFF-027: Massive terracotta shear slab behind mid cataract
  addModule(
    'MassiveTerracottaShearSlabLower',
    createCliff027MassiveTerracottaShearSlab,
    [1.2, -3.8, -7.2],
    [0, -0.06, 0],
    [0.45, 0.45, 0.40]
  );

  // CLIFF-026: Threadlet seep fissure block with wet dripping points
  addModule(
    'ThreadletSeepFissureWest',
    createCliff026ThreadletSeepFissureBlock,
    [-2.4, 5.5, -6.8],
    [0, 0.08, 0],
    [0.45, 0.45, 0.40]
  );

  // CLIFF-031: Mid-cliff drainage chute gully worn smooth by secondary cascades
  addModule(
    'MidCliffDrainageGullyEast',
    createCliff031MidCliffDrainageChuteGully,
    [2.8, 4.5, -6.6],
    [0, -0.10, 0],
    [0.45, 0.45, 0.40]
  );

  // =========================================================================
  // 4. LEFT AMPHITHEATER SHEER SALMON FACE & BENCHES (West Flank)
  // =========================================================================
  // CLIFF-002: Upper concave amphitheater sheer wall curving around plunge basin
  addModule(
    'LeftAmphitheaterUpper',
    createCliff002LeftAmphitheaterConcaveWallA,
    [-10.5, 4.5, -5.2],
    [0, 0.25, 0],
    [0.40, 0.42, 0.38]
  );

  // CLIFF-003: Lower concave amphitheater stepped wall over triangular shadow niche
  addModule(
    'LeftAmphitheaterLower',
    createCliff003LeftAmphitheaterConcaveWallB,
    [-12.5, -4.2, -4.5],
    [0, 0.35, 0],
    [0.40, 0.40, 0.38]
  );

  // CLIFF-018: Stepped corner ledge anchoring amphitheater into talus
  addModule(
    'LeftAmphitheaterCornerLedge',
    createCliff018SteppedAmphitheaterCornerLedge,
    [-17.5, -9.5, -2.5],
    [0, 0.42, 0],
    [0.42, 0.42, 0.40]
  );

  // CLIFF-032: Terraced mossy bench A on western mid amphitheater (embedded into concave wall)
  addModule(
    'TerracedMossyBenchWestA',
    createCliff032TerracedMossyBenchA,
    [-9.0, 0.8, -8.0],
    [0, 0.20, 0],
    [0.45, 0.45, 0.42]
  );

  // CLIFF-033: Terraced mossy bench B on western upper shelf (embedded into wall)
  addModule(
    'TerracedMossyBenchWestB',
    createCliff033TerracedMossyBenchB,
    [-14.5, 7.5, -7.2],
    [0, 0.28, 0],
    [0.42, 0.42, 0.40]
  );

  // =========================================================================
  // 5. RIGHT BUTTRESS BASTION & TERRACE SHELVES (East Flank)
  // =========================================================================
  // CLIFF-004: Massive projecting prow defining iconic Salto Ángel profile
  addModule(
    'RightButtressMainProw',
    createCliff004RightButtressMainProw,
    [10.2, 3.8, -3.8],
    [0, -0.22, 0],
    [0.38, 0.42, 0.30]
  );

  // CLIFF-005: Flat horizontal mid-terrace shelf where vegetation zones
  addModule(
    'RightButtressMidShelf',
    createCliff005RightButtressMidTerraceShelf,
    [8.8, 0.2, -1.8],
    [0, -0.15, 0],
    [0.42, 0.42, 0.38]
  );

  // CLIFF-006: Lower stepped shelf descending to canyon talus
  addModule(
    'RightButtressLowerStep',
    createCliff006RightButtressLowerStepBase,
    [10.5, -7.5, 0.5],
    [0, -0.10, 0],
    [0.40, 0.40, 0.35]
  );

  // CLIFF-019: Sharp faceted outer keel prow
  addModule(
    'RightButtressCornerProw',
    createCliff019ProtrudingButtressCornerProw,
    [16.5, -1.2, -1.5],
    [0, -0.30, 0],
    [0.40, 0.40, 0.35]
  );

  // CLIFF-016: Horizontal Strata Shelf A (embedded into buttress wall at Y = 6.8)
  addModule(
    'HorizontalStrataShelfEastA',
    createCliff016HorizontalStrataShelfA,
    [9.5, 6.8, -4.6],
    [0, -0.18, 0],
    [0.42, 0.42, 0.38]
  );

  // CLIFF-017: Horizontal Strata Shelf B (Narrow stepped rubble shelf)
  addModule(
    'HorizontalStrataShelfEastB',
    createCliff017HorizontalStrataShelfB,
    [14.8, 2.8, -0.8],
    [0, -0.22, 0],
    [0.42, 0.42, 0.38]
  );

  // =========================================================================
  // 6. COLUMNAR BASTIONS & FRACTURED BLOCK PACKS
  // =========================================================================
  // CLIFF-013: Tri-fluted column bastion flanking the eastern cataract
  addModule(
    'ColumnarBastionTriplePillar',
    createCliff013ColumnarRibBastionTriplePillar,
    [4.8, 2.8, -6.0],
    [0, -0.15, 0],
    [0.42, 0.42, 0.40]
  );

  // CLIFF-014: Slender fluted pilaster on far right flank
  addModule(
    'ColumnarBastionSingleFluted',
    createCliff014ColumnarRibBastionSingleFluted,
    [18.5, 5.5, -2.5],
    [0, -0.25, 0],
    [0.42, 0.42, 0.40]
  );

  // CLIFF-028: Fractured Columnar Block Pack A (6 interlocking columns)
  addModule(
    'ColumnarBlockPackA_East',
    createCliff028FracturedColumnarBlockPackA,
    [13.2, -2.5, 0.2],
    [0, -0.18, 0],
    [0.42, 0.42, 0.38]
  );

  // CLIFF-029: Fractured Columnar Block Pack B (4 sheared columns with cross-bedding)
  addModule(
    'ColumnarBlockPackB_East',
    createCliff029FracturedColumnarBlockPackB,
    [15.5, -6.0, 1.2],
    [0, -0.20, 0],
    [0.42, 0.42, 0.38]
  );

  // =========================================================================
  // 7. BASAL TALUS WALLS & PERIPHERAL GORGE FLANK
  // =========================================================================
  // CLIFF-020: Basal Talus Transition Wall Left (45° bedrock ramp into talus)
  addModule(
    'BasalTalusTransitionLeft',
    createCliff020BasalTalusTransitionWallLeft,
    [-16.5, -9.5, 0.5],
    [0, 0.32, 0],
    [0.72, 0.70, 0.55]
  );

  // CLIFF-021: Basal Talus Transition Wall Right (45° bedrock ramp into river jungle)
  addModule(
    'BasalTalusTransitionRight',
    createCliff021BasalTalusTransitionWallRight,
    [17.5, -9.5, 2.8],
    [0, -0.25, 0],
    [0.72, 0.70, 0.55]
  );

  // Upper West Mesa Flank Wall (Monolithic quartzite wall grounding western summit spires, lowered <= 10m)
  addModule(
    'UpperWestMesaFlankWall',
    createCliff027MassiveTerracottaShearSlab,
    [-22.5, 2.5, -5.5],
    [0, 0.32, 0],
    [0.78, 0.55, 0.52]
  );

  // CLIFF-035: Valley Gorge Flank Wall Distant West (Framing peripheral western canyon wall down to valley floor)
  addModule(
    'ValleyGorgeFlankDistantWest',
    createCliff035ValleyGorgeFlankWallDistant,
    [-24.0, -9.0, -3.2],
    [0, 0.40, 0],
    [0.85, 0.75, 0.60]
  );

  // Upper East Mesa Flank Wall (Towering buttress bastion grounding eastern summit spires, lowered <= 10.5m)
  addModule(
    'UpperEastMesaFlankWall',
    createCliff004RightButtressMainProw,
    [19.8, 0.5, -5.2],
    [0, -0.18, 0],
    [0.78, 0.52, 0.52]
  );

  // CLIFF-035: Valley Gorge Flank Wall Distant East (Framing peripheral eastern canyon wall down to valley floor)
  addModule(
    'ValleyGorgeFlankDistantEast',
    createCliff035ValleyGorgeFlankWallDistant,
    [24.5, -9.0, -2.2],
    [0, -0.35, 0],
    [0.85, 0.75, 0.60]
  );

  // Sealing backdrop slab behind west stone bridge arch (seals aperture from oblique camera angles)
  addModule(
    'WestArchSealingBackdrop',
    createCliff027MassiveTerracottaShearSlab,
    [-6.5, 9.5, -9.5],
    [0, 0.15, 0],
    [1.35, 0.65, 0.60]
  );

  // Central canyon sealing slab directly behind the waterfall corridor (Z = -8.8, strictly <= 11.2m, no skyline protrusion)
  addModule(
    'CentralAlcoveSealingBackdrop',
    createCliff027MassiveTerracottaShearSlab,
    [0.0, 3.8, -8.8],
    [0, 0, 0],
    [1.95, 0.65, 0.60]
  );

  // Deep canyon bedrock foundation sealing the plunge basin floor
  addModule(
    'CentralPlungeBasinBedrock',
    createCliff027MassiveTerracottaShearSlab,
    [0.0, -9.0, -7.5],
    [0, 0, 0],
    [1.20, 0.70, 0.50]
  );

  // Lateral flank sealing slabs for oblique 45° inspection angles (Left & Right Oblique, seals joint gaps)
  addModule(
    'WestFlankObliqueSealingSlab',
    createCliff027MassiveTerracottaShearSlab,
    [-18.5, 3.0, -8.2],
    [0, 0.38, 0],
    [2.10, 0.85, 0.75]
  );
  addModule(
    'EastFlankObliqueSealingSlab',
    createCliff027MassiveTerracottaShearSlab,
    [18.5, 3.0, -8.2],
    [0, -0.38, 0],
    [2.10, 0.85, 0.75]
  );

  // =========================================================================
  // 8. CATEGORY B — PLUNGE POOL & TALUS BOULDER MONOLITHS (BOM.md)
  // =========================================================================
  // ROCK-036: Giant Cauldron Impact Monolith (Photos #03, #15)
  addModule(
    'GiantCauldronImpactMonolithMain',
    createRock036GiantCauldronImpactMonolith,
    [1.5, -8.3, -2.9],
    [0, 0.22, 0],
    [0.68, 0.65, 0.65]
  );
  addModule(
    'GiantCauldronImpactMonolithEast',
    createRock036GiantCauldronImpactMonolith,
    [3.6, -8.2, -2.4],
    [0, 0.38, 0],
    [0.55, 0.55, 0.55]
  );

  // ROCK-037: Tabular Sandstone Bedding Slab
  addModule(
    'TabularSandstoneBeddingSlabWest',
    createRock037TabularSandstoneBeddingSlab,
    [-3.5, -8.4, -2.2],
    [0, -0.35, 0],
    [0.65, 0.65, 0.65]
  );
  addModule(
    'TabularSandstoneBeddingSlabPlunge',
    createRock037TabularSandstoneBeddingSlab,
    [-1.6, -8.5, -2.6],
    [0, 0.15, 0],
    [0.72, 0.60, 0.65]
  );

  // ROCK-038: Angular Voronoi Cleavage Boulder A
  addModule(
    'AngularVoronoiBoulderEast',
    createRock038AngularVoronoiCleavageBoulderA,
    [4.6, -8.7, 0.2],
    [0, 0.45, 0],
    [0.70, 0.70, 0.70]
  );
  addModule(
    'AngularVoronoiBoulderPlungeCenter',
    createRock038AngularVoronoiCleavageBoulderA,
    [0.2, -8.6, -1.8],
    [0, -0.18, 0],
    [0.65, 0.65, 0.65]
  );

  // ROCK-039: Angular Voronoi Cleavage Boulder B
  addModule(
    'AngularVoronoiBoulderWest',
    createRock039AngularVoronoiCleavageBoulderB,
    [-4.2, -8.8, 0.8],
    [0, -0.22, 0],
    [0.70, 0.70, 0.70]
  );

  return {
    group,
    mesh: group,
    material,
    update(time, cameraPos) {
      material.uniforms.uTime.value = time;
      if (material.uniforms.uCameraPos) {
        material.uniforms.uCameraPos.value.copy(cameraPos);
      }
    },
    dispose() {
      for (const geom of geometries) {
        geom.dispose();
      }
      material.dispose();
    }
  };
}
