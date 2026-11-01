import * as THREE from 'three';

// 1. Cleft and Cornice Modules
export {
  createCliff001EmergenceCleftArch,
  createCliff010OverhangCorniceBlock,
  createCliff024SubterraneanCaveConduitEgress,
  createCliff025SecondaryStreamFractureNotch,
  createCliffRockMaterial
} from './macroCliffs/CleftAndCorniceModules.js';

// 2. Amphitheater Wall Modules
export {
  createCliff002LeftAmphitheaterConcaveWallA,
  createCliff003LeftAmphitheaterConcaveWallB,
  createCliff007CentralWetAlcoveBackWall,
  createCliff018SteppedAmphitheaterCornerLedge
} from './macroCliffs/AmphitheaterModules.js';

// 3. Buttress & Terrace Modules
export {
  createCliff004RightButtressMainProw,
  createCliff005RightButtressMidTerraceShelf,
  createCliff006RightButtressLowerStepBase,
  createCliff019ProtrudingButtressCornerProw,
  BUTTRESS_MODULES
} from './macroCliffs/ButtressModules.js';

// 4. Columnar & Spire Modules
export {
  createCliff008SummitCastellatedSpireA,
  createCliff009SummitCastellatedSpireB,
  createCliff013ColumnarRibBastionTriplePillar,
  createCliff014ColumnarRibBastionSingleFluted
} from './macroCliffs/ColumnarSpireModules.js';

// 5. Plateau Pavement Modules
export {
  createCliff011PlateauTabletopPavementSlabA,
  createCliff012PlateauTabletopPavementSlabB,
  createPlateauRockMaterial
} from './macroCliffs/PlateauPavementModules.js';

// 6. Strata Shelves & Benches Modules
export {
  createCliff016HorizontalStrataShelfA,
  createCliff017HorizontalStrataShelfB,
  createCliff032TerracedMossyBenchA,
  createCliff033TerracedMossyBenchB,
  STRATA_SHELF_MODULES
} from './macroCliffs/StrataShelfModules.js';

// 7. Basal Talus & Gorge Flank Modules
export {
  createCliff020BasalTalusTransitionWallLeft,
  createCliff021BasalTalusTransitionWallRight,
  createCliff035ValleyGorgeFlankWallDistant,
  createBasalTransitionRockMaterial,
  BASAL_TRANSITION_MODULES
} from './macroCliffs/BasalTransitionModules.js';

// 8. Tectonic Chasms, Slabs & Gullies
export {
  createCliff015DiagonalFaultShearChasm,
  createCliff026ThreadletSeepFissureBlock,
  createCliff027MassiveTerracottaShearSlab,
  createCliff031MidCliffDrainageChuteGully,
  TECTONIC_CHASM_MODULES
} from './macroCliffs/TectonicChasmModules.js';

// 9. Pinnacles, Hoodoos, Arches & Crests
export {
  createCliff022WeatheredQuartziteCorniceArch,
  createCliff023MushroomRockPinnacleHoodoo,
  createCliff030HangingOverhangCeilingWedge,
  createCliff034PlateauRimSkylineNotchedCrest,
  createPinnacleRockMaterial,
  PINNACLE_AND_ARCH_MODULES
} from './macroCliffs/PinnacleAndArchModules.js';

// 10. Columnar Block Packs
export {
  createCliff028FracturedColumnarBlockPackA,
  createCliff029FracturedColumnarBlockPackB,
  COLUMNAR_BLOCK_PACK_MODULES
} from './macroCliffs/ColumnarBlockPackModules.js';

// Milestone 1 Macro Cliff Catalog Mapping (All 35 Modules)
import {
  createCliff001EmergenceCleftArch,
  createCliff010OverhangCorniceBlock,
  createCliff024SubterraneanCaveConduitEgress,
  createCliff025SecondaryStreamFractureNotch
} from './macroCliffs/CleftAndCorniceModules.js';

