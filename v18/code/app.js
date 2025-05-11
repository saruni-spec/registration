import { page } from "../../../outlook/v/code/outlook.js";
import { authoriser } from "./authoriser.js";
export class test extends page {
    //
    // Impement the authoriser as reuired bt the Iaut interface
    //
    // Implement the authoriser as required by the Iauthoriser interface
    authoriser = new authoriser(this, "#launch");
    constructor() {
        super();
    }
    // In your test class show method
    async show() { }
}
