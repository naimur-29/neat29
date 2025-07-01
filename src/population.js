/**
 * Implements the core evolution algorithm.
 */
import { mean } from "./mathUtil.js";
import { ReporterSet } from "./reporting.js";

/**
 * Custom error for when all species go extinct and the configuration
 * does not specify resetting the population.
 */
export class CompleteExtinctionException extends Error {
  constructor(message = "All species went extinct.") {
    super(message);
    this.name = "CompleteExtinctionException";
  }
}

/**
 * This class implements the core evolution algorithm:
 * 1. Evaluate fitness of all genomes.
 * 2. Check for a solution.
 * 3. Generate the next generation.
 * 4. Partition the new generation into species.
 * 5. Repeat.
 */
export class Population {
  /**
   * @param {Object} config - The main configuration object, holding references to all component configs.
   * @param {[Map<any, Object>, Object, number]} [initial_state=null] - Optional initial state [population, species, generation].
   */
  constructor(config, initial_state = null) {
    this.reporters = new ReporterSet();
    this.config = config;

    // The main config should have instances of the components, not just their configs.
    this.reproduction = config.reproduction;
    this.species = config.species_set;
    this.stagnation = config.stagnation;

    // Set the fitness criterion function based on the config string.
    switch (config.fitness_criterion) {
      case "max":
        this.fitness_criterion = (fitnesses) => Math.max(...fitnesses);
        break;
      case "min":
        this.fitness_criterion = (fitnesses) => Math.min(...fitnesses);
        break;
      case "mean":
        this.fitness_criterion = mean;
        break;
      default:
        if (!config.no_fitness_termination) {
          throw new Error(
            `Unexpected fitness_criterion: ${config.fitness_criterion}`,
          );
        }
        this.fitness_criterion = null;
    }

    if (initial_state === null) {
      // Create a population from scratch.
      this.population = this.reproduction.create_new(
        config.genome_type,
        config.genome_config,
        config.pop_size,
      );
      this.generation = 0;
      // Initial speciation.
      this.species.speciate(config, this.population, this.generation);
    } else {
      [this.population, this.species, this.generation] = initial_state;
    }

    this.best_genome = null;
  }

  /**
   * Adds a reporter to the reporter set.
   * @param {Object} reporter - An object that conforms to the BaseReporter interface.
   */
  add_reporter(reporter) {
    this.reporters.add(reporter);
  }

  /**
   * Removes a reporter from the reporter set.
   * @param {Object} reporter - The reporter instance to remove.
   */
  remove_reporter(reporter) {
    this.reporters.remove(reporter);
  }

  /**
   * Runs the NEAT algorithm for at most n generations.
   *
   * The user-provided `fitness_function` must be an `async` function that takes two arguments:
   *   1. The population as a Map of {genomeId: genome}.
   *   2. The current configuration object.
   *
   * It must assign a `fitness` property to each genome in the population map.
   *
   * @param {function(Map<any, Object>, Object): Promise<void>} fitness_function - The async fitness evaluation function.
   * @param {number|null} [n=null] - The number of generations to run. If null, runs until a solution is found or extinction occurs.
   * @returns {Promise<Object>} The best genome found during the run.
   */
  run(fitness_function, n = null) {
    if (this.config.no_fitness_termination && n === null) {
      throw new Error(
        "Cannot have no generation limit with no fitness termination.",
      );
    }

    let k = 0;
    while (n === null || k < n) {
      k++;
      this.reporters.start_generation(this.generation);

      // Evaluate all genomes using the user-provided async function.
      fitness_function(this.population, this.config);

      // Gather and report statistics.
      let best = null;
      for (const g of this.population.values()) {
        if (g.fitness === null || g.fitness === undefined) {
          throw new Error(`Fitness not assigned to genome ${g.key}`);
        }
        if (best === null || g.fitness > best.fitness) {
          best = g;
        }
      }
      this.reporters.post_evaluate(
        this.config,
        this.population,
        this.species,
        best,
      );

      // Track the best genome ever seen.
      if (
        this.best_genome === null ||
        best.fitness > this.best_genome.fitness
      ) {
        this.best_genome = best;
      }

      // Check for a solution.
      if (!this.config.no_fitness_termination) {
        const fitnesses = Array.from(this.population.values()).map(
          (g) => g.fitness,
        );
        const fv = this.fitness_criterion(fitnesses);
        if (fv >= this.config.fitness_threshold) {
          this.reporters.found_solution(this.config, this.generation, best);
          break;
        }
      }

      // Create the next generation.
      this.population = this.reproduction.reproduce(
        this.config,
        this.species,
        this.config.pop_size,
        this.generation,
      );

      // Check for complete extinction.
      if (this.species.species.size === 0) {
        this.reporters.complete_extinction();
        if (this.config.reset_on_extinction) {
          this.population = this.reproduction.create_new(
            this.config.genome_type,
            this.config.genome_config,
            this.config.pop_size,
          );
        } else {
          throw new CompleteExtinctionException();
        }
      }

      // Speciate the new population.
      this.species.speciate(this.config, this.population, this.generation);

      this.reporters.end_generation(this.config, this.population, this.species);

      this.generation++;
    }

    if (this.config.no_fitness_termination) {
      this.reporters.found_solution(
        this.config,
        this.generation,
        this.best_genome,
      );
    }

    return this.best_genome;
  }
}
