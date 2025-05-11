import { page } from "../../../outlook/v/code/outlook.js";
import { authoriser, Iauthoriser } from "./authoriser.js";
import { user } from "../../../outlook/v/code/app.js";

export class test extends page implements Iauthoriser {
  //
  // Implement the authoriser as required by the Iauthoriser interface
  public authoriser: authoriser = new authoriser(this, "#launch");

  constructor() {
    super();
  }

  //
  // Show the test
  show() {
    //
  }
}
