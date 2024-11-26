import { mutall_error, view } from "../../../schema/v/code/schema.js";
import { user } from "../../../outlook/v/code/app.js";
//
// Custom authentication (login, sign_up, and forgot password) for mutall
// Allows a user to register,login,change their password and logout out
// Keeps track of the logged in user for further reference in other contexts
export class auth extends view {
    //
    //Declare a user property
    user;
    //
    //Create the constrctor of the class,adding the constructor of its parent class
    constructor() {
        super();
    }
    //
    //Clears error messages when an input field changes
    clear_errors() {
        //
        // Get the registration form on the page
        const form = document.querySelector("form");
        //
        // Get all input elements within the form
        const inputs = form.querySelectorAll("input:not([type='radio'])");
        //
        // Add an 'input' event listener to each input element
        inputs.forEach((input) => {
            input.addEventListener("input", () => {
                //
                // Find the error message span within the same parent element as the input
                const errorSpan = input.parentElement?.querySelector(".error");
                //
                // Clear any error message on the error element
                errorSpan.textContent = "";
            });
        });
        //
        //Get the general error element on the form
        const form_error = document.getElementById("form_error");
        //
        //Clear any error message on the form error span
        form_error.textContent = "";
    }
    //
    // Collect and submit user credentials for authentication
    // and save the user to local storage
    async submit(event) {
        //
        // Do not refresh the form on submit so that error messages can
        // be seen
        event.preventDefault();
        //
        //Check and get user credentials,if they are valid,submit them for authentication
        //Otherwise,we abort the submission
        const inps = this.#get_credentials();
        //
        //Abort the submission if the credentials are not defined
        if (!inps)
            return;
        //
        //Use the credentials to authenticate the user.If not successful,abort the submission
        const user = await this.#authenticate_user(inps);
        //
        //If the authentication fails,abort the submission
        if (!user)
            return;
        //
        //Save the authenticated user for further reference to complete the submission
        this.user = user;
        //
        //Save the user to local strorage
        localStorage.setItem("user", JSON.stringify({ name: user.name, key: user.pk }));
    }
    //
    // Check inputs and report all potential errors
    // Performs comprehensive validation on the inputs to check any errors
    #check_inputs() {
        //
        //Get the relevant section that has the inputs
        const section = this.#get_section();
        //
        //Prepare to return from the various sections
        let result;
        //
        // Perform operation-specific input collection and validation
        //
        //check all the fields in the section
        switch (section.id) {
            case "login":
                result = this.#check_login(section);
                break;
            case "sign_up":
                result = this.#check_sign_up(section);
                break;
            case "forgot":
                result = this.#check_forgot(section);
                break;
            case "change":
                result = this.#check_change(section);
                break;
            default:
                throw new mutall_error(`This sction id:${section.id} is not an opration id`);
        }
        return result;
    }
    //
    //
    #get_section() {
        //
        // Get the registration form on the page
        const form = this.get_element("auth");
        //
        //
        const choice = this.#get_operation_id(form);
        //
        // Find the fieldset corresponding to the selected operation
        const field_set = this.get_element(choice);
        return field_set;
    }
    //
    //Get the operation id from the selected radio button on the form
    #get_operation_id(form) {
        //
        // Find the selected radio button for the authentication operation
        const radio_choice = form.querySelector("input[name='choice']:checked");
        //
        // Show an error if no operation is selected
        if (!radio_choice) {
            //
            // mutall error
            throw new mutall_error("Radio button not selected");
        }
        //
        // Get the selected operation (login, sign_up, forgot, change)
        const choice = radio_choice.value;
        return choice;
    }
    // Check login credentials
    #check_login(section) {
        //
        //check if all login fields have a value and report the error if an input
        // is missing
        if (!this.#validate_required_fields(section))
            return;
        return section;
    }
    // Check sign up details with password validation
    #check_sign_up(section) {
        //
        //check if all sign_up fields have a value and report the error if an input
        // is missing
        if (!this.#validate_required_fields(section))
            return;
        //
        // For sign_up check both password fields
        const passwords = section.querySelectorAll("input[type=password]");
        //
        // Check if password and confirm password match
        if (passwords[0].value !== passwords[1].value) {
            //
            // Find the error span to display mismatch message
            const errorSpan = passwords[1]
                .closest("label")
                ?.querySelector(".error");
            //
            // Show error if passwords do not match
            errorSpan.textContent = "Passwords do not match";
            return undefined;
        }
    }
    // Check forgot password details
    #check_forgot(section) {
        //
        //check if all forgot password fields have a value and report the error if an input
        // is missing
        if (!this.#validate_required_fields(section))
            return;
        return section;
    }
    // Check change password details with validation
    #check_change(section) {
        //
        //check if all change password fields have a value and report the error if an input
        // is missing
        if (!this.#validate_required_fields(section))
            return;
        //
        // For change password,check the 2nd ans 3rd password
        //Collect the passwords
        const passwords = section.querySelectorAll("input[type=password]");
        //
        // Check if new password and confirm new password match
        if (passwords[1].value !== passwords[2].value) {
            //
            // Find the error span to display mismatch message
            const errorSpan = passwords[2]
                .closest("label")
                ?.querySelector(".error");
            //
            // Show error if new passwords do not match
            errorSpan.textContent = "Passwords do not match";
            return undefined;
        }
        return section;
    }
    // Create credentials object from pre-validated inputs
    // This method transforms the validated inputs into a credentials object
    #get_inputs(field_set) {
        //
        //get the current operation
        const operation = field_set.id;
        //
        //Get the name of the user
        const name = field_set.querySelector("input[type=text]");
        if (!name) {
            const message = "Name field is missing";
            alert(message);
            throw new Error(message);
        }
        //
        // Populate credentials based on the selected operation
        let credentials;
        switch (operation) {
            case "login": {
                //
                //get the password for login
                const passwordInput = field_set.querySelector("input[type=password]");
                //
                //Add the password and name to the credentials
                credentials = {
                    operation: operation,
                    name: name.value,
                    password: passwordInput.value,
                };
                break;
            }
            case "sign_up": {
                //
                //Get the email,password and password confirmation for sign up
                const email = field_set.querySelector("input[type=email]");
                //
                //Get the password fields,password and confirm password
                const passwords = field_set.querySelectorAll("input[type=password]");
                //
                //Add the name, email and password to the credentials
                credentials = {
                    operation: operation,
                    name: name.value,
                    email: email.value,
                    password: passwords[0].value,
                };
                break;
            }
            case "forgot": {
                //
                //Get the email
                const email = field_set.querySelector("input[type=email]");
                //
                //Add the name, email and password to the credentials
                credentials = {
                    operation: operation,
                    name: name.value,
                    email: email.value,
                };
                break;
            }
            case "change": {
                //
                //Get the password fields,old password,new password and confirm password
                const passwords = field_set.querySelectorAll("input[type=password]");
                //Add the name, email and password to the credentials
                credentials = {
                    operation: operation,
                    name: name.value,
                    password: passwords[0].value,
                    new_password: passwords[1].value,
                };
                break;
            }
        }
        //
        // Return the complete credentials object
        return credentials;
    }
    // Main method to get credentials
    // Combines input checking and credentials collections
    #get_credentials() {
        //
        // First, check and validate inputs returning the HTML element
        // that represents that section. If the check fails,return undefined
        const inputs = this.#check_inputs();
        //
        //return undefined if the chck fails
        if (!inputs)
            return undefined;
        //
        // Collect the credentials
        const credentials = this.#get_inputs(inputs);
        return credentials;
    }
    //
    // Authenticates a user based on the operation type (login, registration, etc.)
    async #authenticate_user(credentials) {
        //
        //Use a switch to handle different authentication operations
        switch (credentials.operation) {
            case "login": {
                //
                //Authenticate the user for login
                return await this.#login(credentials);
            }
            case "sign_up": {
                //
                //Register the new user
                return this.#register_user(credentials);
            }
            case "forgot": {
                //
                //Reset the user's password
                return this.#reset_password(credentials);
            }
            case "change": {
                //
                //Change the user's password to their new password
                return this.#reset_password(credentials);
            }
            default:
                return;
        }
    }
    //
    // Check that all required fields have input values
    #validate_required_fields(fieldset) {
        //
        //Get all the inputs in the fieldset
        const inputs = fieldset.querySelectorAll('input:not([type="radio"])');
        //
        //set a checker to true assuming the input is provided
        let all_inputs_available = true;
        //
        //Iterate through each input to check if a input has been proveided
        inputs.forEach((input) => {
            //
            //set the error of this input to empty
            const errorSpan = input
                .closest("label")
                ?.querySelector(".error");
            errorSpan.textContent = "";
            //
            //if the value of the input is an empty string set the checker to false
            if (input.value.trim() === "") {
                errorSpan.textContent = "This field is required";
                all_inputs_available = false;
            }
        });
        //
        //return the checker
        return all_inputs_available;
    }
    //
    // Log in an existing user by verifying credentials
    async #login(credentials) {
        //
        //confirm the opration is login
        if (credentials.operation !== "login") {
            return;
        }
        //
        //Check if a user with the current name exists
        const current_user = await this.#check_user(credentials.name);
        if (!current_user) {
            //
            //
            this.#show_error(credentials.operation, "text", "User does not exist");
            return;
        }
        //
        //Verify the current users password
        if (!(await this.exec_php("mutall", [], "password_verify", [
            credentials.password,
            current_user.password,
        ]))) {
            //
            //show an error if the credentials dont match
            this.#show_error(credentials.operation, "password", "Credentials do not match");
            return;
        }
        //
        //Set the the current user to the fetched user
        const cur_user = new user(current_user.name, current_user.user);
        return cur_user;
    }
    //
    // Register a new user in the system with provided credentials
    async #register_user(credentials) {
        //
        //confirm the opration is sign_up
        if (credentials.operation !== "sign_up") {
            return;
        }
        //
        //Check if a user with the same name exists
        const current_user = await this.#check_user(credentials.name);
        if (current_user) {
            this.#show_error(credentials.operation, "input", "User already exists");
            return;
        }
        //
        //Hash the new users password before storing it
        const hashed_password = await this.exec_php("mutall", [], "password_hash", [
            credentials.password,
        ]);
        //
        //Create a layout with the new users information
        const layout = [
            [hashed_password, "user", "password"],
            [credentials.name, "user", "name"],
            [credentials.email, "user", "email"],
        ];
        //
        //Save the new user to the database suing the exec method
        const response = await this.exec_php("questionnaire", ["mutall_users"], "load_common", [layout]);
        //
        //Return a response to the user
        if (response !== "ok") {
            //
            //show an error if registration fails
            this.#show_error(credentials.operation, "text", "Registration failed");
            return;
        }
        const new_user = await this.#check_user(credentials.name);
        const cur_user = new user(new_user.name, new_user.user);
        return cur_user;
    }
    //
    // Reset a user’s password for 'forgot' or 'change' operations
    async #reset_password(credentials) {
        //
        //Check if the user exists
        const current_user = await this.#check_user(credentials.name);
        if (!current_user) {
            this.#show_error(credentials.operation, "text", "User not found");
            return;
        }
        //
        //Authenticate their password
        //
        if (credentials.operation === "change") {
            //
            //authenticate their old password
            if (!(await this.exec_php("mutall", [], "password_verify", [
                credentials.password,
                current_user.password,
            ]))) {
                //
                //if their old password is wrong
                this.#show_error(credentials.operation, "password", "Credentials dont match");
                return;
            }
            //
            //Set their password to their new password
            await this.#update_password(credentials.name, credentials.new_password);
            //
            //create a user instance
            const cur_user = new user(current_user.name, current_user.user);
            return cur_user;
        }
        //
        //Set their password to a shared password
        await this.#update_password(credentials.name, "shared_password");
        this.#show_error(credentials.operation, "password", "Password reset to default");
        //
        //create a user instance
        const cur_user = new user(current_user.name, current_user.user);
        return cur_user;
    }
    //
    // Check if a user with a given name exists in the database
    async #check_user(name) {
        //
        //query to get their name,password and email
        const sql = `SELECT user.user,user.name, user.password, user.email FROM user WHERE name = '${name}'`;
        //
        //Execute the query
        const user = await this.exec_php("database", ["mutall_users", false], "get_sql_data", [sql]);
        //
        //return a user or null if they dont exist
        return user ? user[0] : undefined;
    }
    //
    // Update a user’s password in the database
    async #update_password(name, new_password) {
        //
        //Hash the password before storing it
        const hashed_password = await this.exec_php("mutall", [], "password_hash", [
            new_password,
        ]);
        //
        //Create a layout to save the new password to the database
        const layout = [
            [hashed_password, "user", "password"],
            [name, "user", "name"],
        ];
        //
        //Save the new password to the db using the exec method
        await this.exec_php("questionnaire", ["mutall_users"], "load_common", [
            layout,
        ]);
    }
    //
    // Log out the current user by clearing their session
    async logout() {
        //
        //Remove the session from local storage
        localStorage.removeItem("user");
        //
        //set the current user to undefined
        this.user = undefined;
        //
        //reload the current page
        window.location.reload();
    }
    // Check if a user is currently logged in and returns their details if available
    current_user() {
        //
        // If this.user is already defined, return the user
        if (this.user) {
            return this.user;
        }
        //
        // Check if a session is available in local storage
        const session = localStorage.getItem("user");
        //
        // If a session is found, parse and set this.user, then return it
        if (session) {
            const session_user = JSON.parse(session);
            this.user = new user(session_user.name, session_user.key);
            return this.user;
        }
        //
        // If no user is found, return undefined
        return undefined;
    }
    //
    // Display a general error message on the form
    #show_error(operation, fieldName, error) {
        //
        // Find the current input field by using its parent fieldset
        const current_input = document.querySelector(`#${operation} input[type="${fieldName}"]`);
        if (!current_input)
            return;
        // Get the error span that directly follows this input
        const errorSpan = current_input.nextElementSibling;
        if (errorSpan) {
            errorSpan.textContent = error;
        }
    }
}
