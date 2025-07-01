/**
 * Handles node and connection genes.
 * This version consistently uses snake_case for all configuration properties.
 */
import {
  FloatAttribute,
  BoolAttribute,
  StringAttribute,
} from "./attributes.js";
import { random } from "./randomUtil.js";

export class BaseGene {
  constructor(key) {
    this.key = key;
  }

  toString() {
    const attributes = [
      "key",
      ...this.constructor._gene_attributes.map((a) => a.name),
    ];
    const parts = attributes.map(
      (attr) => `${attr}=${JSON.stringify(this[attr])}`,
    );
    return `${this.constructor.name}(${parts.join(", ")})`;
  }

  static getConfigParams() {
    if (!this._gene_attributes && this.__gene_attributes__) {
      console.warn(
        `Class '${this.name}' should use '_gene_attributes' not '__gene_attributes__'`,
      );
      this._gene_attributes = this.__gene_attributes__;
    }
    return this._gene_attributes.flatMap((attr) => attr.getConfigParams());
  }

  static validateAttributes(config) {
    for (const attr of this._gene_attributes) {
      attr.validate(config);
    }
  }

  initAttributes(config) {
    for (const attr of this.constructor._gene_attributes) {
      this[attr.name] = attr.initValue(config);
    }
  }

  mutate(config) {
    for (const attr of this.constructor._gene_attributes) {
      const currentValue = this[attr.name];
      this[attr.name] = attr.mutateValue(currentValue, config);
    }
  }

  copy() {
    const newGene = new this.constructor(this.key);
    for (const attr of this.constructor._gene_attributes) {
      newGene[attr.name] = this[attr.name];
    }
    return newGene;
  }

  crossover(otherGene) {
    if (JSON.stringify(this.key) !== JSON.stringify(otherGene.key)) {
      throw new Error(
        `Cannot crossover genes with different keys: ${this.key} and ${otherGene.key}`,
      );
    }
    const newGene = new this.constructor(this.key);
    for (const attr of this.constructor._gene_attributes) {
      const sourceGene = random() > 0.5 ? this : otherGene;
      newGene[attr.name] = sourceGene[attr.name];
    }
    return newGene;
  }
}

export class DefaultNodeGene extends BaseGene {
  static _gene_attributes = [
    new FloatAttribute("bias"),
    new FloatAttribute("response"),
    new StringAttribute("activation", { options: [] }),
    new StringAttribute("aggregation", { options: [] }),
  ];

  constructor(key) {
    if (typeof key !== "number")
      throw new Error(`DefaultNodeGene key must be a number, not ${key}`);
    super(key);
  }

  distance(other, config) {
    let d =
      Math.abs(this.bias - other.bias) +
      Math.abs(this.response - other.response);
    if (this.activation !== other.activation) d += 1.0;
    if (this.aggregation !== other.aggregation) d += 1.0;
    return d * config.compatibility_weight_coefficient; // Using snake_case
  }
}

export class DefaultConnectionGene extends BaseGene {
  static _gene_attributes = [
    new FloatAttribute("weight"),
    new BoolAttribute("enabled"),
  ];

  constructor(key) {
    if (!Array.isArray(key) || key.length !== 2)
      throw new Error(
        `DefaultConnectionGene key must be a [in, out] tuple (array), not ${key}`,
      );
    super(key);
  }

  distance(other, config) {
    let d = Math.abs(this.weight - other.weight);
    if (this.enabled !== other.enabled) d += 1.0;
    return d * config.compatibility_weight_coefficient; // Using snake_case
  }
}
