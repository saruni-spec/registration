import { layout } from "../../../schema/v/code/questionnaire.js";
import { mutall_error, view } from "../../../schema/v/code/schema.js";
import { user } from "../../../outlook/v/code/app.js";
//
// The `authoriser` class extends the `view` class and provides methods for user authentication,
// including login, sign-up, password reset, and password change. It also handles error clearing,
// user session management, and input validation.
//
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
  clear_errors(): void {
    //
    // Clear errors on input change in any of the sections
    this.#clear_input_errors();
    //
    //Clear errors in ohter sections when a different section is selected
    //Get the selected section
    const current = this.#get_current_section();
    //
    //
    if (!current.element) return;
    //
    // Clear errors in other sections
    this.#clear_other_sections(current.element);
  }
  #clear_other_sections(selected_fieldset: HTMLElement): void {
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
        this.#clear_errors_in_section(section);
      }
    });
  }
  //
  // Clear the errors in the selected fieldset
  #clear_errors_in_section(section: HTMLElement): void {
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
  //
  // Get the label sections in the selected fieldset
  // Clear errors on input change for each label section
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
      this.#set_error_message(`${label.id}`, "");
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
    const current: section = this.#get_current_section();
    //
    //Check the credentials for the current section
    const valid: boolean = this.#check_credentials(current.credential);
    //
    //Abort the submission if the credentials are not valid
    if (!valid) return;
    //
    // Use the credentials to authenticate the user.
    // If not successful,abort the submission
    const user: user | undefined = await this.#authenticate_user(
      current.credential
    );
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
  // Check inputs and report all potential errors
  // Performs comprehensive validation on the inputs to check any errors
  #check_credentials(credentials: credential): boolean {
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
  #get_current_section(): section {
    //
    //get the selected operation
    const choice: operation_id = this.#get_operation_id();
    //
    // Find the fieldset corresponding to the selected operation
    const field_set: HTMLElement = this.get_element(choice);
    //
    // Get the credentials for the current operation
    const credentials = this.#get_inputs(field_set);

    return { element: field_set, credential: credentials };
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
  // Set an error message for a specific field
  // Takes the field's selector and the error message as parameters
  #set_error_message(label_id: string, error_message: string): void {
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
  //Check if an email is valid
  #email_valid(email: string): boolean {
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
  //
  // Check the provided fields to ensure they are not empty
  #validate_required_fields(
    fields: { value: string; selector: string; message: string }[]
  ): boolean {
    //
    // Assume all fields are valid
    let are_valid = true;
    //
    // For each field, check if it is empty and display an error message if it is
    for (const field of fields) {
      //
      // Check if the field is empty
      // Use trim to remove any white spaces
      if (field.value.trim() === "") {
        //
        // If empty, display an error message
        this.#set_error_message(field.selector, field.message);
        //
        // Set are_valid to false if any field is empty
        are_valid = false;
      }
    }

    return are_valid;
  }
  //
  //
  //Check if a password and its confirmation match
  #validate_passwords_match(
    password: string,
    confirmPassword: string,
    selectors: [string, string]
  ): boolean {
    //
    //
    if (password !== confirmPassword) {
      this.#set_error_message(selectors[0], "Passwords do not match");
      this.#set_error_message(selectors[1], "Passwords do not match");
      return false;
    }
    return true;
  }
  //
  // Validate login credentials
  #check_login(credentials: credential): boolean {
    //
    // Confirm the operation is login
    if (credentials.operation !== "login") {
      return false;
    }
    //
    // Validate name field and password field by checking whether or not they are empty
    return this.#validate_required_fields([
      {
        value: credentials.name,
        selector: "#login_name",
        message: "This field is required",
      },
      {
        value: credentials.password,
        selector: "#login_password",
        message: "This field is required",
      },
    ]);
  }
  //
  // Validate sign up details with comprehensive checks
  #check_sign_up(credentials: credential): boolean {
    //
    // Confirm the operation is sign up
    if (credentials.operation !== "sign_up") {
      return false;
    }
    //
    // Validate each input field by checking whether or not they are empty
    // Check the name, email, password, and confirm password fields
    const values_valid = this.#validate_required_fields([
      {
        value: credentials.name,
        selector: "sign_up_name",
        message: "This field is required",
      },
      {
        value: credentials.email,
        selector: "sign_up_email",
        message: "This field is required",
      },
      {
        value: credentials.password,
        selector: "sign_up_password",
        message: "This field is required",
      },
      {
        value: credentials.confirm_password,
        selector: "sign_up_confirm",
        message: "This field is required",
      },
    ]);
    //
    // Check if the email is valid
    if (!this.#email_valid(credentials.email)) {
      //
      // If empty, display an error message
      this.#set_error_message("sign_up_email", "Invalid email");
      return false;
    }
    //
    // Check to ensure passwords match
    const doPasswordsMatch = this.#validate_passwords_match(
      credentials.password,
      credentials.confirm_password,
      ["sign_up_password", "sign_up_confirm"]
    );

    return values_valid && doPasswordsMatch;
  }
  //
  // Validate forgot password details
  #check_forgot(credentials: credential): boolean {
    //
    // Confirm the operation is forgot password
    if (credentials.operation !== "forgot") {
      return false;
    }
    //
    // Validate name and email fields by checking whether or not they are empty
    const values_valid = this.#validate_required_fields([
      {
        value: credentials.name,
        selector: "forgot_name",
        message: "This field is required",
      },
      {
        value: credentials.email,
        selector: "forgot_email",
        message: "This field is required",
      },
    ]);
    //
    if (!values_valid) return false;
    //
    // Check if the email is valid
    if (!this.#email_valid(credentials.email)) {
      //
      // If empty, display an error message
      this.#set_error_message("forgot_email", "Invalid email");
      return false;
    }
    return true;
  }
  //
  // Validate change password details with comprehensive checks
  #check_change(credentials: credential): boolean {
    //
    // Confirm the operation is change password
    if (credentials.operation !== "change") {
      return false;
    }
    //
    // Validate each input field by checking whether or not they are empty
    // Check the name, old password, new password, and confirm password fields
    const valid_values = this.#validate_required_fields([
      {
        value: credentials.name,
        selector: "change_name",
        message: "This field is required",
      },
      {
        value: credentials.old_password,
        selector: "change_old_password",
        message: "This field is required",
      },
      {
        value: credentials.new_password,
        selector: "change_new_password",
        message: "This field is required",
      },
      {
        value: credentials.confirm_password,
        selector: "change_confirm_password",
        message: "This field is required",
      },
    ]);
    //
    // Check to ensure new passwords match
    const doPasswordsMatch = this.#validate_passwords_match(
      credentials.new_password,
      credentials.confirm_password,
      ["change_new_password", "change_confirm_password"]
    );

    return valid_values && doPasswordsMatch;
  }
  //
  //Get an input element from a section by its name
  get_input_element(name: string, section: HTMLElement): HTMLInputElement {
    //
    //Get the the element from the section
    const element = section.querySelector(`#${name}`);
    //
    //Check if the element is an HTML Input Element
    if (!(element instanceof HTMLInputElement))
      throw new mutall_error(`HTML Input ELement expected at ${name}`);
    //
    //Return the element
    return element;
  }
  //
  // Collect the login credentials
  #get_login(section: HTMLElement): {
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
  // Handle sign up credentials extraction
  #get_sign_up(section: HTMLElement): {
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
  // Handle forgot password credentials extraction
  #get_forgot(section: HTMLElement): credential {
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
  //
  // Handle change password credentials extraction
  #get_change(section: HTMLElement): credential {
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
      name: name.value,
      old_password: old_password.value,
      new_password: new_password.value,
      confirm_password: confirm_password.value,
    };
  }
  //
  // Collect the credentials based on the current operation
  // The validated inputs are in the form section under the given fieldset
  #get_inputs(current: HTMLElement): credential {
    //
    //Call the appropriate method to get the credentials based on the operation
    switch (current.id) {
      case "login":
        //
        // Collect and return the login credentials
        return this.#get_login(current);
      case "sign_up":
        //
        // Collect and return the sign_up credentials
        return this.#get_sign_up(current);
      case "forgot":
        //
        // Collect and return the forgot password credentials
        return this.#get_forgot(current);
      case "change":
        //
        // Collect and return the change password credentials
        return this.#get_change(current);
      default:
        throw new mutall_error(`Unsupported operation: ${current.id}`);
    }
  }
  //
  // Authenticates a user based on the operation type (login, registration, etc.)
  async #authenticate_user(credentials: credential): Promise<user | undefined> {
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
  async #login(credentials: credential): Promise<user | undefined> {
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
      this.#set_error_message("login_name", "Username does not match password");
      //
      this.#set_error_message(
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
      this.#set_error_message(
        "login_name",
        "User name does not match password"
      );
      //
      this.#set_error_message(
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
  //
  // Register a new user in the system with provided credentials
  async #register_user(credentials: credential): Promise<user | undefined> {
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
      this.#set_error_message("sign_up_name", "User already exists");
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
      this.#set_error_message("sign_up_name", "Registration failed");
      return;
    }
    const new_user = await this.#check_user(credentials.name);
    const cur_user = new user(new_user!.name, new_user!.user);
    return cur_user;
  }
  // Function for forgot password operation
  async #forgot_password(credentials: credential): Promise<user | undefined> {
    //
    // Check if the user exists
    const current_user = await this.#check_user(credentials.name);
    //
    // If the user does not exist, show an error message
    if (!current_user) {
      //
      this.#set_error_message("forgot_name", "Username does not match email");
      //
      this.#set_error_message("forgot_email", "Email does not match username");
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
  async #change_password(credentials: credential): Promise<user | undefined> {
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
      this.#set_error_message(
        "change_name",
        "Username does not match password"
      );
      //
      this.#set_error_message(
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
      this.#set_error_message(
        "change_name",
        "Username does not match password"
      );
      //
      this.#set_error_message(
        "change_old_password",
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
//
type section = { element: HTMLElement; credential: credential };
//
// (Operation types can be derived from the credentials)
// type operation_id= x<credentials>;
//
// Credentials is a structure for holding the data from various sections
// for authentication
//
type login = { operation: "login"; name: string; password: string };
type sign_up = {
  operation: "sign_up";
  name: string;
  email: string;
  password: string;
  confirm_password: string;
};
type forgot = { operation: "forgot"; name: string; email: string };
type change = {
  operation: "change";
  name: string;
  old_password: string;
  new_password: string;
  confirm_password: string;
};

type credential = login | sign_up | forgot | change;
//
//
// type operation_id = discriminant<credential>;
type operation_id = discriminator.discriminant_values<credential, "operation">;

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
