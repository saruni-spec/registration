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

  //Initiate the authorisation
  async authorise(): Promise<void> {
    //
    const user: user | undefined = await this.authoriser.administer();
    //
    if (!user) return;
    //
    //
    const welcome_div = this.get_element("msg");

    // Remove the hidden attribute
    welcome_div.removeAttribute("hidden");
    //
    // Set the welcome message
    welcome_div.innerHTML = `Welcome ${user.name}`;
  }

  //
  // Show the test
  show() {
    //
  }
}
