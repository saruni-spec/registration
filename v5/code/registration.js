import { mutall_error, view } from "../../../schema/v/code/schema.js";
import { user } from "../../../outlook/v/code/app.js";
//
// Custom authentication (login, sign_up, and forgot password) for mutall
// Allows a user to register,login,change their password and logout out
// Keeps track of the logged in user for further reference in other contexts
export class auth extends view {
    //
    //This key is used for saving the user creadentials to local storage
    static user_key = "credentials_of_loggedin_user";
    //
    //Declare a user property
    user;
    //
    // This is the current section
    section;
    //
    //Create the constrctor of the class,adding the constructor of its parent class
    constructor() {
        super();
    }
    clear_errors() {
        // Get the selected fieldset
        const selected_fieldset = this.#get_section();
        // Clear errors on input change in the selected fieldset
        // Get all the label sections in the selected fieldset (excluding radio labels)
        const label_sections = selected_fieldset.querySelectorAll("label:not(.radio)");
        label_sections.forEach((label) => {
            // Get the input element in this label section
            const input = label.querySelector("input");
            if (!input)
                throw new mutall_error("input element is missing");
            // Add listeners to the inputs in the selected fieldset
            input.addEventListener("input", (event) => {
                // Get the error span for the input
                const error_span = label.querySelector(".error");
                // Clear the error message in the error span
                if (error_span)
                    error_span.textContent = "";
            });
        });
        // Define the sections to check
        const sections = ["login", "sign_up", "forgot", "change"];
        // Iterate through sections and clear errors if not selected
        sections.forEach((section_name) => {
            //
            // Get the section element
            const section = this.get_element(section_name);
            //
            // If this section is not the selected one, clear its errors
            if (section && section !== selected_fieldset) {
                //
                // Get all label sections that are not radio buttons
                const label_sections = section.querySelectorAll("label:not(.radio)");
                //
                // Clear the errors for each input
                label_sections.forEach((label_section) => {
                    //
                    // Get the input in the label section
                    const input = label_section.querySelector("input");
                    //
                    // Get the error span element in that label section
                    const error_span = label_section.querySelector(".error");
                    //
                    // Clear the error message in the error span
                    if (error_span) {
                        error_span.textContent = "";
                    }
                    //
                    // Reset the input value if needed
                    if (input) {
                        input.value = "";
                    }
                });
            }
        });
    }
    //
    // Collect and submit user credentials for authentication
    // then save the user to local storage until they log out.
    // On logout,we'll clear the local storage
    async submit(event) {
        //
        // Do not refresh the form on submit so that error messages can
        // be seen
        event.preventDefault();
        //
        //Set the current section
        //
        //Get the relevant section that has the inputs
        this.section = this.#get_section();
        //
        //Check and get user credentials,if they are valid,submit them for authentication
        //Otherwise,we abort the submission
        const inps = this.#get_credentials();
        //
        //Abort the submission if the credentials are not defined
        if (!inps)
            return;
        //
        // Use the credentials to authenticate the user.
        // If not successful,abort the submission
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
        localStorage.setItem(auth.user_key, JSON.stringify({ name: user.name, key: user.pk }));
        //
    }
    //
    // Check inputs and report all potential errors
    // Performs comprehensive validation on the inputs to check any errors
    #check_inputs() {
        //
        // Perform operation-specific input collection and validation
        //
        //check all the fields in the section
        switch (this.section.id) {
            case "login":
                return this.#check_login();
            case "sign_up":
                return this.#check_sign_up();
            case "forgot":
                return this.#check_forgot();
            case "change":
                return this.#check_change();
            default:
                throw new mutall_error(`This sction id:${this.section.id} is not an opration id`);
        }
    }
    //
    //
    #get_section() {
        //
        //get the selected operation
        const choice = this.#get_operation_id(document);
        //
        // Find the fieldset corresponding to the selected operation
        const field_set = this.get_element(choice);
        this.section = field_set;
        return field_set;
    }
    //
    //Get the operation id from the selected radio button on the form
    #get_operation_id(document) {
        //
        // Find the selected radio button for the authentication operation
        const radio_choice = document.querySelector("input[name='choice']:checked");
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
    // The name and password fields should each have an input value
    #check_login() {
        //
        //get the name input field
        const name = this.section.querySelector("input[type='text']");
        //
        //check if the name input is present
        if (!name)
            throw new mutall_error("name input for login not present");
        //
        //if the value of the input is an empty string set the checker to false
        if (name.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = name.nextElementSibling;
            errospan.textContent = "This field is required";
            return false;
        }
        //
        //get the password input field
        const password = this.section.querySelector("input[type='password']");
        //
        //check if the name input is present
        if (!password)
            throw new mutall_error("name input for login not present");
        //
        //if the value of the input is an empty string set the checker to false
        if (password.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = password.nextElementSibling;
            errospan.textContent = "This field is required";
            return false;
        }
        return true;
    }
    // Check sign up details with password validation
    #check_sign_up() {
        //
        //check if all sign_up fields have a value and report the error if an input
        // is missing
        //
        //get the name input field
        const name = this.section.querySelector("input[type='text']");
        //
        //check if the name input is present
        if (!name)
            throw new mutall_error("name input for sign up not present");
        //
        //if the value of the input is an empty string set the checker to false
        if (name.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = name.nextElementSibling;
            errospan.textContent = "This field is required";
            return false;
        }
        //
        //get the email input field then check if it has an input
        //
        //get the name input field
        const email = this.section.querySelector("input[type='email']");
        //
        //check if the email input is present
        if (!email)
            throw new mutall_error("email input for sign up not present");
        //
        //if the value of the input is an empty string set the checker to false
        if (email.value.trim() === "") {
            //
            //get the error span after to the email input element
            const errospan = email.nextElementSibling;
            errospan.textContent = "This field is required";
            return false;
        }
        //
        //get the password through the label
        //
        //css selector to get the password field
        const css = '#sign_up_password input[type="password"]';
        //
        //get the password field
        const password = this.section.querySelector(css);
        if (!password)
            throw new mutall_error("password field is missing");
        //
        //check if the password field has an input
        if (password.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = password.nextElementSibling;
            errospan.textContent = "This field is required";
            return false;
        }
        //
        //get the password through the label
        //
        //css selector to get the password field
        const confirm_css = '#sign_up_confirm input[type="password"]';
        //
        //get the password field
        const confirm_password = this.section.querySelector(confirm_css);
        if (!confirm_password)
            throw new mutall_error("confirm password field is missing");
        //
        if (confirm_password.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = (confirm_password.nextElementSibling);
            errospan.textContent = "This field is required";
            return false;
        }
        // Check if password and confirm password match
        if (password.value !== confirm_password.value) {
            //
            // Find the error span to display mismatch message
            const password_error = password.nextElementSibling;
            if (!password_error)
                throw new mutall_error("password error is missing");
            //
            //get the confirm password error span
            const confirm_error = confirm_password.nextElementSibling;
            if (!confirm_error)
                throw new mutall_error("confirm password error is missing");
            //
            // Show error if passwords do not match
            password_error.textContent = "Passwords do not match";
            confirm_error.textContent = "Passwords do not match";
            return false;
        }
        return true;
    }
    //
    // Check forgot password details
    #check_forgot() {
        //
        //check if all forgot password fields have a value and report the error if an input
        // is missing
        //
        //get the name input field
        const name = this.section.querySelector("input[type='text']");
        //
        //check if the name input is present
        if (!name)
            throw new mutall_error("name input for sign up not present");
        //
        //if the value of the input is an empty string set the checker to false
        if (name.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = name.nextElementSibling;
            errospan.textContent = "This field is required";
            return false;
        }
        //
        //get the email input field then check if it has an input
        //
        //get the name input field
        const email = this.section.querySelector("input[type='email']");
        //
        //check if the email input is present
        if (!email)
            throw new mutall_error("email input for sign up not present");
        //
        //if the value of the input is an empty string set the checker to false
        if (email.value.trim() === "") {
            //
            //get the error span after to the email input element
            const errospan = email.nextElementSibling;
            errospan.textContent = "This field is required";
            return false;
        }
        return true;
    }
    //
    // Check change password details with validation
    #check_change() {
        //
        //check if all change password fields have a value and report the error if an input
        // is missing
        //
        //get the name input field
        const name = this.section.querySelector("input[type='text']");
        //
        //check if the name input is present
        if (!name)
            throw new mutall_error("name input for sign up not present");
        //
        //if the value of the input is an empty string set the checker to false
        if (name.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = name.nextElementSibling;
            errospan.textContent = "This field is required";
            return false;
        }
        //
        //Collect the passwords
        //
        //css selector to get the password field
        const css = '#change_old_password input[type="password"]';
        console.log(this.section);
        //
        //get the password field
        const old_password = this.section.querySelector(css);
        if (!old_password)
            throw new mutall_error("old_password field is missing");
        //
        //check if the old_password field has an input
        if (old_password.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = (old_password.nextElementSibling);
            errospan.textContent = "This field is required";
            return false;
        }
        //
        //css selector to get the password field
        const new_password_css = '#change_new_password input[type="password"]';
        //
        //get the password field
        const new_password = this.section.querySelector(new_password_css);
        if (!new_password)
            throw new mutall_error("password field is missing");
        //
        //check if the password field has an input
        if (new_password.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = (new_password.nextElementSibling);
            errospan.textContent = "This field is required";
            return false;
        }
        //
        //get the password through the label
        //
        //css selector to get the password field
        const confirm_css = '#change_confirm_password input[type="password"]';
        //
        //get the password field
        const confirm_password = this.section.querySelector(confirm_css);
        if (!confirm_password)
            throw new mutall_error("confirm password field is missing");
        //
        if (confirm_password.value.trim() === "") {
            //
            //get the error span after to the name input element
            const errospan = (confirm_password.nextElementSibling);
            errospan.textContent = "This field is required";
            return false;
        }
        // Check if password and confirm password match
        if (new_password.value !== confirm_password.value) {
            //
            // Find the error span to display mismatch message
            const password_error = new_password.nextElementSibling;
            if (!password_error)
                throw new mutall_error("password error is missing");
            //
            //get the confirm password error span
            const confirm_error = confirm_password.nextElementSibling;
            if (!confirm_error)
                throw new mutall_error("confirm password error is missing");
            //
            // Show error if passwords do not match
            password_error.textContent = "Passwords do not match";
            confirm_error.textContent = "Passwords do not match";
            return false;
        }
        return true;
    }
    //
    // Collect the login credentials
    #get_login() {
        //
        // Collect the name component of the login credentials
        const name = this.section.querySelector("input[type=text]");
        //
        // If the name input does not exist,alert the programmer
        if (!name)
            throw new mutall_error("name element does not exist");
        //
        // Get the password input field
        const password = this.section.querySelector("input[type=password]");
        //
        // If there is no password field,alert the programmer
        if (!password)
            throw new mutall_error("password element does not exist");
        //
        // Return the login credentials
        return {
            operation: "login",
            name: name.value,
            password: password.value,
        };
    }
    //
    // Handle sign up credentials extraction
    #get_sign_up() {
        //
        // Collect the name component of the sign up credentials
        const name = this.section.querySelector("input[type=text]");
        //
        // If the name input does not exist,alert the programmer
        if (!name)
            throw new mutall_error("name element does not exist");
        //
        // Get the email and password input fields
        const email = this.section.querySelector("input[type=email]");
        if (!email)
            throw new mutall_error("email element does not exist");
        //
        //get the password through the label
        //
        //css selector to get the password field
        const css = '#sign_up_password input[type="password"]';
        //
        //get the password field
        const password = this.section.querySelector(css);
        if (!password)
            throw new mutall_error("password field is missing");
        //
        // Return the sign up credentials
        return {
            operation: "sign_up",
            name: name.value,
            email: email.value,
            password: password.value,
        };
    }
    //
    // Handle forgot password credentials extraction
    #get_forgot() {
        //
        // Collect the name component of the forgot password credentials
        const name = this.section.querySelector("input[type=text]");
        //
        // If the name input does not exist,alert the programmer
        if (!name)
            throw new mutall_error("name element does not exist");
        //
        // Get the email input field
        const email = this.section.querySelector("input[type=email]");
        if (!email)
            throw new mutall_error("email element for forgot section is missing");
        //
        //return the credentials for forgot password
        return {
            operation: "forgot",
            name: name.value,
            email: email.value,
        };
    }
    //
    // Handle change password credentials extraction
    #get_change() {
        //
        // Collect the name component of the change password credentials
        const name = this.section.querySelector("input[type=text]");
        //
        // If the name input does not exist,alert the programmer
        if (!name)
            throw new mutall_error("name element does not exist");
        //
        //css selector to get the password field
        const password_css = '#change_old_password input[type="password"]';
        //
        //get the password field
        const password = this.section.querySelector(password_css);
        if (!password)
            throw new mutall_error("password field is missing");
        //
        //css selector to get the new password field
        const cp_css = '#change_new_password input[type="password"]';
        //
        //get the password field
        const new_password = this.section.querySelector(cp_css);
        if (!new_password)
            throw new mutall_error("password field is missing");
        return {
            operation: "change",
            name: name.value,
            password: password.value,
            new_password: new_password.value,
        };
    }
    //
    // Collect the credentials based on the current operation
    // The validated inputs are in the form section under the given fieldset
    #get_inputs() {
        //
        // Get the current operation
        const operation = this.section.id;
        //
        //Call the appropriate method to get the credentials based on the operation
        switch (operation) {
            case "login":
                //
                // Collect and return the login credentials
                return this.#get_login();
            case "sign_up":
                //
                // Collect and return the sign_up credentials
                return this.#get_sign_up();
            case "forgot":
                //
                // Collect and return the forgot password credentials
                return this.#get_forgot();
            case "change":
                //
                // Collect and return the change password credentials
                return this.#get_change();
            default:
                throw new mutall_error(`Unsupported operation: ${operation}`);
        }
    }
    //
    // Main method to get credentials
    // Combines input checking and credentials collections
    #get_credentials() {
        //
        // Check the form inputs returning the section that represents the
        // current operation
        const inputs_valid = this.#check_inputs();
        //
        // Discontinue the process if there are errors
        if (!inputs_valid)
            return undefined;
        //
        // Collect and return the credentials
        const credentials = this.#get_inputs();
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
                return this.#forgot_password(credentials);
            }
            case "change": {
                //
                //Change the user's password to their new password
                return this.#change_password(credentials);
            }
            default:
                return;
        }
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
            //get the error span for the user name
            const error_span = this.section.querySelector(`#login_name span.error`);
            if (!error_span)
                throw new mutall_error(`Error span for User name is missing`);
            error_span.textContent = "Username does not match password";
            //
            //get the error span for the password
            const password_error_span = this.section.querySelector(`#login_password span.error`);
            if (!password_error_span)
                throw new mutall_error(`Error span for password is missing`);
            password_error_span.textContent = "Password does not match username";
            return;
        }
        //
        //Verify the current users password
        const isPasswordVerified = await this.exec_php("mutall", [], "password_verify", [credentials.password, current_user.password]);
        if (!isPasswordVerified) {
            //
            //get the error span for the user name
            const error_span = this.section.querySelector(`#login_name span.error`);
            if (!error_span)
                throw new mutall_error(`Error span for User name is missing`);
            error_span.textContent = "Username does not match password";
            //
            //get the error span for the password
            const password_error_span = this.section.querySelector(`#login_password span.error`);
            if (!password_error_span)
                throw new mutall_error(`Error span for password is missing`);
            password_error_span.textContent = "Password does not match username";
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
            //
            //get the error span for the user name
            const error_span = this.section.querySelector(`#sign_up_name span.error`);
            if (!error_span)
                throw new mutall_error(`Error span for User name is missing`);
            error_span.textContent = "User already exists";
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
            //
            //get the error span for the user name
            const error_span = this.section.querySelector(`#sign_up_name span.error`);
            if (!error_span)
                throw new mutall_error(`Error span for User name is missing`);
            error_span.textContent = "Registration Failed.Try again";
            return;
        }
        const new_user = await this.#check_user(credentials.name);
        const cur_user = new user(new_user.name, new_user.user);
        return cur_user;
    }
    // Function for forgot password operation
    async #forgot_password(credentials) {
        //
        // Check if the user exists
        const current_user = await this.#check_user(credentials.name);
        if (!current_user) {
            //
            //get the error span for the user name
            const error_span = this.section.querySelector(`#forgot_name span.error`);
            if (!error_span)
                throw new mutall_error(`Error span for User name is missing`);
            error_span.textContent = "Username does not match email";
            //
            //get the error span for the email
            const email_error = this.section.querySelector(`#forgot_email span.error`);
            if (!email_error)
                throw new mutall_error(`Error span for email is missing`);
            email_error.textContent = "Email does not match username";
            return;
        }
        //
        // Set password to a shared/default password
        await this.#update_password(credentials.name, "shared_password");
        //
        // Create and return a user instance
        return new user(current_user.name, current_user.user);
    }
    // Function for changing password operation
    async #change_password(credentials) {
        //
        // Check if the operation is change
        if (credentials.operation !== "change") {
            return;
        }
        // Check if the user exists
        const current_user = await this.#check_user(credentials.name);
        if (!current_user) {
            //
            //get the error span for the user name
            const error_span = this.section.querySelector(`#change_name span.error`);
            if (!error_span)
                throw new mutall_error(`Error span for User name is missing`);
            error_span.textContent = "Username does not match password";
            //
            //get the error span for the password
            const password_error_span = this.section.querySelector(`#change_old_password span.error`);
            if (!password_error_span)
                throw new mutall_error(`Error span for new password is missing`);
            password_error_span.textContent = "Password does not match username";
            return;
        }
        // Authenticate old password
        const isPasswordVerified = await this.exec_php("mutall", [], "password_verify", [credentials.password, current_user.password]);
        if (!isPasswordVerified) {
            //
            //get the error span for the user name
            const error_span = this.section.querySelector(`#change_name span.error`);
            if (!error_span)
                throw new mutall_error(`Error span for User name is missing`);
            error_span.textContent = "Username does not match password";
            //
            //get the error span for the password
            const password_error_span = this.section.querySelector(`#change_old_password span.error`);
            if (!password_error_span)
                throw new mutall_error(`Error span for new password is missing`);
            password_error_span.textContent = "Password does not match username";
            return;
        }
        // Update to new password
        await this.#update_password(credentials.name, credentials.new_password);
        // Create and return a user instance
        return new user(current_user.name, current_user.user);
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
    // Log out the current user by clearing the memory and local storage
    async logout() {
        //
        //Remove the session from local storage
        localStorage.removeItem(auth.user_key);
        //
        //Clear the user from memory
        this.user = undefined;
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
        const session = localStorage.getItem(auth.user_key);
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
}
