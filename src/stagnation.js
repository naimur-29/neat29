/**
 * Keeps track of whether species are making progress and helps remove those which are not.
 */
import { DefaultClassConfig, ConfigParameter } from "./config.js";
import { statFunctions } from "./mathUtil.js";

/**
 * Implements the default stagnation scheme.
 */
export class DefaultStagnation extends DefaultClassConfig {
  /**
   * @param {Object} config - The stagnation configuration object.
   * @param {Object} reporters - The reporter set instance.
   */
  constructor(config, reporters) {
    super(config, DefaultStagnation.get_config_params());
    this.reporters = reporters;

    this.species_fitness_func = statFunctions[this.species_fitness_func];
    if (!this.species_fitness_func) {
      throw new Error(
        `Unexpected species fitness function: ${this.species_fitness_func}`,
      );
    }
  }

  /**
   * Defines the configuration parameters for this class.
   * @returns {ConfigParameter[]}
   */
  static get_config_params() {
    return [
      new ConfigParameter("species_fitness_func", "string", "mean"),
      new ConfigParameter("max_stagnation", "number", 15),
      new ConfigParameter("species_elitism", "number", 0),
    ];
  }

  /**
   * Hook for the main Config class to create an instance.
   * @param {Object} param_dict - The raw parameter object from the main config.
   * @returns {Object} An instance of DefaultClassConfig with the stagnation parameters.
   */
  static parse_config(param_dict) {
    // In a real implementation, this would likely be instantiated by the main
    // evolutionary algorithm, which would pass in the reporters.
    // For now, we return a simple config object.
    return new DefaultClassConfig(param_dict, this.get_config_params());
  }

  /**
   * Updates species fitness history, checks for stagnation, and returns a list
   * of species marked for removal, respecting species elitism.
   * @param {Map<any, Species>} species_set - A map of species instances.
   * @param {number} generation - The current generation number.
   * @returns {Array<[any, Species, boolean]>} An array of tuples: [speciesId, speciesInstance, isStagnant].
   */
  update(species_set, generation) {
    const species_data = [];
    for (const [sid, s] of species_set.entries()) {
      const fitnesses = s.get_fitnesses();
      if (fitnesses.length === 0) {
        // If a species has no members, its fitness is considered null.
        s.fitness = null;
      } else {
        // Determine the previous best fitness for the species.
        let prev_fitness = -Infinity;
        if (s.fitness_history.length > 0) {
          prev_fitness = Math.max(...s.fitness_history);
        }

        s.fitness = this.species_fitness_func(fitnesses);
        s.fitness_history.push(s.fitness);
        s.adjusted_fitness = null;

        if (s.fitness > prev_fitness) {
          s.last_improved = generation;
        }
      }

      species_data.push([sid, s]);
    }

    // Sort species by fitness in ascending order (worst to best).
    // Species with null fitness are considered the worst.
    species_data.sort((a, b) => {
      const fitness_a = a[1].fitness ?? -Infinity;
      const fitness_b = b[1].fitness ?? -Infinity;
      return fitness_a - fitness_b;
    });

    const result = [];
    let num_non_stagnant = species_data.length;

    for (const [idx, [sid, s]] of species_data.entries()) {
      // A species is stagnant if it hasn't improved for `max_stagnation` generations.
      const stagnant_time = generation - s.last_improved;
      let is_stagnant = stagnant_time >= this.max_stagnation;

      // --- Elitism Check ---
      // The `species_elitism` number of best-performing species are never marked as stagnant.
      // Since the list is sorted from worst to best, we check if the current species is
      // within the top `species_elitism` group.
      const num_remaining = species_data.length - idx;
      if (num_remaining <= this.species_elitism) {
        is_stagnant = false;
      }

      // An alternative check to ensure we don't go below the elitism number.
      if (num_non_stagnant <= this.species_elitism) {
        is_stagnant = false;
      }

      if (is_stagnant) {
        num_non_stagnant--;
      }

      result.push([sid, s, is_stagnant]);
    }

    return result;
  }
}
