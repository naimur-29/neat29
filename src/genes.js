/**
 * Handles node and connection genes, the fundamental building blocks of genomes.
 */
import {
  FloatAttribute,
  BoolAttribute,
  StringAttribute,
} from "./attributes.js";
import { random } from "./randomUtil.js";

/**
 * A base class for shared gene functionality (crossover, mutation, etc.).
 * This class is intended to be extended and not used directly.
 */
export class BaseGene {
  /**
   * @param {*} key - A unique identifier for the gene.
   */
  constructor(key) {
    this.key = key;
  }

  /**
   * @returns {string} A string representation of the gene and its attributes.
   */
  toString() {
    const attributes = [
      "key",
      ...this.constructor._geneAttributes.map((a) => a.name),
    ];
    const parts = attributes.map(
      (attr) => `${attr}=${JSON.stringify(this[attr])}`,
    );
    return `${this.constructor.name}(${parts.join(", ")})`;
  }

  /**
   * A placeholder for subclasses to parse their specific configurations.
   * @param {Object} config - The main configuration object.
   * @param {Object} paramDict - The dictionary of parameters for this gene type.
   */
  static parseConfig(config, paramDict) {
    // This method is a hook for more complex gene types.
  }

  /**
   * Gathers all configuration parameters from the gene's attributes.
   * @returns {ConfigParameter[]} An array of config parameters.
   */
  static getConfigParams() {
    // Backward compatibility for an older attribute naming convention.
    if (!this._geneAttributes && this.__gene_attributes__) {
      console.warn(
        `Class '${this.name}' should use '_geneAttributes' not '__gene_attributes__' for defining attributes.`,
      );
      this._geneAttributes = this.__gene_attributes__;
    }

    const params = [];
    for (const attr of this._geneAttributes) {
      params.push(...attr.getConfigParams());
    }
    return params;
  }

  /**
   * Validates the configuration for all attributes of this gene.
   * @param {Object} config - The configuration object containing the parsed values.
   */
  static validateAttributes(config) {
    for (const attr of this._geneAttributes) {
      attr.validate(config);
    }
  }

  /**
   * Initializes all attributes of the gene with random values based on the config.
   * @param {Object} config - The configuration object.
   */
  initAttributes(config) {
    for (const attr of this.constructor._geneAttributes) {
      this[attr.name] = attr.initValue(config);
    }
  }

  /**
   * Applies mutation to all attributes of the gene.
   * @param {Object} config - The configuration object.
   */
  mutate(config) {
    for (const attr of this.constructor._geneAttributes) {
      const currentValue = this[attr.name];
      this[attr.name] = attr.mutateValue(currentValue, config);
    }
  }

  /**
   * Creates a deep copy of the gene.
   * @returns {BaseGene} A new gene instance with the same attributes.
   */
  copy() {
    const newGene = new this.constructor(this.key);
    for (const attr of this.constructor._geneAttributes) {
      newGene[attr.name] = this[attr.name];
    }
    return newGene;
  }

  /**
   * Creates a new gene by randomly inheriting attributes from two parent genes.
   * @param {BaseGene} otherGene - The second parent gene.
   * @returns {BaseGene} A new child gene.
   */
  crossover(otherGene) {
    // In JS, keys (especially arrays) need a more robust check than `===`.
    if (JSON.stringify(this.key) !== JSON.stringify(otherGene.key)) {
      throw new Error(
        `Cannot crossover genes with different keys: ${this.key} and ${otherGene.key}`,
      );
    }

    const newGene = new this.constructor(this.key);
    for (const attr of this.constructor._geneAttributes) {
      // Randomly select an attribute from one of the two parents.
      const sourceGene = random() > 0.5 ? this : otherGene;
      newGene[attr.name] = sourceGene[attr.name];
    }

    return newGene;
  }
}

/**
 * Represents a node gene in the genome.
 */
export class DefaultNodeGene extends BaseGene {
  static _geneAttributes = [
    new FloatAttribute("bias"),
    new FloatAttribute("response"),
    new StringAttribute("activation", { options: [] }), // Options are loaded from config
    new StringAttribute("aggregation", { options: [] }), // Options are loaded from config
  ];

  /**
   * @param {number} key - The node's unique integer ID.
   */
  constructor(key) {
    if (typeof key !== "number") {
      throw new Error(`DefaultNodeGene key must be a number, not ${key}`);
    }
    super(key);
  }

  /**
   * Calculates the compatibility distance between this node gene and another.
   * @param {DefaultNodeGene} other - The other node gene to compare against.
   * @param {Object} config - The configuration object, containing compatibility coefficients.
   * @returns {number} The calculated distance.
   */
  distance(other, config) {
    let d =
      Math.abs(this.bias - other.bias) +
      Math.abs(this.response - other.response);
    if (this.activation !== other.activation) {
      d += 1.0;
    }
    if (this.aggregation !== other.aggregation) {
      d += 1.0;
    }
    return d * config.compatibility_weight_coefficient;
  }
}

/**
 * Represents a connection gene in the genome.
 */
export class DefaultConnectionGene extends BaseGene {
  static _geneAttributes = [
    new FloatAttribute("weight"),
    new BoolAttribute("enabled"),
  ];

  /**
   * @param {[number, number]} key - A tuple (array in JS) of [inNodeId, outNodeId].
   */
  constructor(key) {
    if (!Array.isArray(key) || key.length !== 2) {
      throw new Error(
        `DefaultConnectionGene key must be a [in, out] tuple (array), not ${key}`,
      );
    }
    super(key);
  }

  /**
   * Calculates the compatibility distance between this connection gene and another.
   * @param {DefaultConnectionGene} other - The other connection gene to compare against.
   * @param {Object} config - The configuration object, containing compatibility coefficients.
   * @returns {number} The calculated distance.
   */
  distance(other, config) {
    let d = Math.abs(this.weight - other.weight);
    if (this.enabled !== other.enabled) {
      d += 1.0;
    }
    return d * config.compatibility_weight_coefficient;
  }
}
