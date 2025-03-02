import { mutall_error, view, mymap, } from "../../../schema/v/code/schema.js";
import { myalert } from "../../../schema/v/code/mutall.js";
import { input } from "../../../schema/v/code/io.js";
import { page } from "../../../outlook/v/code/outlook.js";
import { user } from "../../../outlook/v/code/app.js";
import { exec } from "../../../schema/v/code/server.js";
//
// The authoriser class is a page that is used to authorise a user to allow them access to
// mutall applications.
// It allows the user to login, register, or reset their password.
export class authoriser extends page {
    //
    //Key for saving a user to the local storage
    static user_key = "last_logged_in_user";
    //
    //The sections of an authoriser: login, forgot, etc
    sections;
    //
    constructor(parent) {
        //
        const url = "./authoriser.html";
        super(url, parent);
        //
        // Create the sections from the identified fieldsets in the html
        this.sections = this.get_sections();
        //
        // Get the button for submitting the event
        const submit = this.get_element("submit");
        //
        // Add the event listener for submit
        submit.onclick = (evt) => this.authorise(evt);
    }
    // Create the sections from the identified fieldsets in the html
    get_sections() {
        //
        //Collect all the identified fields
        const list = this.document.querySelectorAll("fieldset[id]");
        //
        //Convert the nodelist to an array of elements; an array has more processing o\
        //options than a nodelist
        const elements = Array.from(list);
        //
        //Map the elements to section_id/section pairs
        const pairs = elements.map((element) => this.create_section(element));
        //
        //Use the pairs to create a map
        const collection = new mymap("sections", pairs);
        //Return the map
        return collection;
    }
    //Use the identified fieldset element to create a section
    create_section(fieldset) {
        //
        //Get teh section id
        const id = fieldset.id;
        //
        //Create a section that matches the id of the fieldset
        let section;
        //
        switch (fieldset.id) {
            case "login":
                section = new login(fieldset, this);
                break;
            case "forgot":
                section = new forgot(fieldset, this);
                break;
            case "sign_up":
                section = new sign_up(fieldset, this);
                break;
            case "change":
                section = new change(fieldset, this);
                break;
            default:
                throw new mutall_error(`Section ${id} not known`);
        }
        //
        //We definitely know that id is indeed a section id
        return [id, section];
    }
    //
    // When the form data is submitted on the page
    async authorise(event) {
        //
        // Prevent the default form submission
        event.preventDefault();
        //
        // Perform the authorisation based on the selected operation
        const user = await this.section.authorise();
        //
        //Do not update the last user if the authorisaton failed
        if (!user)
            return;
        //
        //Save the user to the windows local storage
        window.localStorage.setItem(authoriser.user_key, JSON.stringify(user));
    }
    //
    //Returns the current section by looking up the the one that is_current
    get section() {
        //
        // Find the section that corresponds to the selected operation
        const section = Array.from(this.sections.values()).find((sect) => sect.is_current);
        //
        // If the section is not found, throw an error
        if (!section) {
            throw new mutall_error("Section not found");
        }
        //
        return section;
    }
}
//
// Base abstract class for all sections of the authoriser page
// A section is the area/part that we collect/create and process user inputs from
export class section extends view {
    fieldset;
    //
    // An array of ios that are the inputs of the section
    ios;
    //
    //Shows if the section is current or not. We look at the input field named choice
    //for each section. If checked, then it is the current
    get is_current() {
        //
        //Get the input element named choice
        const input = this.fieldset.querySelector('input[name="choice"]');
        //
        //It is an error if none is found
        if (!input)
            throw new mutall_error(`Input element named choice is not found`);
        //
        //The checked satatus of the element determines the result
        return input.checked;
    }
    //The name io is in all the sections
    name;
    // Fieldset is the html element that contains the inputs of the section
    constructor(fieldset, parent) {
        super(parent);
        this.fieldset = fieldset;
        //
        //Create the ios of this section
        this.ios = this.create_ios();
        //
        this.name = this.ios.get("name");
    }
    //Check inputs and return true of all the inputs are ok
    async check_inputs() {
        //
        //Assume all the inputs are ok
        let ok = true;
        //
        //Loop thru all the ios and verify each one of them is ok
        for (const io of this.ios.values()) {
            //
            //For future use, package the following check as a method of io
            //
            //Tell us if the io is required or not. If not, skip the rest of the test
            //Ensure that requred is one of the io_options and read its sttais from
            //the current HTML for every input
            if (!io.search_option("required"))
                continue;
            //
            //The io value is required: check that it is not not null. If it is not null
            // then discontinue
            if (io.value)
                continue;
            //
            //A required value is  null. Report the error
            //
            //Formuate the error message. Get the label of the io. You must have supplied
            //it as an option when creating the io
            const label = io.search_option("label");
            //
            //If an io does not have a label, the use the name of the io as the label.
            //Every io must have a name, read from the HTML input element
            const name = io.name;
            //
            //Formuate the error message. Use the name of the io, if teh label is not
            //available
            const msg = `${label ?? name} is required`;
            //
            //Display the error message at neatest to the io
            io.error.textContent = msg;
            //
            //Flag this error, so that not all inputs are ok
            ok = false;
        }
        //
        return ok;
    }
    //
    //Retirn undefined if authorisation fails;
    async authorise() {
        //
        //Discontinue the  authorisation if the inputs have errors
        if (!this.check_inputs())
            return;
        //
        //Get the user interface;
        const user = await this.get_user(this.name.value);
        //
        //Check the user. Discontinue if invalid
        if (!this.check_user(user))
            return undefined;
        //
        //Now do the real authentication
        return await this.authenticate(user);
    }
    //The default version. Override this behavior for login
    check_user(user) {
        //
        //If the user does not exist, report and discontinue
        if (user)
            return true;
        //
        //The user does not exost. Report and return false
        this.name.error.textContent = "User does not exist";
        return false;
    }
    //
    // Collect the inputs
    create_ios() {
        //
        // Create a map to store the input elements
        const input_map = new mymap("ios", []);
        //
        // Get all the inputs in the section
        const inputs = this.fieldset.querySelectorAll("input");
        //
        // If the inputs are not found, throw an error
        if (inputs.length === 0) {
            throw new mutall_error("Inputs not found");
        }
        //
        // Loop through the inputs and store them in the map
        inputs.forEach((input) => {
            //
            // Get the name of the input
            const name = input.getAttribute("name");
            //
            // If the name is not found, throw an error
            if (!name)
                throw new mutall_error("Input 'name' attribute not found");
            //
            // Create an input io for the input
            const io = this.get_io(name);
            //
            // Store the input in the map
            input_map.set(name, io);
        });
        //
        // Return the map
        return input_map;
    }
    //
    // Create an input io for the section
    get_io(name) {
        //
        // Get the input element
        const proxy = this.get_proxy(name);
        //
        // Get the input type
        const type = { type: "text" };
        //
        const parent = this;
        //
        const options = {};
        //
        // Create the input object
        return new input(proxy, type, parent, options);
    }
    //
    // Get the proxy element of the input which is its label
    get_proxy(name) {
        //
        // Get the input
        const input = this.fieldset.querySelector(`input[name='${name}']`);
        //
        // If the input is not found, throw an error
        if (!input)
            throw new mutall_error("Input not found");
        //
        // Get the label
        const label = input.parentElement;
        //
        // If the label is not found, throw an error
        if (!label)
            throw new mutall_error("Label not found");
        //
        // Return the label
        return label;
    }
    //
    // Get the user from the database
    async get_user(name) {
        //
        if (!name)
            return;
        //
        //query to get their name,password and email
        const sql = `
      SELECT 
        user.user, 
        user.name, 
        user.password, 
        user.email 
      FROM 
        user 
      WHERE name = '${name}'`;
        //
        //Execute the query
        const user = await this.exec_php("database", ["mutall_users", false], "get_sql_data", [sql]);
        //
        //return a user
        return user[0];
    }
}
// Login section implementation
export class login extends section {
    //
    password;
    //
    constructor(fieldset, parent) {
        super(fieldset, parent);
        //
        this.name = this.ios.get("name");
        this.password = this.ios.get("password");
    }
    //
    //Authorise the user to login
    async authenticate(curr_user) {
        //
        //The user exist. Match passwords;
        const isPasswordVerified = await this.exec_php("mutall", [], "password_verify", [this.password.value, curr_user.password]);
        //
        //If the passwords do not match, report so and discontinue
        if (!isPasswordVerified) {
            this.password.error.textContent = "Password is incorrect";
            return;
        }
        //
        //Compile and return the user
        const name = this.name.value;
        /*
          pk: number,
          parent?: view,
          options?: options
          */
        const User = new user(name, curr_user.user, this);
        //
        return User;
    }
}
export class change extends section {
    //
    // The user name, old password, new password and confirm password required to change the password
    old_password;
    confirm_password;
    new_password;
    //
    constructor(fieldset, parent) {
        super(fieldset, parent);
        //
        this.new_password = this.ios.get("new_password");
        this.confirm_password = this.ios.get("confirm_password");
        this.old_password = this.ios.get("old_password");
    }
    async check_inputs() {
        //
        //Do the default io checks
        if (!(await this.check_inputs()))
            return false;
        //
        // check if the new password and the confirm password match
        if (this.new_password.value !== this.confirm_password.value) {
            this.confirm_password.error.textContent = "Passwords do not match";
            this.new_password.error.textContent = "Passwords do not match";
            return false;
        }
        //
        return true;
    }
    //
    //Authorise the user to change their password
    async authenticate(curr_user) {
        //
        // check if the old password matches the password in the database
        const isPasswordVerified = await this.exec_php("mutall", [], "password_verify", [this.old_password.value, curr_user.password]);
        //
        //If the passwords do not match, report so and discontinue
        if (!isPasswordVerified) {
            this.old_password.error.textContent = "Password is incorrect";
            return;
        }
        //
        // update the password
        //
        //Hash the password before storing it
        const hashed_password = await exec("mutall", [], "password_hash", [
            this.new_password.value,
        ]);
        //
        //Save the new password to the database
        const layout = [
            [hashed_password, "user", "password"],
            [this.name.value, "user", "name"],
        ];
        //
        //Save the new password to the db using the exec method
        await super.exec_php("questionnaire", ["mutall_users"], "load_common", [
            layout,
        ]);
        //
        // Notify the user the password has been changed
        //
        // Return the user
        const new_user = new user(curr_user.name, curr_user.user);
        return new_user;
    }
}
export class forgot extends section {
    //
    constructor(fieldset, parent) {
        super(fieldset, parent);
    }
    //
    //Authorise the user to recover their password
    async authenticate(curr_user) {
        //
        // Generate a new password
        const password = await this.generate_new_password(curr_user);
        //
        // send the new password to the user's email
        this.email_password(password, curr_user);
        //
        //Alert the user that the password is in the mail.
        myalert("See your new passwors in your email ");
        //
        //return withou a user
        return undefined;
    }
    //
    // Generate a simple new password for the user
    async generate_new_password(curr_user) {
        //
        // Generate a new password
        const password = this.generate_password();
        //
        //Hash the password before storing it
        const hashed_password = await exec("mutall", [], "password_hash", [
            password,
        ]);
        //
        //Save the new password to the database
        const layout = [
            [hashed_password, "user", "password"],
            [curr_user.name, "user", "name"],
        ];
        //
        //Save the new password to the db using the exec method
        exec("questionnaire", ["mutall_users"], "load_common", [layout]);
        //
        //return the new password
        return password;
    }
    //
    generate_password(length = 12) {
        //
        // Define the characters that we will use to generate the password
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_-+=<>?";
        //
        let password = "";
        //
        // Generate the password by selecting a random character from the chars
        for (let i = 0; i < length; i++) {
            //
            // Generate a random index
            const randomIndex = Math.floor(Math.random() * chars.length);
            //
            // Append the random character to the password
            password += chars[randomIndex];
        }
        return password;
    }
    //
    // Send the new password to the user's email
    async email_password(password, curr_user) {
        //
        // Get the email of the user
        const email = curr_user.email;
        //
        // Send the email
    }
}
export class sign_up extends section {
    //
    // The user name, password, confirm password and email required to sign up a new user
    password;
    confirm_password;
    //
    //For password reccoverly purposes
    email;
    //
    constructor(fieldset, parent) {
        super(fieldset, parent);
        //
        this.password = this.ios.get("password");
        this.confirm_password = this.ios.get("confirm_password");
        this.email = this.ios.get("email");
    }
    //
    async check_inputs() {
        //
        //Check the required inpus
        if (!(await super.check_inputs()))
            return false;
        //
        // check if the new password and the confirm password match
        if (this.password.value !== this.confirm_password.value) {
            this.confirm_password.error.textContent = "Passwords do not match";
            this.password.error.textContent = "Passwords do not match";
            return false;
        }
        return true;
    }
    //The default version. Override this behavior for login
    check_user(user) {
        //
        //If the user does not exist, thats ok; discontinueteh check
        if (!user)
            return true;
        //
        //The user already exist
        this.name.error.textContent = "User is already registered";
        return false;
    }
    //
    //Authorise the user to sign up
    async authenticate(curr_user) {
        //
        //Hash the password before storing it
        const hashed_password = await exec("mutall", [], "password_hash", [
            this.password.value,
        ]);
        //
        //Create a layout with the new users information
        const layout = [
            [hashed_password, "user", "password"],
            [this.name.value, "user", "name"],
            [this.email.value, "user", "email"],
        ];
        //
        //Save the new user to the database suing the exec method
        const response = await super.exec_php("questionnaire", ["mutall_users"], "load_common", [layout]);
        //
        // if the response is not successful, report so
        if (response !== "ok") {
            this.name.error.textContent = "User not saved";
            return;
        }
        //
        // return the user
        //
        // get the new created user
        const new_user = await this.get_user(this.name.value);
        //
        //If the user does not exist, report and discontinue
        if (!new_user) {
            this.name.error.textContent = "User registration failed";
            return;
        }
        //
        //Create a new user object
        const cur_user = new user(new_user.name, new_user.user);
        return cur_user;
    }
}
