import { view } from "../../../schema/v/code/schema.js";
import { exec } from "../../../schema/v/code/server.js";
//
// Custom authentication (login, sign_up, and forgot password) for mutall
export class auth extends view {
    //
    //Create te constrctor of the class,adding the constructor of its parent class
    constructor() {
        super();
    }
    //
    // Initialize event listeners
    init() {
        //
        //Get the registration form on the page
        const form = document.querySelector("form");
        //
        //Add a submit event to the form
        form.addEventListener("submit", (e) => this.submit(e, form));
        this.#clear_errors_on_input(form);
    }
    //
    // Collect inputs on form submission
    submit(event, form) {
        event.preventDefault();
        //
        //Get the selected option (sign_up,login,reset_password,change_password)
        const radio_choice = form.querySelector("input[name=choice]:checked");
        if (!radio_choice) {
            alert("Please select an option");
            return;
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
            return;
        //
        //Get te name of the user,required in all options
        const name = field_set.querySelector("input[type=text]");
        //
        //Add the choice and name to the credentials
        const credentials = {
            operation: choice,
            name: name.value,
        };
        //
        //USe a switch to collect the required fields for each option
        switch (choice) {
            case "login": {
                //
                //get the password for login
                const passwordInput = field_set.querySelector("input[type=password]");
                //
                //Add the password to the credentials
                credentials.password = passwordInput.value;
                //
                //Authenticate the user for login or not
                this.#authenticate_user(credentials);
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
                //Ceck if the password match
                if (passwords[0].value !== passwords[1].value) {
                    const errorSpan = passwords[1]
                        .closest("label")
                        ?.querySelector(".error");
                    errorSpan.textContent = "Passwords do not match";
                    return;
                }
                //
                //Add the email and password to the credentials
                credentials.email = email.value;
                credentials.password = passwords[0].value;
                //
                //Register the new user
                this.#register_user(credentials);
                break;
            }
            case "forgot": {
                //
                //Get the inputs for resetting a users password when the forget theirs
                //
                //Get the email
                const email = field_set.querySelector("input[type=email]");
                //
                //Add the email to the credentials
                credentials.email = email.value;
                //
                //Reset the users password
                this.#reset_password(credentials.email);
                break;
            }
            default:
                alert("Please choose an operation");
        }
    }
    //
    // Ceck if all required fields have an input
    #validate_required_fields(fieldset) {
        //
        //Get all the inputs in the fieldset
        const inputs = fieldset.querySelectorAll('input:not([type="radio"])');
        //
        //set a checker to true assuming the input is provided
        let is_valid = true;
        //
        //Iterate throug each input to check if a input has been proveided
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
    // Clear all errors on the form when an input is made
    #clear_errors_on_input(form) {
        //
        //add an event listener to the form for inputs
        form.addEventListener("input", () => {
            //
            //Get all the error elements
            const errorSpans = form.querySelectorAll(".error");
            //
            //Clear any error messages on the error elements
            errorSpans.forEach((span) => (span.textContent = ""));
        });
    }
    //
    //Use the exec function to verify is the users input password is correct
    async #password_verify(submited_password, db_password) {
        //
        //Await the password verification and return a boolean
        return await exec("mutall", [], "password_verify", [
            submited_password,
            db_password,
        ]);
    }
    //
    //Hash the new password
    async #password_hash(password) {
        //
        // Await  a hashed password
        return await exec("mutall", [], "password_hash", [password]);
    }
    // Authenticate user for login
    async #authenticate_user(credentials) {
        //
        //Check if a user with the current name exists
        const user = await this.#check_user(credentials.name);
        if (!user) {
            alert("User does not exist");
            return;
        }
        //
        //Verify the current users password
        if (await this.#password_verify(credentials.password, user.password)) {
            //
            //Create a session for the existing user
            await this.#create_session(user);
            alert("Login successful");
        }
        else {
            alert("Credentials do not match");
        }
    }
    //
    // Register a new user
    async #register_user(credentials) {
        //
        //Check if a user with the same name exists
        const user = await this.#check_user(credentials.name);
        if (user) {
            alert("User already exists");
            return;
        }
        //
        //Hash the new users password before storing it
        const hashed_password = await this.#password_hash(credentials.password);
        //
        //Create a layout with the new users information
        const layout = [
            [hashed_password, "user", "password"],
            [credentials.name, "user", "name"],
            [credentials.email, "user", "email"],
        ];
        //
        //Save the new user to the database suing the exec method
        const response = await super.exec_php("questionnaire", ["mutall_users"], "load_common", [layout]);
        //
        //Return a response to the user
        if (response === "ok") {
            alert("Registration successful");
        }
        else {
            alert("Registration failed");
        }
    }
    //
    // reset a users password whe they forget their password to the shared password
    async #reset_password(email) {
        //
        //Check if the user exists
        const user = await this.#check_user(email);
        if (user) {
            //
            //Set their password to a shared password
            await this.#update_password("shared_password");
            alert("Password reset to default");
        }
        else {
            alert("User not found");
        }
    }
    //
    // Check if the user exists
    async #check_user(name) {
        //
        //query to get their name,password and email
        const sql = `SELECT user.name, user.password, user.email FROM user WHERE name = '${name}'`;
        //
        //Execute the query
        const user = await super.exec_php("database", ["mutall_users", false], "get_sql_data", [sql]);
        //
        //return a user or null if they dont exist
        return user ? user[0] : null;
    }
    //
    // Create a session for a logged in user
    async #create_session(user) {
        //
        //Set the users name and email
        const session = {
            name: user.name,
            email: user.email,
        };
        //
        //Save the user to local strorage
        localStorage.setItem("session", JSON.stringify(session));
    }
    //
    // Update a users pasword
    async #update_password(new_password) {
        //
        //Hash the password before storing it
        const hashed_password = await this.#password_hash(new_password);
        //
        //Create a layout to save the new password to the database
        const layout = [[hashed_password, "user", "password"]];
        //
        //Save the new password to the db using the exec method
        await super.exec_php("questionnaire", ["mutall_users"], "load_common", [
            layout,
        ]);
    }
    //
    //Logout the current user by destroying their session
    async logout() {
        //
        //Remove the session from local storage
        localStorage.removeItem("session");
        //
        //Redirect to login page
        window.location.href = "login page";
    }
    //
    //Check if a user is currently logged in
    current_user() {
        //
        //Get the session from local storage
        const session = localStorage.getItem("session");
        //
        //return the session or null
        return session ? JSON.parse(session) : null;
    }
}