import {
  createCliff002LeftAmphitheaterConcaveWallA,
  createCliff003LeftAmphitheaterConcaveWallB,
  createCliff007CentralWetAlcoveBackWall,
  createCliff018SteppedAmphitheaterCornerLedge
} from './macroCliffs/AmphitheaterModules.js';

import {
  createCliff004RightButtressMainProw,
  createCliff005RightButtressMidTerraceShelf,
  createCliff006RightButtressLowerStepBase,
  createCliff019ProtrudingButtressCornerProw
} from './macroCliffs/ButtressModules.js';

import {
  createCliff008SummitCastellatedSpireA,
  createCliff009SummitCastellatedSpireB,
  createCliff013ColumnarRibBastionTriplePillar,
  createCliff014ColumnarRibBastionSingleFluted
} from './macroCliffs/ColumnarSpireModules.js';

import {
  createCliff011PlateauTabletopPavementSlabA,
  createCliff012PlateauTabletopPavementSlabB
} from './macroCliffs/PlateauPavementModules.js';

import {
  createCliff016HorizontalStrataShelfA,
  createCliff017HorizontalStrataShelfB,
  createCliff032TerracedMossyBenchA,
  createCliff033TerracedMossyBenchB
} from './macroCliffs/StrataShelfModules.js';

import {
  createCliff020BasalTalusTransitionWallLeft,
  createCliff021BasalTalusTransitionWallRight,
  createCliff035ValleyGorgeFlankWallDistant
} from './macroCliffs/BasalTransitionModules.js';

import {
  createCliff015DiagonalFaultShearChasm,
  createCliff026ThreadletSeepFissureBlock,
  createCliff027MassiveTerracottaShearSlab,
  createCliff031MidCliffDrainageChuteGully
} from './macroCliffs/TectonicChasmModules.js';

import {
  createCliff022WeatheredQuartziteCorniceArch,
  createCliff023MushroomRockPinnacleHoodoo,
  createCliff030HangingOverhangCeilingWedge,
  createCliff034PlateauRimSkylineNotchedCrest
} from './macroCliffs/PinnacleAndArchModules.js';

import {
  createCliff028FracturedColumnarBlockPackA,
  createCliff029FracturedColumnarBlockPackB
} from './macroCliffs/ColumnarBlockPackModules.js';

