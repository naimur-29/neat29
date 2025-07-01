// nn.js

/**
 * Implements the feed-forward neural network phenotype.
 */
import { feedForwardLayers } from "./graphs.js";

export class FeedForwardNetwork {
  /**
   * @param {number[]} input_nodes - List of input node keys.
   * @param {number[]} output_nodes - List of output node keys.
   * @param {Object[]} node_evals - A list of tuples for evaluation: [node_key, activation_func, aggregation_func, bias, response, [links...]]
   * where each link is a tuple: [input_node_key, weight].
   */
  constructor(input_nodes, output_nodes, node_evals) {
    this.input_nodes = input_nodes;
    this.output_nodes = output_nodes;
    this.node_evals = node_evals;
    this.values = new Map();
  }

  /**
   * Activates the network with a given set of inputs.
   * @param {number[]} inputs - An array of input values.
   * @returns {number[]} An array of output values from the output nodes.
   */
  activate(inputs) {
    if (inputs.length !== this.input_nodes.length) {
      throw new Error(
        `Expected ${this.input_nodes.length} inputs, got ${inputs.length}`,
      );
    }

    this.values.clear();
    for (let i = 0; i < this.input_nodes.length; i++) {
      this.values.set(this.input_nodes[i], inputs[i]);
    }

    for (const [node, act_func, agg_func, bias, response, links] of this
      .node_evals) {
      const node_inputs = links.map(
        ([inode, weight]) => this.values.get(inode) * weight,
      );
      const s = agg_func(node_inputs);
      this.values.set(node, act_func(bias + response * s));
    }

    return this.output_nodes.map((node) => this.values.get(node));
  }

  /**
   * Creates a new FeedForwardNetwork from a genome and configuration.
   * @param {DefaultGenome} genome
   * @param {Object} config - The main NEAT configuration object.
   * @returns {FeedForwardNetwork}
   */
  static create(genome, config) {
    const genome_config = config.genome_config;
    const connections = Object.values(genome.connections).filter(
      (cg) => cg.enabled,
    );

    const layers = feedForwardLayers(
      genome_config.input_keys,
      genome_config.output_keys,
      connections.map((c) => c.key),
    );
    const node_evals = [];

    for (const layer of layers) {
      for (const node_key of layer) {
        const node = genome.nodes[node_key];
        const links = connections
          .filter((cg) => cg.key[1] === node_key)
          .map((cg) => [cg.key[0], cg.weight]);

        const activation_func = genome_config.activation_defs.get(
          node.activation,
        );
        const aggregation_func = genome_config.aggregation_defs.get(
          node.aggregation,
        );

        node_evals.push([
          node.key,
          activation_func,
          aggregation_func,
          node.bias,
          node.response,
          links,
        ]);
      }
    }

    return new FeedForwardNetwork(
      genome_config.input_keys,
      genome_config.output_keys,
      node_evals,
    );
  }
}
