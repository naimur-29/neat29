/**
 * Handles genomes (individuals in the population).
 * This version consistently uses snake_case for all configuration properties.
 */
import { ActivationFunctionSet } from "./activations.js";
import { AggregationFunctionSet } from "./aggregations.js";
import { ConfigParameter } from "./config.js";
import { DefaultConnectionGene, DefaultNodeGene } from "./genes.js";
import { createsCycle } from "./graphs.js";
import { choice, random } from "./randomUtil.js";

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export class DefaultGenomeConfig {
  static allowed_connectivity = [
    "unconnected",
    "fs_neat_nohidden",
    "fs_neat",
    "fs_neat_hidden",
    "full_nodirect",
    "full",
    "full_direct",
    "partial_nodirect",
    "partial",
    "partial_direct",
  ];

  constructor(params) {
    // --- THIS IS THE FIX ---
    // Create instances of the sets here.
    this.activation_defs = new ActivationFunctionSet();
    this.aggregation_defs = new AggregationFunctionSet();

    // this.activation_defs = new ActivationFunctionSet();
    // this.aggregation_function_defs = new AggregationFunctionSet();

    this._params = [
      new ConfigParameter("num_inputs", "number"),
      new ConfigParameter("num_outputs", "number"),
      new ConfigParameter("num_hidden", "number"),
      new ConfigParameter("feed_forward", "boolean"),
      new ConfigParameter("compatibility_disjoint_coefficient", "number"),
      new ConfigParameter("compatibility_weight_coefficient", "number"),
      new ConfigParameter("conn_add_prob", "number"),
      new ConfigParameter("conn_delete_prob", "number"),
      new ConfigParameter("node_add_prob", "number"),
      new ConfigParameter("node_delete_prob", "number"),
      new ConfigParameter("single_structural_mutation", "boolean", false),
      new ConfigParameter("structural_mutation_surer", "string", "default"),
      new ConfigParameter("initial_connection", "string", "unconnected"),
    ];

    this.node_gene_type = params.node_gene_type;
    this._params.push(...this.node_gene_type.getConfigParams());
    this.connection_gene_type = params.connection_gene_type;
    this._params.push(...this.connection_gene_type.getConfigParams());

    // Interpret the supplied parameters, keeping them as snake_case properties.
    for (const p of this._params) {
      this[p.name] = p.interpret(params);
    }

    this.node_gene_type.validateAttributes(this);
    this.connection_gene_type.validateAttributes(this);

    // --- ROBUSTNESS FIX ---
    // Ensure num_inputs and num_outputs are valid numbers before creating keys.
    const num_inputs = Number(this.num_inputs) || 0;
    const num_outputs = Number(this.num_outputs) || 0;

    this.input_keys = Array.from({ length: num_inputs }, (_, i) => -i - 1);
    this.output_keys = Array.from({ length: num_outputs }, (_, i) => i);

    this.connection_fraction = null;

    if (this.initial_connection.includes("partial")) {
      const [type, fractionStr] = this.initial_connection.split(" ");
      this.initial_connection = type;
      this.connection_fraction = parseFloat(fractionStr);
      if (
        isNaN(this.connection_fraction) ||
        this.connection_fraction < 0 ||
        this.connection_fraction > 1
      ) {
        throw new Error(
          "'partial' connection value must be a number between 0.0 and 1.0.",
        );
      }
    }

    if (
      !DefaultGenomeConfig.allowed_connectivity.includes(
        this.initial_connection,
      )
    ) {
      throw new Error(
        `Invalid initial_connection type: ${this.initial_connection}`,
      );
    }

    const surer = this.structural_mutation_surer.toLowerCase();
    if (["1", "yes", "true", "on"].includes(surer))
      this.structural_mutation_surer = "true";
    else if (["0", "no", "false", "off"].includes(surer))
      this.structural_mutation_surer = "false";
    else if (surer === "default") this.structural_mutation_surer = "default";
    else
      throw new Error(
        `Invalid structural_mutation_surer: ${this.structural_mutation_surer}`,
      );

    this.node_indexer = null;
  }

  get_new_node_key(nodeDict) {
    if (this.node_indexer === null) {
      const existingKeys = Object.keys(nodeDict).map(Number);
      const highestOutputKey =
        this.output_keys.length > 0 ? Math.max(...this.output_keys) : -1;
      const highestExistingKey =
        existingKeys.length > 0 ? Math.max(...existingKeys) : -Infinity;
      this.node_indexer = Math.max(highestOutputKey, highestExistingKey) + 1;
    }
    const newId = this.node_indexer++;
    if (nodeDict[newId] !== undefined)
      throw new Error(`Node key already exists: ${newId}`);
    return newId;
  }

  check_structural_mutation_surer() {
    if (this.structural_mutation_surer === "true") return true;
    if (this.structural_mutation_surer === "false") return false;
    if (this.structural_mutation_surer === "default")
      return this.single_structural_mutation;
    throw new Error(
      `Invalid structural_mutation_surer: ${this.structural_mutation_surer}`,
    );
  }
}

