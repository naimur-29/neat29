import Config29 from "./Config29";
import Agent29 from "./Agent29";

const inputs = [
  [0, 0],
  [0, 1],
  [1, 0],
  [1, 1],
];

for (let i = 0; i < 1000000; i++) {
  const config: Config29 = new Config29(2, 2, "SIGMOID");
  const agent: Agent29 = new Agent29(config);
  const outs = inputs.map((input) => {
    const out = agent.forward(input);
    return out.indexOf(Math.max(...out));
  });

  console.log(i, "-->", outs.join(", "));
  if (outs[0] == 0 && outs[1] == 1 && outs[2] == 1 && outs[3] == 0) {
    console.log("solved!");
    console.log(agent.genome);
    break;
  }
}
