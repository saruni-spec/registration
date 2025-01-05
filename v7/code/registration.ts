import { layout } from "../../../schema/v/code/questionnaire.js";
import { mutall_error, view } from "../../../schema/v/code/schema.js";
import { user } from "../../../outlook/v/code/app.js";
//
// Custom authentication (login, sign_up, and forgot password) for mutall
// Allows a user to register,login,change their password and logout out
// Keeps track of the logged in user for further reference in other contexts
export class auth extends view {
  //
  // This is the registration page
  public registration_page: string = "registration.html";
  //
  //This key is used for saving the user creadentials to local storage
  static user_key: string = "credentials_of_loggedin_user";
  //
  //Declare a user property
  public user?: user;
  //
  // This is the current section
  public section?: HTMLElement;
  //
  //Create the constrctor of the class,adding the constructor of its parent class
  constructor() {
    super();
  }
  clear_errors(): void {
    // Get the selected fieldset
    const selected_fieldset = this.#get_section();

    // Clear errors on input change in the selected fieldset
    // Get all the label sections in the selected fieldset (excluding radio labels)
    const label_sections =
      selected_fieldset.querySelectorAll("label:not(.radio)");
    label_sections.forEach((label) => {
      // Get the input element in this label section
      const input = <HTMLInputElement>this.query_selector(`#${label.id} input`);
      // Add listeners to the inputs in the selected fieldset
      input.addEventListener("input", (event) => {
        // Get the error span for the input
        const error_span: Element | null = label.querySelector(".error");

        // Clear the error message in the error span
        if (error_span) error_span.textContent = "";
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
          const error_span: Element = this.query_selector(
            `#${label_section.id} span.error`
          );
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
  async submit(event: Event): Promise<void> {
    //
    // Do not refresh the form on submit so that error messages can
    // be seen
    event.preventDefault();
    //
    //Get the relevant section that has the inputs
    this.section = this.#get_section();
    //
    //Check and get user credentials,if they are valid,submit them for authentication
    //Otherwise,we abort the submission
    const inps: credentials | undefined = this.#get_credentials();
    //
    //Abort the submission if the credentials are not defined
    if (!inps) return;
    //
    // Use the credentials to authenticate the user.
    // If not successful,abort the submission
    const user: user | undefined = await this.#authenticate_user(inps);
    //
    //If the authentication fails,abort the submission
    if (!user) return;
    //
    //Save the authenticated user for further reference to complete the submission
    this.user = user;
    console.log(this.user, "user");
    //
    //Save the user to local strorage
    localStorage.setItem(
      auth.user_key,
      JSON.stringify({ name: user.name, key: user.pk })
    );
    //
    //Get the previous page the user was on before logging in from local storage
    const previous_page = localStorage.getItem("previous_page");
    //
    //Redirect the user to the previous page they were on before logging in
    if (previous_page) {
      window.location.href = previous_page;
    }
  }

  //
  // Check inputs and report all potential errors
  // Performs comprehensive validation on the inputs to check any errors
  #check_inputs(credentials: credentials): boolean {
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
  #get_section(): HTMLElement {
    //
    //get the selected operation
    const choice: operation_id = this.#get_operation_id();
    //
    // Find the fieldset corresponding to the selected operation
    const field_set = this.get_element(choice);
    this.section = field_set;
    return field_set;
  }
  //
  //Get the operation id from the selected radio button on the form
  #get_operation_id(): operation_id {
    //
    // Find the selected radio button for the authentication operation
    const radio_choice = <HTMLInputElement>(
      this.query_selector("input[name='choice']:checked")
    );
    //
    // Get the selected operation (login, sign_up, forgot, change)
    const choice: string = radio_choice.value;
    return <operation_id>choice;
  }
  //
  // Method to set an error message for a specific field
  // Takes the field's selector and the error message as parameters
  set_error_message(field_id: string, error_message: string): void {
    //
    // Find the error span element associated with the input field
    let error_span: Element | null = document.querySelector(
      `${field_id} span.error`
    );
    //
    //Create a new error span if it does not exist
    if (!error_span) {
      //
      // Create a new span element
      error_span = document.createElement("span");
      //
      // Set the class of the new span element to "error"
      error_span.className = "error";
      //
      // Append the new span element to the field's label
      this.query_selector(field_id).appendChild(error_span);
    }
    //
    // Set the text content of the error span to display the error message
    error_span.textContent = error_message;
  }
  //
  // Method to check if a field is empty and set an error if it is
  // Takes the field's value and its selector as parameters
  #input_empty(field_value: string, field_id: string): boolean {
    //
    // Check if the field value is an empty string
    if (field_value === "") {
      //
      // If empty, call setFieldError to display a "required" message
      this.set_error_message(field_id, "This field is required");
      //
      // Return false to indicate that the field is empty
      return true;
    }
    //
    // Return true if the field has a value
    return false;
  }
  //
  //Check if an email is valid
  email_valid(email: string): boolean {
    //
    // \b                 - Ensure the email starts and ends as a whole word.
    // [A-Za-z0-9._%+-]+  - Matches one or more characters that can be uppercase/lowercase letters, digits, dots (.), underscores (_), percent signs (%), plus signs (+), or hyphens (-). This is the local part of the email (before the @).
    // @                 - Matches the @ symbol, separating the local part and domain of the email.
    // [A-Za-z0-9.-]+    - Matches one or more characters that can be uppercase/lowercase letters, digits, dots (.), or hyphens (-). This is the domain name.
    // \.                - Matches a literal dot (.) that separates the domain name and the top-level domain (TLD).
    // [A-Z|a-z]{2,}     - Matches 2 or more uppercase/lowercase letters, representing the top-level domain (e.g., .com, .org).
    // \b                - Ensure the email ends as a whole word.
    const valid_email = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

    return valid_email.test(email);
  }
  //
  // Validate login credentials
  #check_login(credentials: credentials): boolean {
    //
    // Confirm the operation is login
    if (credentials.operation !== "login") {
      return false;
    }
    //
    // Validate name field by checking whether or not they are empty
    // Passes the name value and the selector for the name input's error span
    if (credentials.name === "") {
      //
      // If empty, call setFieldError to display a "required" message
      this.set_error_message("#login_name", "This field is required");
      return false;
    }
    //
    // Validate password field by checking whether or not they are empty
    if (credentials.password === "") {
      //
      // If empty, call setFieldError to display a "required" message
      this.set_error_message("#login_password", "This field is required");
      return false;
    }
    return true;
  }
  //
  // Validate sign up details with comprehensive checks
  #check_sign_up(credentials: credentials): boolean {
    //
    // Confirm the operation is sign up
    if (credentials.operation !== "sign_up") {
      return false;
    }
    //
    // Validate each input field by checking whether or not they are empty
    // Check the name, email, password, and confirm password fields
    // Check the name field
    if (credentials.name === "") {
      //
      // If empty, display an error message
      this.set_error_message("#sign_up_name", "This field is required");
      return false;
    }
    //
    // Check the email field
    if (credentials.email === "") {
      //
      // If empty, display an error message
      this.set_error_message("#sign_up_email", "This field is required");
      return false;
    }
    //
    // Check if the email is valid
    if (!this.email_valid(credentials.email)) {
      //
      // If empty, display an error message
      this.set_error_message("#sign_up_email", "Invalid email");
      return false;
    }
    //
    // Check the password field
    if (credentials.password === "") {
      //
      // If empty, display an error message
      this.set_error_message("#sign_up_password", "This field is required");
      return false;
    }
    //
    // Check the confirm password field
    if (credentials.confirm_password === "") {
      //
      // If empty, display an error message
      this.set_error_message("#sign_up_confirm", "This field is required");
      return false;
    }
    //
    // Check to ensure passwords match
    // Only perform this check if both password fields are non-empty
    const passwords_match: boolean =
      credentials.password === credentials.confirm_password;
    //
    // If the passwords do not match, show an error message
    if (!passwords_match) {
      this.set_error_message("#sign_up_password", "Passwords do not match");
      this.set_error_message("#sign_up_confirm", "Passwords do not match");
      return false;
    }

    return true;
  }
  //
  // Validate forgot password details
  #check_forgot(credentials: credentials): boolean {
    //
    // Confirm the operation is forgot password
    if (credentials.operation !== "forgot") {
      return false;
    }
    //
    // Validate name and email fields by checking whether or not they are empty
    // Check the name field
    if (credentials.name === "") {
      //
      // If empty, display an error message
      this.set_error_message("#forgot_name", "This field is required");
      return false;
    }
    //
    // Validate email field
    if (credentials.email === "") {
      //
      // If empty, display an error message
      this.set_error_message("#forgot_email", "This field is required");
      return false;
    }
    //
    // Check if the email is valid
    if (!this.email_valid(credentials.email)) {
      //
      // If empty, display an error message
      this.set_error_message("#sign_up_email", "Invalid email");
      return false;
    }
    return true;
  }
  //
  // Validate change password details with comprehensive checks
  #check_change(credentials: credentials): boolean {
    //
    // Confirm the operation is change password
    if (credentials.operation !== "change") {
      return false;
    }
    //
    // Validate each input field by checking whether or not they are empty
    // Check the name, old password, new password, and confirm password fields
    // Check the name field
    if (credentials.name === "") {
      //
      // If empty, display an error message
      this.set_error_message("#change_name", "This field is required");
      return false;
    }
    //
    // Check the old password field
    if (credentials.old_password === "") {
      //
      // If empty, display an error message
      this.set_error_message("#change_old_password", "This field is required");
      return false;
    }
    //
    // Check the new password field
    if (credentials.new_password === "") {
      //
      // If empty, display an error message
      this.set_error_message("#change_new_password", "This field is required");
      return false;
    }
    //
    // Check the confirm password field
    if (credentials.confirm_password === "") {
      //
      // If empty, display an error message
      this.set_error_message(
        "#change_confirm_password",
        "This field is required"
      );
      return false;
    }
    //
    // Check to ensure new passwords match
    // Only perform this check if both new password fields are non-empty
    const passwords_match =
      credentials.new_password === credentials.confirm_password;
    //
    // If the passwords do not match, show an error message
    if (!passwords_match) {
      this.set_error_message("#change_new_password", "Passwords do not match");
      this.set_error_message(
        "#change_confirm_password",
        "Passwords do not match"
      );
      return false;
    }
    return true;
  }
  //
  // Collect the login credentials
  #get_login(): credentials {
    //
    // Collect the name component of the login credentials
    const name = <HTMLInputElement>(
      this.query_selector("#login_name input[type=text]")
    );
    //
    // Get the password input field
    const password = <HTMLInputElement>(
      this.query_selector("#login_password input[type=password]")
    );
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
  #get_sign_up(): credentials {
    //
    // Collect the name component of the sign up credentials
    const name = <HTMLInputElement>(
      this.query_selector("#sign_up_name input[type=text]")
    );
    //
    // Get the email and password input fields
    const email = <HTMLInputElement>(
      this.query_selector("#sign_up_email input[type=email]")
    );
    //
    //get the password through the label
    //
    //get the password field
    const password = <HTMLInputElement>(
      this.query_selector('#sign_up_password input[type="password"]')
    );
    //
    //get the confirm password through the label
    const confirm_password = <HTMLInputElement>(
      this.query_selector("#sign_up_confirm input[type='password']")
    );
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
  #get_forgot(): credentials {
    //
    // Collect the name component of the forgot password credentials
    const name = <HTMLInputElement>(
      this.query_selector("#forgot_name input[type=text]")
    );
    //
    // Get the email input field
    const email = <HTMLInputElement>(
      this.query_selector("#forgot_email input[type=email]")
    );
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
  #get_change(): credentials {
    //
    // Collect the name component of the change password credentials
    const name = <HTMLInputElement>(
      this.query_selector("#change_name input[type=text]")
    );
    //
    //get the password field
    const old_password = <HTMLInputElement>(
      this.query_selector('#change_old_password input[type="password"]')
    );
    //
    //get the password field
    const new_password = <HTMLInputElement>(
      this.query_selector('#change_new_password input[type="password"]')
    );
    //
    //get the password field
    const confirm_password = <HTMLInputElement>(
      this.query_selector('#change_confirm_password input[type="password"]')
    );
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
  #get_inputs(): credentials {
    //
    // Get the current operation
    const operation = <operation_id>this.section!.id;
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
  #get_credentials(): credentials | undefined {
    //
    // Collect and return the credentials
    const credentials: credentials = this.#get_inputs();
    //
    // Check the form inputs returning the section that represents the
    // current operation
    const inputs_valid: boolean = this.#check_inputs(credentials);
    //
    // Discontinue the process if there are errors
    if (!inputs_valid) return;
    return credentials;
  }
  //
  // Authenticates a user based on the operation type (login, registration, etc.)
  async #authenticate_user(
    credentials: credentials
  ): Promise<user | undefined> {
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
  async #login(credentials: credentials): Promise<user | undefined> {
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
      this.set_error_message("#login_name", "Username does not match password");
      //
      this.set_error_message(
        "#login_password",
        "Password does not match username"
      );
      return;
    }
    //
    //Verify the current users password
    const isPasswordVerified: boolean = await this.exec_php(
      "mutall",
      [],
      "password_verify",
      [credentials.password, current_user.password]
    );
    //
    //If the password does not match the user name, show an error message
    if (!isPasswordVerified) {
      //
      //get the error span for the user name
      this.set_error_message(
        "#login_name",
        "User name does not match password"
      );
      //
      this.set_error_message(
        "#login_password",
        "Password does not match user name"
      );
      return;
    }
    //
    //Set the the current user to the fetched user
    const cur_user = new user(current_user.name, current_user.user);
    return cur_user;
  }
  //
  // Register a new user in the system with provided credentials
  async #register_user(credentials: credentials): Promise<user | undefined> {
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
      this.set_error_message("#sign_up_name", "User already exists");
      return;
    }
    //
    //Hash the new users password before storing it
    const hashed_password = await this.exec_php("mutall", [], "password_hash", [
      credentials.password,
    ]);
    //
    //Create a layout with the new users information
    const layout: Array<layout> = [
      [hashed_password, "user", "password"],
      [credentials.name, "user", "name"],
      [credentials.email!, "user", "email"],
    ];
    //
    //Save the new user to the database suing the exec method
    const response = await this.exec_php(
      "questionnaire",
      ["mutall_users"],
      "load_common",
      [layout]
    );
    //
    //Return a response to the user
    if (response !== "ok") {
      //
      //show an error if registration fails
      this.set_error_message("#sign_up_name", "Registration failed");
      return;
    }
    const new_user = await this.#check_user(credentials.name);
    const cur_user = new user(new_user!.name, new_user!.user);
    return cur_user;
  }
  // Function for forgot password operation
  async #forgot_password(credentials: credentials): Promise<user | undefined> {
    //
    // Check if the user exists
    const current_user = await this.#check_user(credentials.name);
    //
    // If the user does not exist, show an error message
    if (!current_user) {
      //
      this.set_error_message("#forgot_name", "Username does not match email");
      //
      this.set_error_message("#forgot_email", "Email does not match username");
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
  async #change_password(credentials: credentials): Promise<user | undefined> {
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
      this.set_error_message(
        "#change_name",
        "Username does not match password"
      );
      //
      this.set_error_message(
        "#change_old_password",
        "Password does not match username"
      );
      return;
    }

    // Authenticate old password
    const isPasswordVerified = await this.exec_php(
      "mutall",
      [],
      "password_verify",
      [credentials.old_password!, current_user.password]
    );
    //
    // If the password does not match the username, show an error message
    if (!isPasswordVerified) {
      //
      this.set_error_message(
        "#change_name",
        "Username does not match password"
      );
      //
      this.set_error_message(
        "#change_old_password",
        "Password does not match username"
      );
      return;
    }

    // Update to new password
    await this.#update_password(credentials.name, credentials.new_password!);

    // Create and return a user instance
    return new user(current_user.name, current_user.user);
  }

  //
  // Check if a user with a given name exists in the database
  async #check_user(name: string): Promise<
    | {
        user: number;
        name: string;
        password: string;
        email: string;
      }
    | undefined
  > {
    //
    //query to get their name,password and email
    const sql = `SELECT user.user,user.name, user.password, user.email FROM user WHERE name = '${name}'`;
    //
    //Execute the query
    const user: Array<{
      user: number;
      name: string;
      password: string;
      email: string;
    }> = await this.exec_php(
      "database",
      ["mutall_users", false],
      "get_sql_data",
      [sql]
    );
    //
    //return a user or null if they dont exist
    return user ? user[0] : undefined;
  }
  //
  // Update a user’s password in the database
  async #update_password(name: string, new_password: string): Promise<void> {
    //
    //Hash the password before storing it
    const hashed_password = await this.exec_php("mutall", [], "password_hash", [
      new_password,
    ]);
    //
    //Create a layout to save the new password to the database
    const layout: Array<layout> = [
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
  // Take the user to the authentication page
  sign_in(): void {
    //
    //get the url of the current page
    const previous_page = window.location.href;
    //
    // Save the previous page to local storage
    localStorage.setItem("previous_page", previous_page);
    //
    //redirect the user to the authentication page
    window.location.href = this.registration_page;
  }
  //
  // Log out the current user by clearing the memory and local storage
  async logout(): Promise<void> {
    //
    //Remove the session from local storage
    localStorage.removeItem(auth.user_key);
    //
    //Clear the user from memory
    this.user = undefined;
    //
    //Redirect the user to the authentication page
    window.location.href = this.registration_page;
  }
  // Check if a user is currently logged in and returns their details if available
  current_user(): user | undefined {
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
//
//Operation types
type operation_id = "login" | "sign_up" | "forgot" | "change";
//
// Credentials type
type credentials =
  | { operation: "login"; name: string; password: string }
  | {
      operation: "sign_up";
      name: string;
      email: string;
      password: string;
      confirm_password: string;
    }
  | { operation: "forgot"; name: string; email: string }
  | {
      operation: "change";
      name: string;
      old_password: string;
      new_password: string;
      confirm_password: string;
    };
