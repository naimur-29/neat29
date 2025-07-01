/**
 * Handles creation of genomes, either from scratch or by sexual or
 * asexual reproduction from parents.
 */
import { DefaultClassConfig, ConfigParameter } from "./config.js";
import { mean } from "./mathUtil.js";
import { choice } from "./randomUtil.js"; // Assuming you have `choice` in random.js

/**
 * Implements the default NEAT reproduction scheme:
 * explicit fitness sharing with fixed-time species stagnation.
 */
export class DefaultReproduction {
  /**
   * @param {Object} config - The reproduction configuration object.
   * @param {Object} reporters - The reporter set instance.
   * @param {Object} stagnation - The stagnation handler instance.
   */
  constructor(config, reporters, stagnation) {
    this.reproduction_config = config;
    this.reporters = reporters;
    this.stagnation = stagnation;
    this.genome_indexer = 1;
    this.ancestors = new Map();
  }

  /**
   * Defines the configuration parameters for this class.
   * @returns {ConfigParameter[]}
   */
  static get_config_params() {
    return [
      new ConfigParameter("elitism", "number", 0),
      new ConfigParameter("survival_threshold", "number", 0.2),
      new ConfigParameter("min_species_size", "number", 1),
    ];
  }

  /**
   * Hook for the main Config class.
   * @param {Object} param_dict - The raw parameter object from the main config.
   * @returns {Object} An instance of DefaultClassConfig with reproduction parameters.
   */
  static parse_config(param_dict) {
    return new DefaultClassConfig(param_dict, this.get_config_params());
  }

  /**
   * Creates a new population of genomes from scratch.
   * @param {class} genome_type - The constructor for the genome.
   * @param {Object} genome_config - The configuration for the genome.
   * @param {number} num_genomes - The number of genomes to create.
   * @returns {Map<any, Object>} A map of new genome instances.
   */
  create_new(genome_type, genome_config, num_genomes) {
    const new_genomes = new Map();
    for (let i = 0; i < num_genomes; i++) {
      const key = this.genome_indexer++;
      const g = new genome_type(key);
      g.configure_new(genome_config);
      new_genomes.set(key, g);
      this.ancestors.set(key, []);
    }
    return new_genomes;
  }

  /**
   * Computes the proper number of offspring per species (proportional to fitness).
   * @param {number[]} adjusted_fitnesses - An array of adjusted fitness values for each species.
   * @param {number[]} previous_sizes - An array of the previous size of each species.
   * @param {number} pop_size - The target population size.
   * @param {number} min_species_size - The minimum size for any species.
   * @returns {number[]} An array of spawn counts for each species.
   */
  static compute_spawn(
    adjusted_fitnesses,
    previous_sizes,
    pop_size,
    min_species_size,
  ) {
    const af_sum = adjusted_fitnesses.reduce((a, b) => a + b, 0);

    let spawn_amounts = [];
    for (let i = 0; i < adjusted_fitnesses.length; i++) {
      const af = adjusted_fitnesses[i];
      const ps = previous_sizes[i];

      let s;
      if (af_sum > 0) {
        s = Math.max(min_species_size, (af / af_sum) * pop_size);
      } else {
        s = min_species_size;
      }

      const d = (s - ps) * 0.5;
      const c = Math.round(d);
      let spawn = ps;
      if (Math.abs(c) > 0) {
        spawn += c;
      } else if (d > 0) {
        spawn += 1;
      } else if (d < 0) {
        spawn -= 1;
      }
      spawn_amounts.push(spawn);
    }

    // Normalize spawn amounts to match the target population size.
    const total_spawn = spawn_amounts.reduce((a, b) => a + b, 0);
    if (total_spawn === 0) return spawn_amounts.map(() => min_species_size);

    const norm = pop_size / total_spawn;
    spawn_amounts = spawn_amounts.map((n) =>
      Math.max(min_species_size, Math.round(n * norm)),
    );

    return spawn_amounts;
  }

