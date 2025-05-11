import { page } from "../../../outlook/v/code/outlook.js";
import { authoriser, Iauthoriser } from "./authoriser.js";

export class test implements Iauthoriser {
  //
  // Impement the authoriser as reuired bt the Iaut interface
  public authoriser: authoriser;

  constructor() {
    // Create a mother page representing the current test page

    this.authoriser = new authoriser();
  }

  // In your test class show method
  async show(): Promise<void> {
    const launch = document.querySelector("#launch") as HTMLButtonElement;
    if (!launch) return;

    if (!this.authoriser.user) {
      launch.textContent = "Click here to login";
      launch.onclick = async () => {
        const result = await this.authoriser.administer();
        if (result) {
          // Update UI without reloading
          launch.textContent = "Logout";
          launch.onclick = () => {
            this.authoriser.logout();
            launch.textContent = "Click here to login";
            launch.onclick = async () => this.show(); // Rebind the click handler
          };
        }
      };
    } else {
      launch.textContent = "Logout";
      launch.onclick = () => {
        this.authoriser.logout();
        launch.textContent = "Click here to login";
        launch.onclick = async () => this.show(); // Rebind the click handler
      };
    }
  }
}
