// Seeded random numbers (mulberry32). One seed replays the same farm, which is
// what makes the screenshot scenes repeatable and the game fair to re-run.
export function createRandom(seed) {
  let a = seed | 0;
  return function random() {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Pick one entry from a weighted table of [weight, value] pairs.
export function weightedPick(random, table) {
  let total = 0;
  for (const [weight] of table) total += weight;
  let roll = random() * total;
  for (const [weight, value] of table) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return table[table.length - 1][1];
}
