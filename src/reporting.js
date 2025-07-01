/**
 * Implementation of reporter classes, which are triggered on particular events.
 * Reporters are generally intended to provide information to the user, store checkpoints, etc.
 */

import { mean, stdev } from "./mathUtil.js";

/**
 * Keeps track of the set of reporters and dispatches events to them.
 */
export class ReporterSet {
  constructor() {
    this.reporters = [];
  }

  add(reporter) {
    this.reporters.push(reporter);
  }

  remove(reporter) {
    const index = this.reporters.indexOf(reporter);
    if (index > -1) {
      this.reporters.splice(index, 1);
    }
  }

  // --- Event Dispatch Methods ---

  start_generation(gen) {
    for (const r of this.reporters) r.start_generation(gen);
  }

  end_generation(config, population, species_set) {
    for (const r of this.reporters)
      r.end_generation(config, population, species_set);
  }

  post_evaluate(config, population, species, best_genome) {
    for (const r of this.reporters)
      r.post_evaluate(config, population, species, best_genome);
  }

  post_reproduction(config, population, species) {
    for (const r of this.reporters)
      r.post_reproduction(config, population, species);
  }

  complete_extinction() {
    for (const r of this.reporters) r.complete_extinction();
  }

  found_solution(config, generation, best) {
    for (const r of this.reporters) r.found_solution(config, generation, best);
  }

  species_stagnant(sid, species) {
    for (const r of this.reporters) r.species_stagnant(sid, species);
  }

  info(msg) {
    for (const r of this.reporters) r.info(msg);
  }
}

/**
 * Defines the interface for reporter classes. Other reporters should extend this class.
 */
export class BaseReporter {
  start_generation(generation) {}
  end_generation(config, population, species_set) {}
  post_evaluate(config, population, species, best_genome) {}
  post_reproduction(config, population, species) {}
  complete_extinction() {}
  found_solution(config, generation, best) {}
  species_stagnant(sid, species) {}
  info(msg) {}
}

/**
 * A reporter that logs information to the browser's console.
 * This is an example of a concrete reporter implementation.
 */
export class StdOutReporter extends BaseReporter {
  /**
   * @param {boolean} show_species_detail - If true, detailed species information is logged.
   */
  constructor(show_species_detail) {
    super();
    this.show_species_detail = show_species_detail;
    this.generation = null;
    this.generation_start_time = null;
    this.generation_times = [];
    this.num_extinctions = 0;
  }

  start_generation(generation) {
    this.generation = generation;
    console.log(`\n ****** Running generation ${generation} ****** \n`);
    this.generation_start_time = performance.now(); // Browser-safe high-resolution timer
  }

  end_generation(config, population, species_set) {
    const ng = Object.keys(population).length;
    const ns = Object.keys(species_set.species).length;

    if (this.show_species_detail) {
      console.log(`Population of ${ng} members in ${ns} species:`);

      // Create data array for console.table for nice formatting
      const tableData = [];
      const sortedSpeciesIds = Object.keys(species_set.species)
        .map(Number)
        .sort((a, b) => a - b);

      for (const sid of sortedSpeciesIds) {
        const s = species_set.species[sid];
        tableData.push({
          ID: sid,
          age: this.generation - s.created,
          size: s.members.size, // Assuming members is a Set
          fitness: s.fitness !== null ? s.fitness.toFixed(3) : "--",
          "adj fit":
            s.adjusted_fitness !== null ? s.adjusted_fitness.toFixed(3) : "--",
          stag: this.generation - s.last_improved,
        });
      }
      console.table(tableData);
    } else {
      console.log(`Population of ${ng} members in ${ns} species`);
    }

    const elapsed_ms = performance.now() - this.generation_start_time;
    const elapsed_s = elapsed_ms / 1000.0;
    this.generation_times.push(elapsed_s);
    if (this.generation_times.length > 10) {
      this.generation_times.shift(); // Keep only the last 10 times
    }

    const average_time = mean(this.generation_times);
    console.log(`Total extinctions: ${this.num_extinctions}`);

    if (this.generation_times.length > 1) {
      console.log(
        `Generation time: ${elapsed_s.toFixed(3)} sec (${average_time.toFixed(3)} average)`,
      );
    } else {
      console.log(`Generation time: ${elapsed_s.toFixed(3)} sec`);
    }
  }

  post_evaluate(config, population, species, best_genome) {
    const fitnesses = Array.from(population.values()).map((g) => g.fitness);

    const fit_mean = mean(fitnesses);
    const fit_std = stdev(fitnesses);

    // Assuming species object has a method to get species ID from a genome key
    const best_species_id = species.get_species_id(best_genome.key);

    console.log(
      `Population's average fitness: ${fit_mean.toFixed(5)} stdev: ${fit_std.toFixed(5)}`,
    );
    console.log(
      `Best fitness: ${best_genome.fitness.toFixed(5)} - size: [${best_genome.size()}] - species ${best_species_id} - id ${best_genome.key}`,
    );
  }

  complete_extinction() {
    this.num_extinctions += 1;
    console.log("All species extinct.");
  }

  found_solution(config, generation, best) {
    console.log(
      `\nBest individual in generation ${this.generation} meets fitness threshold - complexity: [${best.size()}]`,
    );
  }

  species_stagnant(sid, species) {
    if (this.show_species_detail) {
      console.log(
        `\nSpecies ${sid} with ${species.members.size} members is stagnated: removing it`,
      );
    }
  }

  info(msg) {
    console.log(msg);
  }
}