  /**
   * Creates the next generation of genomes by reproduction.
   * @param {Object} config - The main NEAT configuration object.
   * @param {Object} species - The species set instance.
   * @param {number} pop_size - The target population size.
   * @param {number} generation - The current generation number.
   * @returns {Map<any, Object>} A map of the new generation of genomes.
   */
  reproduce(config, species, pop_size, generation) {
    // --- 1. Filter out stagnant species and update fitness ---
    const all_fitnesses = [];
    const remaining_species = [];

    // The `update` method from stagnation now returns an array of [sid, species, is_stagnant]
    const stagnation_update = this.stagnation.update(
      species.species,
      generation,
    );

    for (const [sid, s, is_stagnant] of stagnation_update) {
      if (is_stagnant) {
        this.reporters.species_stagnant(sid, s);
      } else {
        const member_fitnesses = Array.from(s.members.values()).map(
          (m) => m.fitness,
        );
        all_fitnesses.push(...member_fitnesses);
        remaining_species.push(s);
      }
    }

    // If all species are extinct, return an empty population.
    if (remaining_species.length === 0) {
      species.species.clear();
      return new Map();
    }

    // --- 2. Compute adjusted fitness for remaining species ---
    // --- Fix: Calculate fitness stats from the *remaining* species only ---
    for (const s of remaining_species) {
      all_fitnesses.push(...s.get_fitnesses());
    }

    const min_fitness = Math.min(...all_fitnesses);
    const max_fitness = Math.max(...all_fitnesses);
    const fitness_range = Math.max(1.0, max_fitness - min_fitness);

    for (const s of remaining_species) {
      const mean_fitness = mean(s.get_fitnesses());
      s.adjusted_fitness = (mean_fitness - min_fitness) / fitness_range;
    }

    const adjusted_fitnesses = remaining_species.map((s) => s.adjusted_fitness);
    this.reporters.info(
      `Average adjusted fitness: ${mean(adjusted_fitnesses).toFixed(3)}`,
    );

    // --- 3. Compute offspring count for each species ---
    const previous_sizes = remaining_species.map((s) => s.members.size);
    const min_species_size = Math.max(
      this.reproduction_config.min_species_size,
      this.reproduction_config.elitism,
    );
    const spawn_amounts = DefaultReproduction.compute_spawn(
      adjusted_fitnesses,
      previous_sizes,
      pop_size,
      min_species_size,
    );

    const new_population = new Map();
    const new_species_set = new Map();

    // --- 4. Create the new generation ---
    for (let i = 0; i < remaining_species.length; i++) {
      const s = remaining_species[i];

      let spawn = Math.max(spawn_amounts[i], this.reproduction_config.elitism);
      if (spawn <= 0) continue;

      // Sort members by fitness in descending order.
      const old_members = Array.from(s.members.entries()).sort(
        (a, b) => b[1].fitness - a[1].fitness,
      );

      // Retain the species for the next generation.
      s.members.clear();
      new_species_set.set(s.key, s);

      // Transfer elites directly to the new population.
      if (this.reproduction_config.elitism > 0) {
        for (const [gid, elite_genome] of old_members.slice(
          0,
          this.reproduction_config.elitism,
        )) {
          if (new_population.size < pop_size) {
            new_population.set(gid, elite_genome);
            spawn--;
          }
        }
      }

      if (spawn <= 0) continue;

      // Select parents for reproduction from the best performers.
      const repro_cutoff = Math.max(
        2,
        Math.ceil(
          this.reproduction_config.survival_threshold * old_members.length,
        ),
      );
      const potential_parents = old_members.slice(0, repro_cutoff);

      // Produce offspring.
      while (spawn-- > 0) {
        if (new_population.size >= pop_size) break;

        const [p1_id, parent1] = choice(potential_parents);
        const [p2_id, parent2] = choice(potential_parents);

        const gid = this.genome_indexer++;
        const child = new config.genome_type(gid);
        child.configure_crossover(parent1, parent2, config.genome_config);
        child.mutate(config.genome_config);

        new_population.set(gid, child);
        this.ancestors.set(gid, [p1_id, p2_id]);
      }
    }

    // Update the main species set.
    species.species = new_species_set;
    return new_population;
  }
}
