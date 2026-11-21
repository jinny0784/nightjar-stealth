// Nightjar levels: three floors of Ashworth Manor.
// Grid legend: # wall · . floor · , carpet · D doorway · C crate cover ·
// H hedge cover · s shadow floor (harder to be seen) · L lamplight (easier)
// P player start · O the ledger to photograph · X the exit.
// Guard patrols are waypoint loops in tile coordinates; cameras sweep
// between two angles (radians, 0 = east, positive = clockwise).

export const LEVELS = [
  {
    name: 'Floor One — The Ground Floor',
    brief: 'Photograph the ledger in the study, then slip out the front door. Guards walk set routes — learn them.',
    par: 80,
    grid: [
      '############################',
      '#......#.........#.........#',
      '#..P...#....,....#....O....#',
      '#......D.........#.........#',
      '#......#....,....#....C....#',
      '###.#################.######',
      '#..........................#',
      '#...CC......LL......CC.....#',
      '#...CC......LL......CC.....#',
      '#############..#############',
      '#....ss.......#......ss....#',
      '#....ss.......D......ss....#',
      '#.............#............#',
      '#..HH.......#........HH....#',
      '#####.##############.#######',
      '#.........................X#',
      '############################',
    ],
    guards: [
      { path: [[2, 6], [25, 6]], wait: 1.4 },
      { path: [[19, 1], [26, 1], [26, 3], [19, 3]], wait: 0.7 },
    ],
    cameras: [],
  },
  {
    name: 'Floor Two — The Gallery Wing',
    brief: 'The gallery ledger sits under a camera sweep. Cross in its blind moments, use the garden shadows.',
    par: 110,
    grid: [
      '############################',
      '#..ss....#........#....ss..#',
      '#..ss.P..D...,,...D....C...#',
      '#........#........#........#',
      '###.######...##...#####.####',
      '#..........................#',
      '#..HH....LL....LL....HH....#',
      '#..HH....LL....LL....HH....#',
      '#..........................#',
      '#####.########.########.####',
      '#......#........#..........#',
      '#..C...D...##...D....C.....#',
      '#......#........#..........#',
      '#..ss..#....O...#....ss....#',
      '###.####....#####....###.###',
      '#.........................X#',
      '############################',
    ],
    guards: [
      { path: [[2, 5], [25, 5], [25, 8], [2, 8]], wait: 0.8 },
      { path: [[20, 10], [26, 10], [26, 13], [20, 13]], wait: 0.6 },
      { path: [[2, 12], [6, 12], [6, 10], [2, 10]], wait: 1.0 },
    ],
    cameras: [
      { tile: [13, 12], from: -0.4, to: 2.2, speed: 0.45 },
    ],
  },
  {
    name: "Floor Three — The Master's Floor",
    brief: 'Two cameras, four guards, one ledger. The master floor forgives nothing — patience is the only key.',
    par: 140,
    grid: [
      '############################',
      '#....#......ss......#......#',
      '#.P..D......ss......D...O..#',
      '#....#..............#......#',
      '##.#####.########.#####.####',
      '#......#........#..........#',
      '#..CC..D...LL...D..CC......#',
      '#..CC..#...LL...#..CC..##..#',
      '#......#........#......##..#',
      '###.#######..##########.####',
      '#..........#...............#',
      '#..ss......D.....HH....C...#',
      '#..ss......#.....HH........#',
      '#......#####.#####......####',
      '#..........................#',
      '#..HH..........HH........X.#',
      '############################',
    ],
    guards: [
      { path: [[1, 5], [5, 5], [5, 8], [1, 8]], wait: 0.5 },
      { path: [[21, 5], [26, 5], [26, 6], [21, 6]], wait: 0.5 },
      { path: [[2, 10], [10, 10], [10, 12], [2, 12]], wait: 0.7 },
      { path: [[24, 14], [3, 14]], wait: 1.1 },
    ],
    cameras: [
      { tile: [14, 5], from: 0.6, to: 2.6, speed: 0.5 },
      { tile: [16, 10], from: -2.6, to: -0.5, speed: 0.4 },
    ],
  },
];
