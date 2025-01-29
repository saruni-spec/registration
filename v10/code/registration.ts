import { layout } from "../../../schema/v/code/questionnaire.js";
import { mutall_error, view } from "../../../schema/v/code/schema.js";
import { user } from "../../../outlook/v/code/app.js";
import { input, input_type } from "../../../schema/v/code/io.js";
//
// The `authoriser` class has the the different sections needed for authentication,
// including login, sign-up, password reset, and password change. It also handles
// user session management
export class authoriser extends view {
  //
  // This is the registration page
  static registration_page: string = "registration.html";
  //
  //This key is used for saving the user creadentials to local storage
  static user_key: string = "credentials_of_loggedin_user";
  //
  //Declare a user property
  public user?: user;
  //
  //Create the constrctor of the class,adding the constructor of its parent class
  constructor() {
    super();
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
    const current: login | sign_up | change | forgot =
      this.#get_current_section();
    //
    //Check the credentials for the current section
    const user: user | undefined = await current.authenticate();
    //
    //If the authentication fails,abort the submission
    if (!user) return;
    //
    //Save the authenticated user for further reference to complete the submission
    this.user = user;
    //
    //Save the user to local strorage
    localStorage.setItem(
      authoriser.user_key,
      JSON.stringify({ name: user.name, key: user.pk })
    );
  }

  //
  //
  #get_current_section(): login | sign_up | forgot | change {
    //
    //get the selected operation
    const choice: operation_id = this.#get_operation_id();
    //
    // Find the fieldset corresponding to the selected operation
    const field_set: HTMLElement = this.get_element(choice);

