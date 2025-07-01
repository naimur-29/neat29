import { DefaultStagnation } from "./src/stagnation.js";
import { Species } from "./src/species.js"; // From previous translation
import { ReporterSet, StdOutReporter } from "./src/reporting.js"; // From previous translation

export function main() {
  // --- 1. Setup ---
  const reporters = new ReporterSet();
  reporters.add(new StdOutReporter(true));

  // Mock stagnation configuration object
  const stagnation_config = {
    species_fitness_func: "max", // Use max fitness of members to represent species fitness
    max_stagnation: 3, // A species is stagnant after 3 generations of no improvement
    species_elitism: 1, // Always keep at least the single best species
  };

  // --- 2. Create a Stagnation instance ---
  // In a real implementation, the main Config class would create this.
  const stagnation = new DefaultStagnation(stagnation_config, reporters);

  // --- 3. Create a mock set of species (Map) ---
  const species_set = new Map();

  // Species 1: Stagnant
  const s1 = new Species(1, 0); // created at gen 0
  s1.last_improved = 0; // last improved at gen 0
  s1.fitness_history = [10, 10, 10, 10]; // has not improved
  s1.members.set(1, { fitness: 10 });
  s1.members.set(2, { fitness: 9 });
  species_set.set(1, s1);

  // Species 2: Improving
  const s2 = new Species(2, 2); // created at gen 2
  s2.last_improved = 4; // last improved now (gen 4)
  s2.fitness_history = [15, 16, 18, 20]; // is improving
  s2.members.set(3, { fitness: 20 });
  s2.members.set(4, { fitness: 19 });
  species_set.set(2, s2);

  // Species 3: Weak but not yet stagnant
  const s3 = new Species(3, 3); // created at gen 3
  s3.last_improved = 3; // last improved at gen 3
  s3.fitness_history = [5, 5]; // only 1 gen of no improvement
  s3.members.set(5, { fitness: 5 });
  species_set.set(3, s3);

  // --- 4. Run the update method ---
  let current_generation = 4;
  console.log(
    `--- Updating stagnation info at generation ${current_generation} ---`,
  );
  // The `update` method modifies the species in-place (updates their fitness)
  // and returns a list indicating which are stagnant.
  const stagnation_results = stagnation.update(species_set, current_generation);

  // --- 5. Inspect Results ---
  console.log("\nStagnation Results: [speciesId, speciesInstance, isStagnant]");
  for (const [sid, s, is_stagnant] of stagnation_results) {
    console.log(
      `- Species ${sid}: Fitness=${s.fitness.toFixed(2)}, Last Improved=${s.last_improved}, Stagnant=${is_stagnant}`,
    );
  }

  // Expected Output:
  // - Species 3: Fitness=5.00, Last Improved=3, Stagnant=false (worst fitness but not stagnant long enough)
  // - Species 1: Fitness=10.00, Last Improved=0, Stagnant=true (stagnant for 4 gens > max_stagnation of 3)
  // - Species 2: Fitness=20.00, Last Improved=4, Stagnant=false (best fitness and protected by elitism)

  // --- 6. In the main loop, you would then remove the stagnant species ---
  for (const [sid, s, is_stagnant] of stagnation_results) {
    if (is_stagnant) {
      console.log(`\nRemoving stagnant species ${sid}...`);
      species_set.delete(sid);
    }
  }

  console.log(`\nRemaining species count: ${species_set.size}`); // Should be 2
}
