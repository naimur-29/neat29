/**
 * Divides the population into species based on genomic distances.
 * This is a core component of the NEAT algorithm.
 */
import { ConfigParameter } from "./config.js";
import { mean, stdev } from "./mathUtil.js";

/**
 * Represents a single species in the population.
 */
export class Species {
  /**
   * @param {*} key - A unique identifier for the species.
   * @param {number} generation - The generation in which the species was created.
   */
  constructor(key, generation) {
    this.key = key;
    this.created = generation;
    this.last_improved = generation;
    this.representative = null;
    this.members = new Map(); // Use Map for better performance with non-string keys
    this.fitness = null;
    this.adjusted_fitness = null;
    this.fitness_history = [];
  }

  /**
   * Updates the species' representative and member list.
   * @param {Object} representative - The genome instance that represents the species.
   * @param {Map<any, Object>} members - A map of genome IDs to genome instances.
   */
  update(representative, members) {
    this.representative = representative;
    this.members = members;
  }

  /**
   * @returns {number[]} An array of fitness values for all members of the species.
   */
  get_fitnesses() {
    return Array.from(this.members.values()).map((m) => m.fitness);
  }
}

/**
 * Caches genomic distances to avoid re-computation.
 * This is a performance optimization for the speciation process.
 */
class GenomeDistanceCache {
  /**
   * @param {Object} config - The genome configuration object.
   */
  constructor(config) {
    this.distances = new Map();
    this.config = config;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Computes or retrieves the distance between two genomes.
   * @param {Object} genome1
   * @param {Object} genome2
   * @returns {number} The genomic distance.
   */
  distance(genome1, genome2) {
    const key1 = genome1.key;
    const key2 = genome2.key;

    // Ensure canonical key order to improve cache hits.
    const key = key1 < key2 ? `${key1}:${key2}` : `${key2}:${key1}`;

    if (this.distances.has(key)) {
      this.hits++;
      return this.distances.get(key);
    }

    // Distance is not already computed.
    this.misses++;
    const d = genome1.distance(genome2, this.config);
    this.distances.set(key, d);
    return d;
  }
}

/**
 * Encapsulates the default speciation scheme.
 */
export class DefaultSpeciesSet {
  /**
   * @param {Object} config - The species set configuration object.
   * @param {Object} reporters - The reporter set instance.
   */
  constructor(config, reporters) {
    this.species_set_config = config;
    this.reporters = reporters;
    this.indexer = 1; // Start species IDs from 1
    this.species = new Map();
    this.genome_to_species = new Map();
  }

  /**
   * Defines the configuration parameters for this class.
   * @returns {ConfigParameter[]}
   */
  static get_config_params() {
    return [new ConfigParameter("compatibility_threshold", "number")];
  }

  /**
   * This method is a hook for the main Config class to create an instance.
   * In a full implementation, you might pass `reporters` in a different way.
   * For now, we assume it's passed to the constructor.
   */
  static parse_config(param_dict) {
    // This class is special; it doesn't return a simple config object,
    // but an instance of itself. The main loop must handle this.
    // return param_dict;
    return new DefaultSpeciesSet(param_dict, { info: () => {} }); // Pass a dummy reporter
  }

  /**
   * Places genomes into species by genetic similarity.
   * @param {Object} config - The main NEAT configuration object.
   * @param {Map<any, Object>} population - A map of genome IDs to genome instances.
   * @param {number} generation - The current generation number.
   */
  speciate(config, population, generation) {
    if (population.size === 0) {
      return;
    }

    const compatibility_threshold =
      this.species_set_config.compatibility_threshold;
    const distances = new GenomeDistanceCache(config.genome_config);
    const unspeciated = new Set(population.keys());
    const new_representatives = new Map();
    const new_members = new Map();

    // 1. Find new representatives for existing species
    for (const [sid, s] of this.species.entries()) {
      const candidates = [];
      for (const gid of unspeciated) {
        const g = population.get(gid);
        const d = distances.distance(s.representative, g);
        candidates.push([d, g]);
      }

      if (candidates.length > 0) {
        // Find the genome in the new population closest to the old representative.
        const [_, new_rep] = candidates.reduce(
          (min, curr) => (curr[0] < min[0] ? curr : min),
          candidates[0],
        );
        const new_rid = new_rep.key;

        new_representatives.set(sid, new_rep);
        new_members.set(sid, [new_rid]);
        unspeciated.delete(new_rid);
      }
    }

    // 2. Partition the remaining genomes into species
    while (unspeciated.size > 0) {
      const gid = unspeciated.values().next().value; // Get an element from the set
      unspeciated.delete(gid);
      const g = population.get(gid);

      let found_species = false;
      if (new_representatives.size > 0) {
        const candidates = [];
        for (const [sid, rep] of new_representatives.entries()) {
          const d = distances.distance(rep, g);
          if (d < compatibility_threshold) {
            candidates.push([d, sid]);
          }
        }

        if (candidates.length > 0) {
          const [_, sid] = candidates.reduce(
            (min, curr) => (curr[0] < min[0] ? curr : min),
            candidates[0],
          );
          new_members.get(sid).push(gid);
          found_species = true;
        }
      }

      // If no species is similar enough, create a new one.
      if (!found_species) {
        const new_sid = this.indexer++;
        new_representatives.set(new_sid, g);
        new_members.set(new_sid, [gid]);
      }
    }

    // 3. Update species and remove empty ones.
    this.genome_to_species.clear();
    const species_to_delete = new Set(this.species.keys());

    for (const [sid, rep] of new_representatives.entries()) {
      species_to_delete.delete(sid);

      const member_ids = new_members.get(sid);
      const member_map = new Map();
      for (const gid of member_ids) {
        this.genome_to_species.set(gid, sid);
        member_map.set(gid, population.get(gid));
      }

      let s = this.species.get(sid);
      if (!s) {
        s = new Species(sid, generation);
        this.species.set(sid, s);
      }
      s.update(rep, member_map);
    }

    for (const sid of species_to_delete) {
      this.species.delete(sid);
    }

    // Log genetic distance info.
    if (distances.distances.size > 0) {
      const gd_values = Array.from(distances.distances.values());
      this.reporters.info(
        `Mean genetic distance ${mean(gd_values).toFixed(3)}, standard deviation ${stdev(gd_values).toFixed(3)}`,
      );
    }
  }

  /**
   * @param {*} individual_id - The key of the genome.
   * @returns {*} The ID of the species this genome belongs to.
   */
  get_species_id(individual_id) {
    return this.genome_to_species.get(individual_id);
  }

  /**
   * @param {*} individual_id - The key of the genome.
   * @returns {Species} The species instance this genome belongs to.
   */
  get_species(individual_id) {
    const sid = this.genome_to_species.get(individual_id);
    return this.species.get(sid);
  }
}
