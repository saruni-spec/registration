import { layout } from "../../../schema/v/code/questionnaire.js";
import { mutall_error, view } from "../../../schema/v/code/schema.js";
import { user } from "../../../outlook/v/code/app.js";

//
// Custom authentication (login, sign_up, and forgot password) for mutall
// Allows a user to register,login,change their password and logout out
// Keeps track of the logged in user for further reference in other contexts
export class auth extends view {
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
    //
    // Get the selected fieldset
    this.#get_section();
    //
    // Clear all errors in the selected fieldset
    this.#clear_field_errors();
    //
    // Clear errors in other sections
    this.#clear_other_sections();
  }
  //
  //clear errors in other sections other than the selected section
  #clear_other_sections(): void {
    //
    // Define the sections to check
    const sections = ["login", "sign_up", "forgot", "change"];
    //
    // Iterate through sections and clear errors if not selected
    sections.forEach((section_name) => {
      //
      // Get the section element
      const section = this.get_element(section_name);
      //
      // If this section is not the selected one, clear its errors
      if (section !== this.section) {
        //
        // Get all label sections that are not radio buttons
        const label_sections = section.querySelectorAll("label:not(.radio)");
        //
        // Clear the errors for each input
        label_sections.forEach((label_section) => {
          //
          //clear the error message in this label
          this.#clear_error(label_section);
        });
      }
    });
  }
  //
  //clear error message of an input when the input changes
  #clear_error(label: Element): void {
    //
    //
    // Get the error span for the input
    const error_span = this.query_selector(`#${label.id} .error`);
    //
    // Clear the error message in the error span
    error_span.textContent = "";
  }
  //
  //Clear error messages in the selected fieldset
  #clear_field_errors(): void {
    //
    // Get all the label sections in the selected fieldset (excluding radio labels)
    const label_sections = this.section!.querySelectorAll("label:not(.radio)");
    //
    // Clear the errors for each input
    label_sections.forEach((label) => {
      // Get the input element in this label section
      const input = <HTMLInputElement>this.query_selector(`#${label.id} input`);
      //
      // Add listeners to the inputs in the selected fieldset
      input.addEventListener("input", (event) => {
        //
        // Clear the error message in the error span
        this.#clear_error(label);
      });
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
    //Set the current section
    //
    //Get the relevant section that has the inputs
    this.#get_section();
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
    //
    //Save the user to local strorage
    localStorage.setItem(
      auth.user_key,
      JSON.stringify({ name: user.name, key: user.pk })
    );
    //
  }
  //
  // Check inputs and report all potential errors
  // Performs comprehensive validation on the inputs to check any errors
  #check_inputs(): boolean {
    //
    // Perform operation-specific input collection and validation
    //
    //check all the fields in the section
    switch (this.section!.id) {
      case "login":
        return this.#check_login();

      case "sign_up":
        return this.#check_sign_up();

      case "forgot":
        return this.#check_forgot();

      case "change":
        return this.#check_change();

      default:
        throw new mutall_error(
          `This sction id:${this.section!.id} is not an opration id`
        );
    }
  }
  //
  //
  #get_section(): void {
    //
    //get the selected operation
    const choice: operation_id = this.#get_operation_id();
    //
    // Find the fieldset corresponding to the selected operation
    this.section = this.get_element(choice);
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
  // Check login credentials
  // The name and password fields should each have an input value
  // Method to set an error message for an input field
  #set_error_message(selector: string, errorMessage: string): void {
    //
    // Find the error span associated with the input
    const errorSpan: HTMLSpanElement = this.query_selector(
      `${selector} span.error`
    );
    //
    // Set the error message text content in the error span
    errorSpan.textContent = errorMessage;
  }

  // Method to check if an input field is empty and set an error if it is
  input_not_empty(
    selector: string,
    errorMessage: string = "This field is required"
  ): boolean {
    //
    // Get the input element using the provided selector
    const input = <HTMLInputElement>this.query_selector(`${selector} input`);
    //
    // Trim the input value to check for empty or whitespace-only input
    if (input.value.trim() === "") {
      //
      // If input is empty, set the error message using the selector
      this.#set_error_message(selector, errorMessage);
      //
      // Return true to indicate does not have a value
      return false;
    }
    //
    // Return false if input has a value
    return true;
  }
  // Method to check if two password fields match
  #password_match(
    passwordSelector: string,
    confirmPasswordSelector: string,
    errorMessage: string = "Passwords do not match"
  ): boolean {
    //
    // Get the password and confirm password input fields
    const password = <HTMLInputElement>(
      this.query_selector(`${passwordSelector} input[type="password"]`)
    );
    const confirm_password = <HTMLInputElement>(
      this.query_selector(`${confirmPasswordSelector} input[type="password"]`)
    );

    // Check if passwords match
    if (password.value !== confirm_password.value) {
      //
      // Set error messages for mismatched passwords
      this.#set_error_message(passwordSelector, errorMessage);
      this.#set_error_message(confirmPasswordSelector, errorMessage);

      // Return false as passwords do not match
      return false;
    }

    // Return true if passwords match
    return true;
  }
  // Check login credentials
  // The name and password fields should each have an input value
  #check_login(): boolean {
    //
    // Check if the name input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#login_name")) {
      return false;
    }
    //
    // Check if the password input field is empty
    // If empty, display error and return false
    return this.input_not_empty("#login_password");
  }

  // Check sign up details with password validation
  #check_sign_up(): boolean {
    //
    // Check if the name input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#sign_up_name")) {
      return false;
    }
    //
    // Check if the email input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#sign_up_email")) {
      return false;
    }
    //
    // Check if the password input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#sign_up_password")) {
      return false;
    }
    //
    // Check if the confirm password input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#sign_up_confirm")) {
      return false;
    }
    //
    // Check if passwords match
    return this.#password_match("#sign_up_password", "#sign_up_confirm");
  }

  // Check forgot password details
  #check_forgot(): boolean {
    //
    // Check if the name input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#forgot_name")) {
      return false;
    }
    //
    // Check if the email input field is empty
    // If empty, display error and return false
    return this.input_not_empty("#forgot_email");
  }
  //
  // Check change password details with validation
  #check_change(): boolean {
    //
    // Check if the name input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#change_name")) {
      return false;
    }
    //
    // Check if the old password input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#change_old_password")) {
      return false;
    }
    //
    // Check if the new password input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#change_new_password")) {
      return false;
    }
    //
    // Check if the confirm password input field is empty
    // If empty, display error and return false
    if (!this.input_not_empty("#change_confirm_password")) {
      return false;
    }
    // Check if new password and confirm password match
    return this.#password_match(
      "#change_new_password",
      "#change_confirm_password"
    );
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
      this.query_selector("sign_up_email input[type=email]")
    );
    //
    //get the password through the label
    //
    //get the password field
    const password = <HTMLInputElement>(
      this.query_selector('#sign_up_password input[type="password"]')
    );
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
    const password = <HTMLInputElement>(
      this.query_selector('#change_old_password input[type="password"]')
    );
    //
    //get the password field
    const new_password = <HTMLInputElement>(
      this.query_selector('#change_new_password input[type="password"]')
    );
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
  #get_inputs(): credentials {
    //
    // Get the current operation
    const operation = this.section!.id as operation_id;
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
    // Check the form inputs returning the section that represents the
    // current operation
    const inputs_valid: boolean = this.#check_inputs();
    //
    // Discontinue the process if there are errors
    if (!inputs_valid) return undefined;
    //
    // Collect and return the credentials
    const credentials: credentials = this.#get_inputs();
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
    //Report an error if the user does not exist
    if (!current_user) {
      //
      this.#set_error_message(
        "#login_name",
        "Username does not match password"
      );
      //
      this.#set_error_message(
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
    //Report an error if the password is not verified
    if (!isPasswordVerified) {
      //
      this.#set_error_message(
        "#login_name",
        "Username does not match password"
      );
      //
      this.#set_error_message(
        "#login_password",
        "Password does not match username"
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
    //Return an error if the user already exists
    if (current_user) {
      //
      // Report an error if the user already exists
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
      this.#set_error_message("#sign_up_name", "Registration failed");
      return;
    }
    const new_user = await this.#check_user(credentials.name);
    const cur_user = new user(new_user!.name, new_user!.user);
    return cur_user;
  }
  //
  // Reset a user’s password to a shared/default password when they forget
  // their password
  async #forgot_password(credentials: credentials): Promise<user | undefined> {
    //
    // Check if the user exists
    const current_user = await this.#check_user(credentials.name);
    //
    // Report an error if the user does not exist
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
  //
  // Change a user’s password to a new password
  async #change_password(credentials: credentials): Promise<user | undefined> {
    //
    // Check if the operation is change
    if (credentials.operation !== "change") {
      return;
    }
    // Check if the user exists
    const current_user = await this.#check_user(credentials.name);
    //
    // Report an error if the user does not exist
    if (!current_user) {
      //
      this.#set_error_message(
        "#change_name",
        "Username does not match password"
      );
      //
      this.#set_error_message(
        "#change_old_password",
        "Password does not match username"
      );
      return;
    }
    //
    // Authenticate the user by verifying their old password
    const isPasswordVerified = await this.exec_php(
      "mutall",
      [],
      "password_verify",
      [credentials.password!, current_user.password]
    );
    //
    // Return an error if the password is not verified
    if (!isPasswordVerified) {
      this.#set_error_message(
        "#change_name",
        "Username does not match password"
      );
      //
      this.#set_error_message(
        "#change_old_password",
        "Password does not match username"
      );
      return;
    }
    //
    // Update to new password
    await this.#update_password(credentials.name, credentials.new_password!);
    //
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
  // Log out the current user by clearing the memory and local storage
  async logout(): Promise<void> {
    //
    //Remove the session from local storage
    localStorage.removeItem(auth.user_key);
    //
    //Clear the user from memory
    this.user = undefined;
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
  | { operation: "sign_up"; name: string; email: string; password: string }
  | { operation: "forgot"; name: string; email: string }
  | {
      operation: "change";
      name: string;
      password: string;
      new_password: string;
    };