export class DefaultGenome {
  static parseConfig(paramDict) {
    paramDict.node_gene_type = DefaultNodeGene;
    paramDict.connection_gene_type = DefaultConnectionGene;
    return new DefaultGenomeConfig(paramDict);
  }

  constructor(key) {
    this.key = key;
    this.connections = {};
    this.nodes = {};
    this.fitness = null;
  }

  configure_new(config) {
    for (const nodeKey of config.output_keys)
      this.nodes[nodeKey] = DefaultGenome.create_node(config, nodeKey);
    for (let i = 0; i < config.num_hidden; i++) {
      const nodeKey = config.get_new_node_key(this.nodes);
      this.nodes[nodeKey] = DefaultGenome.create_node(config, nodeKey);
    }

    if (config.initial_connection.includes("fs_neat"))
      this.connect_fs_neat_nohidden(config);
    else if (config.initial_connection.includes("full"))
      this.connect_full_nodirect(config);
    else if (config.initial_connection.includes("partial"))
      this.connect_partial_nodirect(config);
  }

  configure_crossover(genome1, genome2) {
    const [parent1, parent2] =
      genome1.fitness > genome2.fitness
        ? [genome1, genome2]
        : [genome2, genome1];
    for (const [key, cg1] of Object.entries(parent1.connections)) {
      this.connections[key] = parent2.connections[key]
        ? cg1.crossover(parent2.connections[key])
        : cg1.copy();
    }
    for (const [key, ng1] of Object.entries(parent1.nodes)) {
      this.nodes[key] = parent2.nodes[key]
        ? ng1.crossover(parent2.nodes[key])
        : ng1.copy();
    }
  }

  mutate(config) {
    if (config.single_structural_mutation) {
      const r = random();
      if (r < config.node_add_prob) this.mutate_add_node(config);
      else if (r < config.node_add_prob + config.node_delete_prob)
        this.mutate_delete_node(config);
      else if (
        r <
        config.node_add_prob + config.node_delete_prob + config.conn_add_prob
      )
        this.mutate_add_connection(config);
      else if (
        r <
        config.node_add_prob +
          config.node_delete_prob +
          config.conn_add_prob +
          config.conn_delete_prob
      )
        this.mutate_delete_connection();
    } else {
      if (random() < config.node_add_prob) this.mutate_add_node(config);
      if (random() < config.node_delete_prob) this.mutate_delete_node(config);
      if (random() < config.conn_add_prob) this.mutate_add_connection(config);
      if (random() < config.conn_delete_prob) this.mutate_delete_connection();
    }
    for (const cg of Object.values(this.connections)) cg.mutate(config);
    for (const ng of Object.values(this.nodes)) ng.mutate(config);
  }

  mutate_add_node(config) {
    const connValues = Object.values(this.connections);
    if (connValues.length === 0) {
      if (config.check_structural_mutation_surer())
        this.mutate_add_connection(config);
      return;
    }
    const connToSplit = choice(connValues);
    const newNodeId = config.get_new_node_key(this.nodes);
    this.nodes[newNodeId] = DefaultGenome.create_node(config, newNodeId);
    connToSplit.enabled = false;
    const [inNode, outNode] = connToSplit.key;
    this.add_connection(config, inNode, newNodeId, 1.0, true);
    this.add_connection(config, newNodeId, outNode, connToSplit.weight, true);
  }

  add_connection(config, inputKey, outputKey, weight, enabled) {
    const key = [inputKey, outputKey];
    const connection = new config.connection_gene_type(key);
    connection.initAttributes(config);
    connection.weight = weight;
    connection.enabled = enabled;
    this.connections[JSON.stringify(key)] = connection;
  }

  mutate_add_connection(config) {
    const possible_outputs = Object.keys(this.nodes).map(Number);
    if (possible_outputs.length === 0) return;
    const out_node = choice(possible_outputs);
    const in_node = choice([...possible_outputs, ...config.input_keys]);
    const key = [in_node, out_node];
    if (this.connections[JSON.stringify(key)]) return;
    if (
      config.output_keys.includes(in_node) &&
      config.output_keys.includes(out_node)
    )
      return;
    const existingConns = Object.keys(this.connections).map((k) =>
      JSON.parse(k),
    );
    if (config.feed_forward && createsCycle(existingConns, key)) return;
    const cg = DefaultGenome.create_connection(config, in_node, out_node);
    this.connections[JSON.stringify(cg.key)] = cg;
  }

