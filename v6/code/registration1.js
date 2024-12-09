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
            const input = this.query_selector(`#${label.id} input`);
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
                    // Get the error span element in that label section
                    const error_span = this.query_selector(`#${label_section.id} span.error`);
                    //
                    // Clear the error message in the error span
                    error_span.textContent = "";
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
    #check_inputs(credentials) {
        //
        // Perform operation-specific input collection and validation
        //
        //check all the fields in the section
        switch (credentials.operation) {
            case "login":
                return this.#check_login(credentials);
            case "sign_up":
                return this.#check_sign_up(credentials);
            case "forgot":
                return this.#check_forgot(credentials);
            case "change":
                return this.#check_change(credentials);
            default:
                throw new mutall_error(`Operation not supported`);
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
        const radio_choice = (this.query_selector("input[name='choice']:checked"));
        //
        // Get the selected operation (login, sign_up, forgot, change)
        const choice = radio_choice.value;
        return choice;
    }
    //
    // Method to set an error message for a specific field
    // Takes the field's selector and the error message as parameters
    #set_error_message(field_id, error_message) {
        //
        // Find the error span element associated with the input field
        const errorSpan = this.query_selector(`${field_id} span.error`);
        //
        // Set the text content of the error span to display the error message
        errorSpan.textContent = error_message;
    }
    //
    // Method to check if a field is empty and set an error if it is
    // Takes the field's value and its selector as parameters
    #input_not_empty(fieldValue, field_id) {
        //
        // Check if the field value is an empty string
        if (fieldValue === "") {
            //
            // If empty, call setFieldError to display a "required" message
            this.#set_error_message(field_id, "This field is required");
            //
            // Return false to indicate validation failure
            return false;
        }
        //
        // Return true if the field is not empty
        return true;
    }
    //
    // Validate login credentials
    #check_login(credentials) {
        //
        // Confirm the operation is login
        if (credentials.operation !== "login") {
            return false;
        }
        //
        // Validate name field by checking whether or not they are empty
        // Passes the name value and the selector for the name input's error span
        if (!this.#input_not_empty(credentials.name, "#login_name"))
            return false;
        //
        // Validate password field by checking whether or not they are empty
        // Passes the password value and the selector for the password input's error span
        return this.#input_not_empty(credentials.password, "#login_password");
    }
    //
    // Validate sign up details with comprehensive checks
    #check_sign_up(credentials) {
        //
        // Confirm the operation is sign up
        if (credentials.operation !== "sign_up") {
            return false;
        }
        //
        // Validate each input field by checking whether or not they are empty
        // Check the name, email, password, and confirm password fields
        if (!this.#input_not_empty(credentials.name, "#sign_up_name"))
            return false;
        //
        if (!this.#input_not_empty(credentials.email, "#sign_up_email"))
            return false;
        //
        if (!this.#input_not_empty(credentials.password, "#sign_up_password"))
            return false;
        //
        if (!this.#input_not_empty(credentials.confirm_password, "#sign_up_confirm"))
            return false;
        //
        // Check to ensure passwords match
        // Only perform this check if both password fields are non-empty
        const passwords_match = credentials.password === credentials.confirm_password;
        //
        // If the passwords do not match, show an error message
        if (!passwords_match) {
            this.#set_error_message("#sign_up_password", "Passwords do not match");
            this.#set_error_message("#sign_up_confirm", "Passwords do not match");
            return false;
        }
        return true;
    }
    //
    // Validate forgot password details
    #check_forgot(credentials) {
        //
        // Confirm the operation is forgot password
        if (credentials.operation !== "forgot") {
            return false;
        }
        //
        // Validate name and email fields by checking whether or not they are empty
        if (!this.#input_not_empty(credentials.name, "#forgot_name"))
            return false;
        //
        // Validate email field
        return this.#input_not_empty(credentials.email, "#forgot_email");
    }
    //
    // Validate change password details with comprehensive checks
    #check_change(credentials) {
        //
        // Confirm the operation is change password
        if (credentials.operation !== "change") {
            return false;
        }
        //
        // Validate each input field by checking whether or not they are empty
        // Check the name, old password, new password, and confirm password fields
        if (!this.#input_not_empty(credentials.name, "#change_name"))
            return false;
        //
        if (!this.#input_not_empty(credentials.old_password, "#change_old_password"))
            return false;
        //
        if (!this.#input_not_empty(credentials.new_password, "#change_new_password"))
            return false;
        //
        if (!this.#input_not_empty(credentials.confirm_password, "#change_confirm_password"))
            return false;
        //
        // Check to ensure new passwords match
        // Only perform this check if both new password fields are non-empty
        const passwords_match = credentials.new_password === credentials.confirm_password;
        //
        // If the passwords do not match, show an error message
        if (!passwords_match) {
            this.#set_error_message("#change_new_password", "Passwords do not match");
            this.#set_error_message("#change_confirm_password", "Passwords do not match");
            return false;
        }
        return true;
    }
    //
    // Collect the login credentials
    #get_login() {
        //
        // Collect the name component of the login credentials
        const name = (this.query_selector("#login_name input[type=text]"));
        //
        // Get the password input field
        const password = (this.query_selector("#login_password input[type=password]"));
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
        const name = (this.query_selector("#sign_up_name input[type=text]"));
        //
        // Get the email and password input fields
        const email = (this.query_selector("#sign_up_email input[type=email]"));
        //
        //get the password through the label
        //
        //get the password field
        const password = (this.query_selector('#sign_up_password input[type="password"]'));
        //
        //get the confirm password through the label
        const confirm_password = (this.query_selector("#sign_up_confirm input[type='password']"));
        //
        // Return the sign up credentials
        return {
            operation: "sign_up",
            name: name.value,
            email: email.value,
            password: password.value,
            confirm_password: confirm_password.value,
        };
    }
    //
    // Handle forgot password credentials extraction
    #get_forgot() {
        //
        // Collect the name component of the forgot password credentials
        const name = (this.query_selector("#forgot_name input[type=text]"));
        //
        // Get the email input field
        const email = (this.query_selector("#forgot_email input[type=email]"));
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
        const name = (this.query_selector("#change_name input[type=text]"));
        //
        //get the password field
        const old_password = (this.query_selector('#change_old_password input[type="password"]'));
        //
        //get the password field
        const new_password = (this.query_selector('#change_new_password input[type="password"]'));
        //
        //get the password field
        const confirm_password = (this.query_selector('#change_confirm_password input[type="password"]'));
        //
        //return the credentials for changing password
        return {
            operation: "change",
            name: name.value,
            old_password: old_password.value,
            new_password: new_password.value,
            confirm_password: confirm_password.value,
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
        // Collect and return the credentials
        const credentials = this.#get_inputs();
        //
        // Check the form inputs returning the section that represents the
        // current operation
        const inputs_valid = this.#check_inputs(credentials);
        //
        // Discontinue the process if there are errors
        if (!inputs_valid)
            return;
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
        //
        //If the user does not exist,show an error message
        if (!current_user) {
            //
            this.#set_error_message("#login_name", "Username does not match password");
            //
            this.#set_error_message("#login_password", "Password does not match username");
            return;
        }
        //
        //Verify the current users password
        const isPasswordVerified = await this.exec_php("mutall", [], "password_verify", [credentials.password, current_user.password]);
        //
        //If the password does not match the user name, show an error message
        if (!isPasswordVerified) {
            //
            //get the error span for the user name
            this.#set_error_message("#login_name", "User name does not match password");
            //
            this.#set_error_message("#login_password", "Password does not match user name");
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
        //
        //If the user already exists,show an error message
        if (current_user) {
            //
            this.#set_error_message("#sign_up_name", "User already exists");
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
            this.#set_error_message("#sign_up_name", "Registration failed");
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
        //
        // If the user does not exist, show an error message
        if (!current_user) {
            //
            this.#set_error_message("#forgot_name", "Username does not match email");
            //
            this.#set_error_message("#forgot_email", "Email does not match username");
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
        //
        // Check if the user exists
        const current_user = await this.#check_user(credentials.name);
        //
        // If the user does not exist, show an error message
        if (!current_user) {
            //
            this.#set_error_message("#change_name", "Username does not match password");
            //
            this.#set_error_message("#change_old_password", "Password does not match username");
            return;
        }
        // Authenticate old password
        const isPasswordVerified = await this.exec_php("mutall", [], "password_verify", [credentials.old_password, current_user.password]);
        //
        // If the password does not match the username, show an error message
        if (!isPasswordVerified) {
            //
            this.#set_error_message("#change_name", "Username does not match password");
            //
            this.#set_error_message("#change_old_password", "Password does not match username");
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
