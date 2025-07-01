import { main } from "./index.js";

// Define your p5.js sketch as a function that takes a p5 instance
const s = (p) => {
  p.setup = () => {
    p.createCanvas(600, 400);
    p.background(220);

    main();
  };

  p.draw = () => {
    p.fill(100, 150, 250);
    p.ellipse(p.mouseX, p.mouseY, 50, 50);
  };

  p.myCustomFunction = () => {
    console.log("This is a custom function within the p5 instance.");
  };
};

new p5(s);