    switch (choice) {
      case "login":
        return new login(field_set);
      case "sign_up":
        return new sign_up(field_set);
      case "forgot":
        return new forgot(field_set);
      case "change":
        return new change(field_set);
      default:
        throw new Error("Invalid operation");
    }
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
    window.location.href = authoriser.registration_page;
  }
  //
  // Log out the current user by clearing the memory and local storage
  async logout(): Promise<void> {
    //
    //Remove the session from local storage
    localStorage.removeItem(authoriser.user_key);
    //
    //Clear the user from memory
    this.user = undefined;
    //
    //Redirect the user to the authentication page
    window.location.href = authoriser.registration_page;
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
    const session = localStorage.getItem(authoriser.user_key);
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
// Base abstract class for all sections
abstract class section extends view {
  protected section: HTMLElement;
  //
  // An array of inputs
  protected inputs?: input[];

  constructor(section: HTMLElement) {
    super();
    this.section = section;
  }

  abstract get_inputs(section: HTMLElement): credentials;
  abstract check_inputs(credentials: credentials): boolean;
  abstract verify(credentials: credentials): Promise<user | undefined>;
  abstract validateInputs(): boolean;

  async authenticate(): Promise<user | undefined> {
    //
    // Get the inputs from the current section
    const credentials = this.get_inputs(this.section);
    //
    // Check the inputs for the current section
    const valid = this.check_inputs(credentials);
    //
    // If the inputs are not valid, abort the authentication
    if (!valid) return;
    //
    // Verify the inputs for the current section
    const user = await this.verify(credentials);
    //
    // If the user is not verified, abort the authentication
    if (!user) return;

    return user;
  }

  clear_other_sections(selected_fieldset: HTMLElement): void {
    //
    // Define the sections to check
    const operations: operation_id[] = ["login", "sign_up", "forgot", "change"];
    //
    // Iterate through sections and clear errors if not selected
    operations.forEach((operation) => {
      //
      // Get the section element
      const section = this.get_element(operation);
      //
      // If this section is not the selected one, clear its errors
      if (section && section !== selected_fieldset) {
        this.clear_errors_in_section(section);
      }
    });
  }
  //
  // Clear the errors in the selected fieldset
  abstract clear_errors_in_section(section: HTMLElement): void;
  //
  // Get the label sections in the selected fieldset
  // Clear errors on input change for each label section
  // Should be put in the input class
  #clear_input_errors(): void {
    //
    // Clear errors on input change in all the label sections
    // Get all the label sections in the selected fieldset (excluding radio labels)
    const label_sections = document.querySelectorAll("label:not(.radio)");
    //
    // Find the input in each label section and add an event listener to it
    label_sections.forEach((label) => {
      //
      // Clear errors on input change in the selected field
      this.#clear_errors_on_input_change(label);
    });
  }

  //
  // Add an oninput event listener to the input field in the selected label
  // Clear the error message when the user starts typing
  #clear_errors_on_input_change(label: Element): void {
    //
    // Get the input element in this label section
    const input = <HTMLInputElement>this.query_selector(`#${label.id} input`);
    //
    // Add listeners to the inputs in the selected fieldset
    input.addEventListener("input", (event) => {
      //
      // Get the error span for the input
      const error_span: Element | null = label.querySelector(".error");
      //
      // Clear the error message in the error span
      this.set_error_message(`${label.id}`, "");
    });
  }

  //
  // Check if a user with a given name exists in the database
  protected async check_user(name: string): Promise<
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
  // Set an error message for a specific field
  // Takes the field's selector and the error message as parameters
  protected set_error_message(label_id: string, error_message: string): void {
    const label = this.get_element(label_id);
    //
    // Find the error span element in the label section
    let error_span: Element | null = label.querySelector(`span.error`);
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
      label.appendChild(error_span);
    }
    //
    // Set the text content of the error span to display the error message
    error_span.textContent = error_message;
  }

  //
  // Update a user’s password in the database
  async update_password(name: string, new_password: string): Promise<void> {
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
  //Get an input element from a section by its name
  get_input_element(name: string, section: HTMLElement): HTMLInputElement {
    //
    //Get the the element from the section
    const element = section.querySelector(`[name="${name}"]`);
    //
    //Check if the element is an HTML Input Element
    if (!(element instanceof HTMLInputElement))
      throw new mutall_error(`No input element found with this name:'${name}'`);
    //
    //Return the element
    return element;
  }
  //
  //Check if an email is valid
  email_valid(email: string): boolean {
    //
    // \b                - Ensure the email starts and ends as a whole word.
    // [A-Za-z0-9._%+-]+ - Matches one or more characters that can be uppercase/lowercase letters, digits, dots (.), underscores (_), percent signs (%), plus signs (+), or hyphens (-). This is the local part of the email (before the @).
    // @                 - Matches the @ symbol,for the domain of the email.
    // [A-Za-z0-9.-]+    - Matches one or more characters that can be uppercase/lowercase letters, digits, dots (.), or hyphens (-). This is the domain name.
    // \.                - Matches a literal dot (.) eg .com
    // [A-Z|a-z]{2,}     - Matches 2 or more uppercase/lowercase letters, representing the top-level domain (e.g., .com, .org).
    // \b                - Ensure the email ends as a whole word.
    const valid_email = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;

    return valid_email.test(email);
  }
}

// Login section implementation
class login extends section {
  constructor(fieldset: HTMLElement) {
    super(fieldset);
  }