  mutate_delete_node(config) {
    const available_nodes = Object.keys(this.nodes)
      .map(Number)
      .filter((k) => !config.output_keys.includes(k));
    if (available_nodes.length === 0) return -1;
    const del_key = choice(available_nodes);
    for (const keyStr of Object.keys(this.connections)) {
      if (JSON.parse(keyStr).includes(del_key)) delete this.connections[keyStr];
    }
    delete this.nodes[del_key];
    return del_key;
  }

  mutate_delete_connection() {
    const keys = Object.keys(this.connections);
    if (keys.length > 0) delete this.connections[choice(keys)];
  }

  distance(other, config) {
    const node_keys1 = new Set(Object.keys(this.nodes));
    const node_keys2 = new Set(Object.keys(other.nodes));
    const all_node_keys = new Set([...node_keys1, ...node_keys2]);
    let node_distance = 0,
      disjoint_nodes = 0;
    for (const key of all_node_keys) {
      if (node_keys1.has(key) && node_keys2.has(key))
        node_distance += this.nodes[key].distance(other.nodes[key], config);
      else disjoint_nodes++;
    }
    node_distance =
      (node_distance +
        config.compatibility_disjoint_coefficient * disjoint_nodes) /
      Math.max(1, all_node_keys.size);

    const conn_keys1 = new Set(Object.keys(this.connections));
    const conn_keys2 = new Set(Object.keys(other.connections));
    const all_conn_keys = new Set([...conn_keys1, ...conn_keys2]);
    let conn_distance = 0,
      disjoint_conns = 0;
    for (const key of all_conn_keys) {
      if (conn_keys1.has(key) && conn_keys2.has(key))
        conn_distance += this.connections[key].distance(
          other.connections[key],
          config,
        );
      else disjoint_conns++;
    }
    conn_distance =
      (conn_distance +
        config.compatibility_disjoint_coefficient * disjoint_conns) /
      Math.max(1, all_conn_keys.size);

    return node_distance + conn_distance;
  }

  size() {
    return [
      Object.keys(this.nodes).length,
      Object.values(this.connections).filter((c) => c.enabled).length,
    ];
  }

  toString() {
    let s = `Key: ${this.key}\nFitness: ${this.fitness}\nNodes:`;
    for (const [k, ng] of Object.entries(this.nodes))
      s += `\n\t${k} ${ng.toString()}`;
    s += "\nConnections:";
    const conns = Object.values(this.connections).sort(
      (a, b) => a.key[0] - b.key[0] || a.key[1] - b.key[1],
    );
    for (const c of conns) s += `\n\t${c.toString()}`;
    return s;
  }

  static create_node(config, nodeId) {
    const node = new config.node_gene_type(nodeId);
    node.initAttributes(config);
    return node;
  }

  static create_connection(config, inputId, outputId) {
    const conn = new config.connection_gene_type([inputId, outputId]);
    conn.initAttributes(config);
    return conn;
  }

  compute_full_connections(config, direct) {
    const hidden = Object.keys(this.nodes)
      .map(Number)
      .filter((k) => !config.output_keys.includes(k));
    const output = config.output_keys;
    const connections = [];
    if (hidden.length > 0) {
      for (const i of config.input_keys)
        for (const h of hidden) connections.push([i, h]);
      for (const h of hidden) for (const o of output) connections.push([h, o]);
    }
    if (direct || hidden.length === 0) {
      for (const i of config.input_keys)
        for (const o of output) connections.push([i, o]);
    }
    return connections;
  }

  connect_full_nodirect(config) {
    const connections = this.compute_full_connections(config, false);
    for (const [i, o] of connections) {
      const conn = DefaultGenome.create_connection(config, i, o);
      this.connections[JSON.stringify(conn.key)] = conn;
    }
  }

  connect_partial_nodirect(config) {
    const all_connections = this.compute_full_connections(config, false);
    shuffle(all_connections);
    const num_to_add = Math.round(
      all_connections.length * config.connection_fraction,
    );
    for (let i = 0; i < num_to_add; i++) {
      const [input_id, output_id] = all_connections[i];
      const conn = DefaultGenome.create_connection(config, input_id, output_id);
      this.connections[JSON.stringify(conn.key)] = conn;
    }
  }

  connect_fs_neat_nohidden(config) {
    const input_id = choice(config.input_keys);
    for (const output_id of config.output_keys) {
      const conn = DefaultGenome.create_connection(config, input_id, output_id);
      this.connections[JSON.stringify(conn.key)] = conn;
    }
  }
}