export const MILESTONE_1_CLIFF_MODULES = {
  'CLIFF-001': { name: 'Emergence Cleft Arch', create: createCliff001EmergenceCleftArch, dims: [32, 28, 22] },
  'CLIFF-002': { name: 'Left Amphitheater Concave Wall A', create: createCliff002LeftAmphitheaterConcaveWallA, dims: [30, 42, 14] },
  'CLIFF-003': { name: 'Left Amphitheater Concave Wall B', create: createCliff003LeftAmphitheaterConcaveWallB, dims: [28, 38, 12] },
  'CLIFF-004': { name: 'Right Buttress Main Prow', create: createCliff004RightButtressMainProw, dims: [34, 46, 24] },
  'CLIFF-005': { name: 'Right Buttress Mid Terrace Shelf', create: createCliff005RightButtressMidTerraceShelf, dims: [26, 12, 18] },
  'CLIFF-006': { name: 'Right Buttress Lower Step Base', create: createCliff006RightButtressLowerStepBase, dims: [30, 22, 26] },
  'CLIFF-007': { name: 'Central Wet Alcove Back Wall', create: createCliff007CentralWetAlcoveBackWall, dims: [22, 48, 10] },
  'CLIFF-008': { name: 'Summit Castellated Spire A', create: createCliff008SummitCastellatedSpireA, dims: [6, 8, 6] },
  'CLIFF-009': { name: 'Summit Castellated Spire B', create: createCliff009SummitCastellatedSpireB, dims: [5, 10, 5] },
  'CLIFF-010': { name: 'Overhang Cornice Block', create: createCliff010OverhangCorniceBlock, dims: [16, 6, 14] },
  'CLIFF-011': { name: 'Plateau Tabletop Pavement Slab A', create: createCliff011PlateauTabletopPavementSlabA, dims: [24, 3, 24] },
  'CLIFF-012': { name: 'Plateau Tabletop Pavement Slab B', create: createCliff012PlateauTabletopPavementSlabB, dims: [20, 3, 20] },
  'CLIFF-013': { name: 'Columnar Rib Bastion Triple Pillar', create: createCliff013ColumnarRibBastionTriplePillar, dims: [10, 28, 8] },
  'CLIFF-014': { name: 'Columnar Rib Bastion Single Fluted', create: createCliff014ColumnarRibBastionSingleFluted, dims: [5, 26, 6] },
  'CLIFF-015': { name: 'Diagonal Fault Shear Chasm', create: createCliff015DiagonalFaultShearChasm, dims: [8, 30, 12] },
  'CLIFF-016': { name: 'Horizontal Strata Shelf A', create: createCliff016HorizontalStrataShelfA, dims: [20, 4, 6] },
  'CLIFF-017': { name: 'Horizontal Strata Shelf B', create: createCliff017HorizontalStrataShelfB, dims: [14, 3, 5] },
  'CLIFF-018': { name: 'Stepped Amphitheater Corner Ledge', create: createCliff018SteppedAmphitheaterCornerLedge, dims: [18, 24, 16] },
  'CLIFF-019': { name: 'Protruding Buttress Corner Prow', create: createCliff019ProtrudingButtressCornerProw, dims: [18, 32, 18] },
  'CLIFF-020': { name: 'Basal Talus Transition Wall Left', create: createCliff020BasalTalusTransitionWallLeft, dims: [22, 16, 16] },
  'CLIFF-021': { name: 'Basal Talus Transition Wall Right', create: createCliff021BasalTalusTransitionWallRight, dims: [22, 16, 16] },
  'CLIFF-022': { name: 'Weathered Quartzite Cornice Arch', create: createCliff022WeatheredQuartziteCorniceArch, dims: [10, 6, 6] },
  'CLIFF-023': { name: 'Mushroom Rock Pinnacle Hoodoo', create: createCliff023MushroomRockPinnacleHoodoo, dims: [4, 8, 4] },
  'CLIFF-024': { name: 'Subterranean Cave Conduit Egress', create: createCliff024SubterraneanCaveConduitEgress, dims: [14, 18, 16] },
  'CLIFF-025': { name: 'Secondary Stream Fracture Notch', create: createCliff025SecondaryStreamFractureNotch, dims: [10, 16, 12] },
  'CLIFF-026': { name: 'Threadlet Seep Fissure Block', create: createCliff026ThreadletSeepFissureBlock, dims: [3, 14, 4] },
  'CLIFF-027': { name: 'Massive Terracotta Shear Slab', create: createCliff027MassiveTerracottaShearSlab, dims: [16, 24, 5] },
  'CLIFF-028': { name: 'Fractured Columnar Block Pack A', create: createCliff028FracturedColumnarBlockPackA, dims: [12, 16, 8] },
  'CLIFF-029': { name: 'Fractured Columnar Block Pack B', create: createCliff029FracturedColumnarBlockPackB, dims: [10, 14, 7] },
  'CLIFF-030': { name: 'Hanging Overhang Ceiling Wedge', create: createCliff030HangingOverhangCeilingWedge, dims: [12, 6, 10] },
  'CLIFF-031': { name: 'Mid-Cliff Drainage Chute Gully', create: createCliff031MidCliffDrainageChuteGully, dims: [6, 20, 5] },
  'CLIFF-032': { name: 'Terraced Mossy Bench A', create: createCliff032TerracedMossyBenchA, dims: [16, 4, 7] },
  'CLIFF-033': { name: 'Terraced Mossy Bench B', create: createCliff033TerracedMossyBenchB, dims: [12, 3, 5] },
  'CLIFF-034': { name: 'Plateau Rim Skyline Notched Crest', create: createCliff034PlateauRimSkylineNotchedCrest, dims: [24, 6, 8] },
  'CLIFF-035': { name: 'Valley Gorge Flank Wall Distant', create: createCliff035ValleyGorgeFlankWallDistant, dims: [30, 20, 15] }
};