  validateInputs(): boolean {
    // Validate login inputs
    return true;
  }
  clear_errors_in_section(section: HTMLElement): void {
    //
    // Clear login-specific errors
  }
  //
  // Validate login credentials
  check_inputs(credentials: {
    operation: "login";
    name: string;
    password: string;
  }): boolean {
    //
    // Validate name field by checking whether or not they are empty
    // Passes the name value and the selector for the name input's error span
    if (credentials.name.trim() === "") {
      //
      // If empty, call setFieldError to display a "required" message
      this.set_error_message("#login_name", "This field is required");
      return false;
    }
    //
    // Validate password field by checking whether or not they are empty
    if (credentials.password.trim() === "") {
      //
      // If empty, call setFieldError to display a "required" message
      this.set_error_message("#login_password", "This field is required");
      return false;
    }
    return true;
  }
  //
  // Collect the login credentials
  get_inputs(section: HTMLElement): {
    operation: "login";
    name: string;
    password: string;
  } {
    //
    // Collect the name component of the login credentials
    const name = this.get_input_element("name", section);
    //
    // Get the password input field
    const password = this.get_input_element("password", section);
    //
    // Return the login credentials
    return {
      operation: "login",
      name: name.value,
      password: password.value,
    };
  }
  //
  // Log in an existing user by verifying credentials
  async verify(credentials: credentials): Promise<user | undefined> {
    //
    //confirm the opration is login
    if (credentials.operation !== "login") {
      return;
    }
    //
    //Check if a user with the current name exists
    const current_user = await this.check_user(credentials.name);
    //
    //If the user does not exist,show an error message
    if (!current_user) {
      //
      this.set_error_message("login_name", "Username does not match password");
      //
      this.set_error_message(
        "login_password",
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
      this.set_error_message("login_name", "User name does not match password");
      //
      this.set_error_message(
        "login_password",
        "Password does not match user name"
      );
      return;
    }
    //
    //Set the the current user to the fetched user
    const cur_user = new user(current_user.name, current_user.user);
    return cur_user;
  }
}

// SignUp section implementation
class sign_up extends section {
  constructor(fieldset: HTMLElement) {
    super(fieldset);
  }

  async handleSubmit(): Promise<void> {
    if (!this.validateInputs()) return;

    const credentials: credentials = {
      name: this.getInputValue("sign_up_name"),
      email: this.getInputValue("sign_up_email"),
      password: this.getInputValue("sign_up_password"),
      confirm_password: this.getInputValue("sign_up_confirm"),
    };
    // Handle signup logic
  }

  validateInputs(): boolean {
    // Validate signup inputs including password match
    return true;
  }

  clear_errors(): void {
    // Clear signup-specific errors
  }

