import { page } from "../../../outlook/v/code/outlook.js";
import { authoriser } from "./authoriser.js";
export class test extends page {
    //
    // Implement the authoriser as required by the Iauthoriser interface
    authoriser = new authoriser(this, "#launch");
    constructor() {
        super();
    }
    //
    // Show the test
    show() {
        //
    }
}
