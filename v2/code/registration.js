import { view } from "../../../schema/v/code/schema.js";
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
    //Create te constrctor of the class,adding the constructor of its parent class
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
        const inputs = form.querySelectorAll("input");
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
    // Optional callback function to perform an action if the operation succeeds
    async submit(event, on_success) {
        //
        //Prevent the form from re
        // event.preventDefault();
        //
        //Check user credentials,if they are valid,submit them for authentication
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
        //
        //Call the callback function if it was defined
        on_success ? on_success() : null;
        return;
    }
    //
    // Gather and validate user credentials based on the selected operation
    #get_credentials() {
        //
        //Get the registration form on the page
        const form = document.querySelector("form");
        //
        //Get the selected option (sign_up,login,reset_password,change_password)
        const radio_choice = form.querySelector("input[name=choice]:checked");
        //
        //Show an error message if no operation is selected
        if (!radio_choice) {
            this.#show_error("Please select an option");
            return undefined;
        }
        //
        //Get the choice from the selected option
        const choice = radio_choice.value;
        //
        //Get the fielset with the same name as the choice made
        const field_set = document.getElementById(choice);
        //
        //validate that all required fields have inputs
        if (!this.#validate_required_fields(field_set))
            return undefined;
        //
        //Get the name of the user,name is required in all options
        const name = field_set.querySelector("input[type=text]");
        //
        //Add the choice and name to the credentials
        const credentials = {
            operation: choice,
            name: name.value,
        };
        //
        //Use a switch to collect the required fields for each option
        switch (choice) {
            case "login": {
                //
                //get the password for login
                const passwordInput = field_set.querySelector("input[type=password]");
                //
                //Add the password to the credentials
                credentials.password = passwordInput.value;
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
                //Check if the passwords match
                if (passwords[0].value !== passwords[1].value) {
                    const errorSpan = passwords[1]
                        .closest("label")
                        ?.querySelector(".error");
                    //
                    //show an error if the password do not match
                    errorSpan.textContent = "Passwords do not match";
                    return undefined;
                }
                //
                //Add the email and password to the credentials
                credentials.email = email.value;
                credentials.password = passwords[0].value;
                break;
            }
            //
            //Get the inputs for resetting a users password when they forget theirs
            case "forgot": {
                //
                //Get the email
                const email = field_set.querySelector("input[type=email]");
                //
                //Add the email to the credentials
                credentials.email = email.value;
                break;
            }
            case "change": {
                //
                //Get the password fields,old password,new password and confirm password
                const passwords = field_set.querySelectorAll("input[type=password]");
                //
                //Check if the new passwords match
                if (passwords[1].value !== passwords[2].value) {
                    const errorSpan = passwords[2]
                        .closest("label")
                        ?.querySelector(".error");
                    //
                    //report the error is the passwors dont match
                    errorSpan.textContent = "Passwords do not match";
                    return undefined;
                }
                //
                //Add the passwords to the credentials
                credentials.password = passwords[0].value;
                credentials.new_password = passwords[1].value;
                break;
            }
            //
            //if no operation is selcted,show an error message on the form
            default:
                this.#show_error("Please choose an operation");
                return undefined;
        }
        //
        //return the credentials
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
        let is_valid = true;
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
                is_valid = false;
            }
        });
        //
        //return the checker
        return is_valid;
    }
    //
    // Log in an existing user by verifying credentials
    async #login(credentials) {
        //
        //Check if a user with the current name exists
        const current_user = await this.#check_user(credentials.name);
        if (!current_user) {
            this.#show_error("User does not exist");
            return;
        }
        //
        //Verify the current users password
        if (await this.exec_php("mutall", [], "password_verify", [
            credentials.password,
            current_user.password,
        ])) {
            //
            //Set the the current user to the fetched user
            const cur_user = new user(current_user.name, current_user.user);
            return cur_user;
        }
        //
        //show an error if the credentials dont match
        this.#show_error("Credentials do not match");
        return;
    }
    //
    // Register a new user in the system with provided credentials
    async #register_user(credentials) {
        //
        //Check if a user with the same name exists
        const current_user = await this.#check_user(credentials.name);
        if (current_user) {
            this.#show_error("User already exists");
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
        if (response === "ok") {
            const current_user = await this.#check_user(credentials.name);
            const cur_user = new user(current_user.name, current_user.user);
            return cur_user;
        }
        //
        //show an error if registration fails
        this.#show_error("Registration failed");
        return;
    }
    //
    // Reset a user’s password for 'forgot' or 'change' operations
    async #reset_password(credentials) {
        //
        //Check if the user exists
        const current_user = await this.#check_user(credentials.name);
        //
        //Authenticate their password
        //
        if (current_user) {
            if (credentials.operation === "change") {
                //
                //authenticate their old password
                if (await this.exec_php("mutall", [], "password_verify", [
                    credentials.password,
                    current_user.password,
                ])) {
                    //
                    //Set their password to their new password
                    await this.#update_password(credentials.name, credentials.new_password);
                    this.#show_error("Password reset");
                    //
                    //create a user instance
                    const cur_user = new user(current_user.name, current_user.user);
                    return cur_user;
                }
                //
                //if their old password is wrong
                this.#show_error("Credentials dont match");
                return;
            }
            //
            //Set their password to a shared password
            await this.#update_password(credentials.name, "shared_password");
            this.#show_error("Password reset to default");
            //
            //create a user instance
            const cur_user = new user(current_user.name, current_user.user);
            return cur_user;
        }
        this.#show_error("User not found");
        return;
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
    #show_error(error) {
        //
        //get the error span for general error reporting on the form
        const error_elem = document.getElementById("form_error");
        //
        //show the error
        error_elem.textContent = error;
    }
}
