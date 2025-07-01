/**
 * A collection of directed graph algorithm implementations.
 * These functions are typically used for analyzing the structure of a neural network.
 */

/**
 * Checks if adding a new connection would create a cycle in an existing acyclic graph.
 * This is a crucial check to maintain a feed-forward network structure.
 *
 * @param {Array<[any, any]>} connections - An array of existing connections, e.g., [[inputNode, outputNode], ...].
 * @param {[any, any]} test - The new connection to test, e.g., [newInput, newOutput].
 * @returns {boolean} - True if adding the connection creates a cycle, false otherwise.
 */
export function createsCycle(connections, test) {
  const [i, o] = test; // Destructure the test connection into input (i) and output (o)

  // A connection from a node to itself is a cycle.
  if (i === o) {
    return true;
  }

  // Start a traversal from the output node of the new connection.
  // If we can reach the input node of the new connection, then adding it would create a cycle.
  const visited = new Set([o]);
  while (true) {
    let numAdded = 0;
    // Find all nodes that are outputs of the currently visited nodes.
    for (const [from, to] of connections) {
      if (visited.has(from) && !visited.has(to)) {
        // If we've reached the input of our test connection, we've found a path
        // that would form a cycle.
        if (to === i) {
          return true;
        }
        visited.add(to);
        numAdded++;
      }
    }
    // If we can't find any new nodes to visit, it means there is no path,
    // so no cycle will be created.
    if (numAdded === 0) {
      return false;
    }
  }
}

/**
 * Collects the set of nodes whose state is required to compute the final network output(s).
 * This prunes any nodes that are not part of the active network path from inputs to outputs.
 *
 * @param {any[]} inputs - An array of the input node identifiers.
 * @param {any[]} outputs - An array of the output node identifiers.
 * @param {Array<[any, any]>} connections - The list of all connections in the network.
 * @returns {Set<any>} - A Set of identifiers for all required nodes (excluding input nodes).
 */
export function requiredForOutput(inputs, outputs, connections) {
  const inputSet = new Set(inputs);
  const outputSet = new Set(outputs);

  // Sanity check: input and output nodes should not overlap.
  for (const id of inputSet) {
    if (outputSet.has(id)) {
      throw new Error(
        `Input and output node sets should be disjoint, but found ${id} in both.`,
      );
    }
  }

  // The required nodes are initially the output nodes.
  const required = new Set(outputSet);
  // 's' is the set of nodes we are currently searching backwards from.
  let s = new Set(outputSet);

  while (true) {
    // Find nodes that are inputs to the current search set 's'.
    const t = new Set();
    for (const [from, to] of connections) {
      if (s.has(to) && !s.has(from)) {
        t.add(from);
      }
    }

    // If we can't find any new predecessor nodes, we're done.
    if (t.size === 0) {
      break;
    }

    // From the new predecessors, find the ones that are not input nodes.
    const layerNodes = new Set();
    for (const node of t) {
      if (!inputSet.has(node)) {
        layerNodes.add(node);
      }
    }

    // If all new predecessors were input nodes, we can't go any further back.
    if (layerNodes.size === 0) {
      break;
    }

    // Add the new layer of nodes to the required set and the search set.
    for (const node of layerNodes) {
      required.add(node);
    }
    for (const node of t) {
      s.add(node);
    }
  }

  return required;
}

/**
 * Organizes the nodes of a feed-forward network into layers for parallel evaluation.
 * Each layer contains nodes that can be computed simultaneously.
 *
 * @param {any[]} inputs - An array of the network input node identifiers.
 * @param {any[]} outputs - An array of the output node identifiers.
 * @param {Array<[any, any]>} connections - The list of all connections in the network.
 * @returns {Array<Set<any>>} - A list of layers, where each layer is a Set of node identifiers.
 */
export function feedForwardLayers(inputs, outputs, connections) {
  // First, find only the nodes that are actually used to compute the output.
  const required = requiredForOutput(inputs, outputs, connections);

  const layers = [];
  // 's' is the set of nodes whose values are known (initially, the inputs).
  let s = new Set(inputs);

  while (true) {
    // Find candidate nodes for the next layer. These are nodes that receive
    // connections from the already-evaluated nodes in 's'.
    const candidates = new Set();
    for (const [from, to] of connections) {
      if (s.has(from) && !s.has(to)) {
        candidates.add(to);
      }
    }

    // From the candidates, select the ones that are ready to be evaluated.
    // A node is ready if it's required and ALL of its inputs are in 's'.
    const nextLayer = new Set();
    for (const n of candidates) {
      if (required.has(n)) {
        const incomingConnections = connections.filter(([_, to]) => to === n);
        const allInputsReady = incomingConnections.every(([from, _]) =>
          s.has(from),
        );
        if (allInputsReady) {
          nextLayer.add(n);
        }
      }
    }

    // If we can't form a new layer, we are done.
    if (nextLayer.size === 0) {
      break;
    }

    layers.push(nextLayer);

    // Add the new layer to the set of evaluated nodes for the next iteration.
    for (const node of nextLayer) {
      s.add(node);
    }
  }

  return layers;
}