  //
  // Validate sign up details with comprehensive checks
  check_inputs(credentials: credentials): boolean {
    //
    // Confirm the operation is sign up
    if (credentials.operation !== "sign_up") {
      return false;
    }
    //
    // Validate each input field by checking whether or not they are empty
    // Check the name, email, password, and confirm password fields
    // Check the name field
    if (credentials.name.trim() === "") {
      //
      // If empty, display an error message
      this.set_error_message("#sign_up_name", "This field is required");
      return false;
    }
    //
    // Check the email field
    if (credentials.email.trim() === "") {
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
    if (credentials.password.trim() === "") {
      //
      // If empty, display an error message
      this.set_error_message("#sign_up_password", "This field is required");
      return false;
    }
    //
    // Check the confirm password field
    if (credentials.confirm_password.trim() === "") {
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
  // Handle sign up credentials extraction
  get_inputs(section: HTMLElement): {
    operation: "sign_up";
    name: string;
    email: string;
    password: string;
    confirm_password: string;
  } {
    //
    // Collect the name component of the sign up credentials
    const name = this.get_input_element("name", section);
    //
    // Get the email and password input fields
    const email = this.get_input_element("email", section);
    //
    //get the password field
    const password = this.get_input_element("password", section);
    //
    //get the confirm password through the label
    const confirm_password = this.get_input_element(
      "confirm_password",
      section
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
  // Register a new user in the system with provided credentials
  async verify(credentials: credentials): Promise<user | undefined> {
    //
    //confirm the opration is sign_up
    if (credentials.operation !== "sign_up") {
      return;
    }
    //
    //Check if a user with the same name exists
    const current_user = await this.check_user(credentials.name);
    //
    //If the user already exists,show an error message
    if (current_user) {
      //
      this.set_error_message("sign_up_name", "User already exists");
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
      this.set_error_message("sign_up_name", "Registration failed");
      return;
    }
    const new_user = await this.check_user(credentials.name);
    const cur_user = new user(new_user!.name, new_user!.user);
    return cur_user;
  }
}

class forgot extends section {
  constructor(fieldset: HTMLElement) {
    super(fieldset);
  }

  async handleSubmit(): Promise<void> {
    if (!this.validateInputs()) return;

    const credentials: credentials = {
      name: this.getInputValue("forgot_name"),
      email: this.getInputValue("forgot_email"),
    };
    // Handle forgot password logic
  }

  validateInputs(): boolean {
    // Validate forgot password inputs
    return true;
  }

  clear_errors(): void {
    // Clear forgot password-specific errors
  }

  //
  // Validate forgot password details
  check_inputs(credentials: credentials): boolean {
    //
    // Confirm the operation is forgot password
    if (credentials.operation !== "forgot") {
      return false;
    }
    //
    // Validate name and email fields by checking whether or not they are empty
    // Check the name field
    if (credentials.name.trim() === "") {
      //
      // If empty, display an error message
      this.set_error_message("#forgot_name", "This field is required");
      return false;
    }
    //
    // Validate email field
    if (credentials.email.trim() === "") {
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
  // Handle forgot password credentials extraction
  get_inputs(section: HTMLElement): {
    operation: "forgot";
    name: string;
    email: string;
  } {
    //
    // Collect the name component of the forgot password credentials
    const name = this.get_input_element("name", section);
    //
    // Get the email input field
    const email = this.get_input_element("email", section);
    //
    //return the credentials for forgot password
    return {
      operation: "forgot",
      name: name.value,
      email: email.value,
    };
  }
  // Function for forgot password operation
  async verify(credentials: credentials): Promise<user | undefined> {
    //
    // Check if the user exists
    const current_user = await this.check_user(credentials.name);
    //
    // If the user does not exist, show an error message
    if (!current_user) {
      //
      this.set_error_message("forgot_name", "Username does not match email");
      //
      this.set_error_message("forgot_email", "Email does not match username");
      return;
    }
    //
    // Set password to a shared/default password
    await this.update_password(credentials.name, "shared_password");
    //
    // Create and return a user instance
    return new user(current_user.name, current_user.user);
  }
}

class change extends section {
  constructor(fieldset: HTMLElement) {
    super(fieldset);
  }

  validateInputs(): boolean {
    // Validate change password inputs including password match
    return true;
  }

  clear_errors_in_section(section: HTMLElement): void {
    //
    // Clear the error messages in the section specific to the change password operation
  }

  //
  // Validate change password details with comprehensive checks
  check_inputs(credentials: credentials): boolean {
    //
    // Confirm the operation is change password
    if (credentials.operation !== "change") {
      return false;
    }
    //
    // Validate each input field by checking whether or not they are empty
    // Check the name, old password, new password, and confirm password fields
    // Check the name field
    if (credentials.name.input_value?.toString().trim() === "") {
      //
      // If empty, display an error message
      this.set_error_message("#change_name", "This field is required");
      return false;
    }
    //
    // Check the old password field
    if (credentials.old_password.trim() === "") {
      //
      // If empty, display an error message
      this.set_error_message("#change_old_password", "This field is required");
      return false;
    }
    //
    // Check the new password field
    if (credentials.new_password.trim() === "") {
      //
      // If empty, display an error message
      this.set_error_message("#change_new_password", "This field is required");
      return false;
    }
    //
    // Check the confirm password field
    if (credentials.confirm_password.trim() === "") {
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
  // Handle change password credentials extraction
  get_inputs(section: HTMLElement): {
    operation: "change";
    name: reg_input;
    old_password: reg_input;
    new_password: reg_input;
    confirm_password: reg_input;
  } {
    //
    // Collect the name component of the change password credentials
    const name = this.get_input_element("name", section);
    //
    //get the password field
    const old_password = this.get_input_element("old_password", section);
    //
    //get the password field
    const new_password = this.get_input_element("new_password", section);
    //
    //get the password field
    const confirm_password = this.get_input_element(
      "confirm_password",
      section
    );
    //
    //return the credentials for changing password
    return {
      operation: "change",
      name: new reg_input(this.section, name),
      old_password: new reg_input(this.section, old_password),
      new_password: new reg_input(this.section, new_password),
      confirm_password: new reg_input(this.section, confirm_password),
    };
  }

  // Function for changing password operation
  async verify(credentials: credentials): Promise<user | undefined> {
    //
    // Check if the operation is change
    if (credentials.operation !== "change") {
      return;
    }
    //
    // Check if the user exists
    const current_user = await this.check_user(credentials.name);
    //
    // If the user does not exist, show an error message
    if (!current_user) {
      //
      this.set_error_message("change_name", "Username does not match password");
      //
      this.set_error_message(
        "change_old_password",
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
      this.set_error_message("change_name", "Username does not match password");
      //
      this.set_error_message(
        "change_old_password",
        "Password does not match username"
      );
      return;
    }

    // Update to new password
    await this.update_password(credentials.name, credentials.new_password!);

    // Create and return a user instance
    return new user(current_user.name, current_user.user);
  }
}
class reg_input extends input {
  constructor(proxy: HTMLElement, existing_input: HTMLInputElement) {
    //
    // Call the parent constructor with the proxy and input type
    super(proxy, { type: "text" }, undefined, {});

    //
    // Use the existing input element instead of creating a new one
    this.input = existing_input;

    // Ensure the input element is configured according to the requirements.
    this.fit_input();
  }

  // Override `create_element` to avoid creating a new element.
  public create_element<
    tagname extends keyof HTMLElementTagNameMap,
    attribute_collection extends Partial<HTMLElementTagNameMap[tagname]>
  >(
    tagname: tagname,
    anchor: HTMLElement,
    attributes?: attribute_collection
  ): HTMLElementTagNameMap[tagname] {
    //
    // Dont need to create a new element, just return the existing one.
    return this.input as HTMLElementTagNameMap[tagname];
  }

  // Configure the input element to match the requirements of the input class.
  private fit_input() {
    // Apply the necessary attributes, classes, and event handlers to the input element.
    this.input.type = "text";
    this.input.maxLength = 50;
    this.input.size = 50;

    // Add classes
    this.input.classList.add("edit");

    // Attach event listeners
    this.input.onchange = () => this.mark_as_edited();
  }

  //
  // Report an error message for the input
  set_error_message(error_message: string): void {
    //
    // Find the error span in the input
    let error_span: Element | null = this.input.closest(".error");
    //
    // If the error span does not exist, create a new one
    if (!error_span) {
      //
      // Create a new span element
      error_span = document.createElement("span");
      //
      // Set the class of the new span element to "error"
      error_span.className = "error";
      //
      // Append the new span element to the input
      this.input.parentElement!.appendChild(error_span);
    }
    //
    // Set the text content of the error span to display the error message
    error_span.textContent = error_message;
  }
}
// Credentials is a structure for holding the data from various sections
// for authentication
//
type login_credentials = {
  operation: "login";
  name: reg_input;
  password: reg_input;
};
type sign_up_credentials = {
  operation: "sign_up";
  name: reg_input;
  email: reg_input;
  password: reg_input;
  confirm_password: reg_input;
};
type forgot_credentials = {
  operation: "forgot";
  name: reg_input;
  email: reg_input;
};
type change_credentials = {
  operation: "change";
  name: reg_input;
  old_password: reg_input;
  new_password: reg_input;
  confirm_password: reg_input;
};

type credentials =
  | login_credentials
  | sign_up_credentials
  | forgot_credentials
  | change_credentials;
//
//
// type operation_id = discriminant<credential>;
type operation_id = discriminator.discriminant_values<credentials, "operation">;

// A space for the dis
namespace discriminator {
  //
  //Extract all the possible keys in any given type
  type key<T> = keyof T;
  //
  //Identify the unique property that are common across all the members of the union and used to
  //differentiate between them
  //TODO: Read about conditional types ??????????????????
  //
  //Iterate through all the menbers in a union type and check if the given discriminant key exists.and
  //if it does we proceed to extract the value associated with that key
  export type discriminant_values<
    //
    //The union type
    T,
    //
    //The discriminant in the union type
    K extends keyof T
  > = T extends { [p in K]: infer V } ? V : never;
  //
  // Defome a utility type that will extract all the possible variants of a discriminant
  // type discriminant<T> = discriminant_values<T, discriminant_key<T>>;
  //
}
