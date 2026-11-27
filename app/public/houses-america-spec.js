// The measures and the colours of the houses of North America (houses-america.js draws them, loaded when a cut is there).
// storey, floors: the typical storey (cm) and the floors of a house of no known floors; groundK: the ground floor in
// storeys; base: how high the first floor stands over the sidewalk (an English basement, a stoop, a porch); attic: the
// wall over the top floor's windows; roof: how high the roof rises over the wall.
export const AMERICA = {
  bayrow: { storey: 320, floors: 2, base: 105, attic: 70, roof: 190 },
  porchrow: { storey: 290, floors: 2, base: 95, attic: 20, roof: 200 },
  framehouse: { storey: 270, floors: 2, base: 75, attic: 10, roof: 330 },
  brickblock: { storey: 290, floors: 4, base: 45, attic: 45, roof: 60 },
  slab: { storey: 275, floors: 8, groundK: 1.25, base: 0, attic: 20, roof: 230 },
  podium: { storey: 300, floors: 5, groundK: 1.5, base: 0, attic: 30, roof: 70 },
  glasstower: { storey: 310, floors: 12, groundK: 1.6, base: 0, attic: 20, roof: 320 },
  mainstreet: { storey: 340, floors: 2, groundK: 1.15, base: 0, attic: 90, roof: 60 },
  stripmall: { storey: 400, floors: 1, base: 0, attic: 40, roof: 120 },
  brownstone: { storey: 330, floors: 4, base: 165, attic: 75, roof: 60 },
  tenement: { storey: 310, floors: 5, groundK: 1.15, base: 0, attic: 60, roof: 120 },
  tripledecker: { storey: 285, floors: 3, base: 80, attic: 30, roof: 90 },
  baygable: { storey: 310, floors: 2, base: 70, attic: 20, roof: 400 },
  victorian: { storey: 315, floors: 3, groundK: 1.25, base: 0, attic: 60, roof: 130 },
};
const SIDING = ["#f1efe8", "#d3d8d6", "#b9c6cc", "#c9cfb6", "#eadfbe", "#a9b4ae"];
export const AMERICA_PALETTES = {
  bayrow: ["#9c4a36", "#8a4031", "#a9573f", "#b9b3a4", "#a04e3a"],
  porchrow: ["#a9573f", "#9c4a36", "#b98a64", "#8f4a38"],
  framehouse: SIDING,
  brickblock: ["#a9573f", "#b98f68", "#9c4a36", "#c2a27c"],
  slab: ["#d8d0c0", "#c9b59a", "#b98f74", "#e2ded4"],
  podium: ["#c9c5bb", "#b9a58a", "#a9b0b2"],
  glasstower: ["#6f95a8", "#7ba0ab", "#6a8a9c"],
  mainstreet: ["#a9573f", "#8a4031", "#c2a27c", "#b9b3a4"],
  stripmall: ["#dccfb4", "#c9b59a", "#e4ddcd", "#b98f74"],
  brownstone: ["#7d5140", "#74493a", "#8a5c48", "#6e4a3e"],
  tenement: ["#a24c36", "#b98a5c", "#8a4031", "#c39a6c"],
  tripledecker: ["#e8e0c8", "#b9c6cc", "#d3d8d6", "#c9cfb6", "#d9b78f"],
  baygable: ["#9c4a36", "#a9573f", "#8f4536"],
  victorian: ["#a9c0c9", "#e6cf9a", "#d9a6a0", "#b5c8a0", "#c7b8d6", "#e9e2d0"],
};
