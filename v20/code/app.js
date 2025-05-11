import { page } from "../../../outlook/v/code/outlook.js";
import { authoriser } from "./authoriser.js";
import { mutall_error } from "../../../schema/v/code/schema.js";
//
export class app extends page {
    constructor() {
        super();
        //
    }
    //Initiate the authorisation
    async administer() {
        //
        //Do the authorisation
        const user = await authoriser.administer();
        //
        //Show if authorisation sccceded or not
        if (!user)
            throw new mutall_error('Authorisation aborted');
        //
        //Authorisation was successful.
        // 
        // Wlecome the user
        const welcome_div = this.get_element("msg");
        // Remove the hidden attribute
        welcome_div.removeAttribute("hidden");
        //
        // Set the welcome message
        welcome_div.innerHTML = `Welcome ${user.name}`;
        //
        return user;
    }
    //
    // Show the test
    show() {
        //
    }
}
