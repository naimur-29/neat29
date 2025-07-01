/**
 * A browser-compatible implementation for saving and restoring simulation state.
 * It uses JSON for serialization and triggers file downloads/uploads.
 */
import { Population } from "./population.js";
import { BaseReporter } from "./reporting.js";
import { DefaultGenome } from "./genome.js";
import { Species } from "./species.js";

/**
 * A helper function to rehydrate plain objects from JSON back into class instances.
 * This is necessary because JSON.stringify strips class information and methods.
 * @param {Object} state - The plain object loaded from a JSON checkpoint.
 * @param {Object} main_config - The main configuration object, needed to create new instances.
 * @returns {[Map<any, Object>, Object, number]} - The rehydrated [population, species_set, generation].
 */
function rehydrate_state(state, main_config) {
  // 1. Rehydrate Population (Map of DefaultGenome instances)
  const rehydrated_population = new Map();
  for (const [_key, plain_genome] of Object.entries(state.population)) {
    const genome = new main_config.genome_type(plain_genome.key);
    // Copy all properties from the plain object to the new instance
    Object.assign(genome, plain_genome);
    rehydrated_population.set(genome.key, genome);
  }

  // 2. Rehydrate Species Set
  const rehydrated_species_set = new main_config.species_set_type(
    main_config.species_set.species_set_config, // Use config from the new main_config
    main_config.species_set.reporters,
  );
  Object.assign(rehydrated_species_set, state.species_set); // Copy properties like indexer

  // 3. Rehydrate individual Species and their members
  const rehydrated_species = new Map();
  for (const [_key, plain_species] of Object.entries(
    state.species_set.species,
  )) {
    const species = new Species(plain_species.key, plain_species.created);
    Object.assign(species, plain_species);

    // Re-link member genomes from the rehydrated population
    const rehydrated_members = new Map();
    for (const member_key of Object.keys(plain_species.members)) {
      rehydrated_members.set(
        Number(member_key),
        rehydrated_population.get(Number(member_key)),
      );
    }
    species.members = rehydrated_members;

    // Re-link the representative
    if (species.representative) {
      species.representative = rehydrated_population.get(
        species.representative.key,
      );
    }

    rehydrated_species.set(species.key, species);
  }
  rehydrated_species_set.species = rehydrated_species;

  // 4. Rehydrate genome_to_species map
  rehydrated_species_set.genome_to_species = new Map(
    Object.entries(state.species_set.genome_to_species).map(([k, v]) => [
      Number(k),
      v,
    ]),
  );

  return [rehydrated_population, rehydrated_species_set, state.generation];
}

export class Checkpointer extends BaseReporter {
  /**
   * Saves the simulation state at regular intervals.
   * @param {number|null} [generation_interval=100] - Generations between saves.
   * @param {number|null} [time_interval_seconds=300] - Seconds between saves.
   * @param {string} [filename_prefix='neat-checkpoint-'] - Prefix for downloaded checkpoint files.
   */
  constructor(
    generation_interval = 100,
    time_interval_seconds = 300,
    filename_prefix = "neat-checkpoint-",
  ) {
    super();
    this.generation_interval = generation_interval;
    this.time_interval_seconds = time_interval_seconds;
    this.filename_prefix = filename_prefix;

    this.current_generation = null;
    this.last_generation_checkpoint = -1;
    this.last_time_checkpoint = performance.now();
  }

  start_generation(generation) {
    this.current_generation = generation;
  }

  end_generation(config, population, species_set) {
    let checkpoint_due = false;

    if (this.time_interval_seconds !== null) {
      const dt = (performance.now() - this.last_time_checkpoint) / 1000.0;
      if (dt >= this.time_interval_seconds) {
        checkpoint_due = true;
      }
    }

    if (!checkpoint_due && this.generation_interval !== null) {
      const dg = this.current_generation - this.last_generation_checkpoint;
      if (dg >= this.generation_interval) {
        checkpoint_due = true;
      }
    }

    if (checkpoint_due) {
      this.save_checkpoint(
        config,
        population,
        species_set,
        this.current_generation,
      );
      this.last_generation_checkpoint = this.current_generation;
      this.last_time_checkpoint = performance.now();
    }
  }

  /**
   * Serializes the current simulation state and triggers a file download.
   */
  save_checkpoint(config, population, species_set, generation) {
    const filename = `${this.filename_prefix}${generation}.json`;
    console.log(`Saving checkpoint to ${filename}`);

    // Create a plain serializable object from the current state.
    // Convert Maps to plain objects for JSON serialization.
    const state = {
      generation: generation,
      config: config.raw_config, // Save the raw config, not the instances
      population: Object.fromEntries(population),
      species_set: {
        indexer: species_set.indexer,
        species: Object.fromEntries(species_set.species),
        genome_to_species: Object.fromEntries(species_set.genome_to_species),
      },
    };

    const json_string = JSON.stringify(state, null, 2);
    const blob = new Blob([json_string], { type: "application/json" });

    // Create a temporary link to trigger the download.
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  /**
   * Restores a simulation from a checkpoint file.
   * @param {File} file - The checkpoint file selected by the user.
   * @returns {Promise<Population>} A promise that resolves to a new Population instance.
   */
  static async restore_checkpoint(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error("No file provided for restore."));
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target.result);

          // --- Rebuild main config from the raw config in the checkpoint ---
          // This logic should match your main setup script.
          const raw_config = state.config;
          const genome_config = DefaultGenome.parseConfig(raw_config);
          // ... create other component configs and instances ...
          const main_config = {
            raw_config: raw_config,
            genome_type: DefaultGenome,
            genome_config: genome_config,
            // ... and the rest of your main_config setup
          };

          const initial_state = rehydrate_state(state, main_config);
          const new_population = new Population(main_config, initial_state);
          resolve(new_population);
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = (_event) => {
        reject(new Error("Error reading file."));
      };
      reader.readAsText(file);
    });
  }
}
