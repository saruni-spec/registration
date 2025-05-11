import { page } from "../../../outlook/v/code/outlook.js";
import { authoriser } from "./authoriser.js";
export class test extends page {
    //
    // Implement the authoriser as required by the Iauthoriser interface
    authoriser = new authoriser(this, "#launch");
    constructor() {
        super();
    }
    //Initiate the authorisation
    async authorise() {
        //
        const user = await this.authoriser.administer();
        //
        console.log(user);
        //
        if (!user)
            return;
        //
        alert(user);
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
