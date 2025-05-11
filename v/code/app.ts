import { authoriser, Iauthoriser } from "./authoriser.js";
import { user } from "../../../outlook/v/code/app.js";
import { mutall_error, view } from "../../../schema/v/code/schema.js";
//

export class app extends view implements Iauthoriser {
  //
  // Keep track of the user that is currently logged in
  current_user: user | undefined = authoriser.user_prop;

  constructor() {
    super();
    //
  }

  //Initiate the authorisation
  async administer(): Promise<user | undefined> {
    //
    //Do the authorisation
    const user: user | undefined = await authoriser.administer();
    //
    //Show if authorisation sccceded or not
    if (!user) throw new mutall_error("Authorisation aborted");
    //
    //Authorisation was successful.
    this.current_user = user;
    //
    //Welcome the user
    this.welcome_user();
    //
    //Set the log action
    this.set_log_action();
    //
    return user;
  }
  welcome_user() {
    //
    //Ensure the user is set
    if (!this.current_user) return;
    //
    // Wlecome the user
    const welcome_div = this.get_element("msg");

    // Remove the hidden attribute
    welcome_div.removeAttribute("hidden");
    //
    // Set the welcome message
    welcome_div.innerHTML = `Welcome ${this.current_user.name}`;
  }
  set_log_action() {
    //
    // Get the log button
    const log_button = this.get_element("launch");
    //
    // check if user is set
    if (this.current_user) {
      //
      // Set the log button text
      log_button.textContent = "Click here to logout";
      //
      // Set the log button onclick event to logout the current user
      log_button.onclick = () => authoriser.logout();
    }
  }

  //
  // Show the test
  show() {
    //
    //Welcome the user
    this.welcome_user();
    //
    //Set the log action
    this.set_log_action();
  }
}
