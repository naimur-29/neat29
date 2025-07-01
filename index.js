import { DefaultSpeciesSet } from "./src/species.js";
import { ReporterSet, StdOutReporter } from "./src/reporting.js"; // From previous translation
import { DefaultGenome } from "./src/genome.js"; // From previous translation

export function main() {
  // --- 1. Setup ---
  const reporters = new ReporterSet();
  reporters.add(new StdOutReporter(true));

  // Mock configuration object (as created by your main Config class)
  const mock_main_config = {
    // Genome config needed for distance calculations
    genome_config: {
      compatibility_weight_coefficient: 0.5,
      compatibility_disjoint_coefficient: 1.0,
    },
    // Species set config
    species_set_config: {
      compatibility_threshold: 3.0,
    },
  };

  // --- 2. Create a SpeciesSet instance ---
  // Note: In a real implementation, the main Config class would create this instance.
  const species_set = new DefaultSpeciesSet(
    mock_main_config.species_set_config,
    reporters,
  );

  // --- 3. Create a mock population (a Map of genomes) ---
  const population = new Map();
  // Create a few genomes (in a real scenario, these would be fully configured)
  const genome1 = new DefaultGenome(1);
  genome1.fitness = 10;
  const genome2 = new DefaultGenome(2);
  genome2.fitness = 11;
  const genome3 = new DefaultGenome(3);
  genome3.fitness = 9;

  // To make distance meaningful, let's mock the distance function for this example
  genome1.distance = (other, config) => 1.0; // close to self
  genome2.distance = (other, config) => 5.0; // far from genome1
  genome3.distance = (other, config) => 1.2; // close to genome1

  population.set(1, genome1);
  population.set(2, genome2);
  population.set(3, genome3);

  // --- 4. Run Speciation ---
  let generation = 1;
  // Initially, species are empty. Speciation will create them.
  console.log("--- Running Speciation: Generation 1 ---");
  species_set.speciate(mock_main_config, population, generation);

  // --- 5. Inspect Results ---
  console.log(`\nTotal species created: ${species_set.species.size}`);
  for (const [sid, s] of species_set.species.entries()) {
    const member_keys = Array.from(s.members.keys());
    console.log(
      `- Species ${sid}: Representative=${s.representative.key}, Members=[${member_keys}]`,
    );
  }
  console.log(
    `\nGenome 3 belongs to species: ${species_set.get_species_id(3)}`,
  );
  // Expected output:
  // - Genome 1 and 3 will be in one species (distance < 3.0)
  // - Genome 2 will be in its own new species (distance > 3.0)

  // --- 6. Simulate a new generation ---
  // Let's pretend a new generation has been created.
  // We'll reuse the same genomes but add a representative to the first species
  // to show how existing species are updated.
  const first_species = species_set.get_species(1);
  first_species.representative = genome1; // Set a representative from the "old" generation

  generation = 2;
  console.log("\n--- Running Speciation: Generation 2 ---");
  species_set.speciate(mock_main_config, population, generation);
  console.log(`\nTotal species: ${species_set.species.size}`);
  for (const [sid, s] of species_set.species.entries()) {
    const member_keys = Array.from(s.members.keys());
    console.log(
      `- Species ${sid}: Representative=${s.representative.key}, Members=[${member_keys}]`,
    );
  }
}
