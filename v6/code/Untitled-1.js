    //
    // Get the selected fieldset
    const selectedFieldset = this.#get_section();
// //
//     // Clear errors in the selected fieldset
//     const selectedInputs = selectedFieldset.querySelectorAll(
//         "input:not([type='radio'])"
//     );
//     selectedInputs.forEach((input) => {
//         const errorSpan = input.parentElement?.querySelector(
//             ".error"
//         ) as HTMLSpanElement;
//         if (errorSpan) {
//             errorSpan.textContent = "";
//         }
//     });
//
//     // Clear errors in the login fieldset if it's not selected



import { layout } from "../../../schema/v/code/questionnaire.js";
import { mutall_error, view } from "../../../schema/v/code/schema.js";
import { user } from "../../../outlook/v/code/app.js";
//
// Custom authentication (login, sign_up, and forgot password) for mutall
// Allows a user to register,login,change their password and logout out
// Keeps track of the logged in user for further reference in other contexts
export class auth extends view {
  //
  //Declare a user property
  public user?: user;
  //
  //Create the constrctor of the class,adding the constructor of its parent class
  constructor() {
    super();
  }
  //
  //Clears error messages when an input field changes
  clear_errors(): void {
    //
    //get the selected fieldset
    const selectedFieldset = this.#get_section();
    //
    // Get all input elements within the selected fieldset (excluding radio buttons)
    const inputs = selectedFieldset.querySelectorAll(
      "input:not([type='radio'])"
    );
    //
    // Clear errors for inputs in the selected fieldset
    inputs.forEach((input) => {
      const errorSpan = input.parentElement?.querySelector(
        ".error"
      ) as HTMLSpanElement;
      if (errorSpan) {
        errorSpan.textContent = "";
      }
    });
    //
    // Clear errors in other fieldsets
    const allFieldsets = document.querySelectorAll("fieldset");
    allFieldsets.forEach((fieldset) => {
      if (fieldset !== selectedFieldset) {
        const otherInputs = fieldset.querySelectorAll(
          "input:not([type='radio'])"
        );
        otherInputs.forEach((input) => {
          const errorSpan = input.parentElement?.querySelector(
            ".error"
          ) as HTMLSpanElement;
          if (errorSpan) {
            errorSpan.textContent = "";
          }
        });
      }
    });
  }
  //
  // Collect and submit user credentials for authentication
  // and save the user to local storage
  async submit(event: Event): Promise<void> {
    //
    // Do not refresh the form on submit so that error messages can
    // be seen
    event.preventDefault();
    //
    //Check and get user credentials,if they are valid,submit them for authentication
    //Otherwise,we abort the submission
    const inps: credentials | undefined = this.#get_credentials();
    //
    //Abort the submission if the credentials are not defined
    if (!inps) return;
    //
    //Use the credentials to authenticate the user.If not successful,abort the submission
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
      "user",
      JSON.stringify({ name: user.name, key: user.pk })
    );
  }
  //
  //
  #get_section(): HTMLElement {
    //
    // Get the registration form on the page
    const form: HTMLElement = this.get_element("auth");
    //
    // Get the selected operation (login, sign_up, forgot, change)
    const choice: operation_id = this.#get_operation_id(form);
    //
    //Check if the choice is an opration id
    // switch(choice){
    //   case "forgot":return "forgot";
    //   case "sign_up":return "sign_up";
    //   case "login":return "login";
    //   case "change":return "change";
    //   default:throw new mutall_error(`This choice:${choice} is not an operation id`)
    // }
    //
    // Find the fieldset corresponding to the selected operation
    const field_set = this.get_element(choice);
    return field_set;
  }
  //
  //Get the operation id from the selected radio button on the form
  #get_operation_id(form: HTMLElement): operation_id {
    //
    // Find the selected radio button for the authentication operation
    const radio_choice: HTMLInputElement | null = form.querySelector(
      "input[name='choice']:checked"
    );
    //
    // Show an error if no operation is selected
    if (!radio_choice) {
      //
      // mutall error
      throw new mutall_error("Radio button not selected");
    }
    //
    // Get the selected operation (login, sign_up, forgot, change)
    const choice: string = radio_choice.value;
    return <operation_id>choice;
  }
  //
  // Check inputs for the relavant section and return a result
  #check_inputs(): operation_id | undefined {
    //
    //Get the relevant section that has the inputs
    const section: HTMLElement = this.#get_section();
    //
    //Prepare to return from the various sections
    let result: operation_id | undefined;
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
        throw new mutall_error(
          `This section id:${section.id} is not an opration id`
        );
    }
    return result;
  }
  //
  // Validate that required fields are not empty
  #validate_required_fields(field_map: { [key: string]: string }): boolean {
    //
    // Iterate through the provided field mapping
    for (const [elementId, errorId] of Object.entries(field_map)) {
      //
      // Get the input element
      const input: HTMLInputElement = <HTMLInputElement>(
        this.get_element(elementId)
      );
      //
      // Check if the input is empty after trimming
      if (input.value.trim() === "") {
        //
        // Get the corresponding error element
        const error_span: HTMLSpanElement = this.get_element(errorId);
        //
        // Set the error message
        error_span.textContent = "This field is required";
        //
        // Return false if any field is empty
        return false;
      }
    }
    //
    // Return true if all fields have a value
    return true;
  }
  //
  // Check login credentials
  #check_login(section: HTMLElement): operation_id | undefined {
    //
    //check if all login fields have a value and report the error if an input
    // is missing
    const login_fields = {
      login_name: "ln_error",
      login_password: "ln_error",
    };
    //
    // Validate required fields for login
    if (!this.#validate_required_fields(login_fields)) {
      return;
    }
    //
    // Check all fields in the login section
    // For login, we just return the section id as no specific password validation is needed
    return <operation_id>section.id;
  }
  //
  // Check sign up details with password validation
  #check_sign_up(section: HTMLElement): operation_id | undefined {
    //
    // check if all sign_up fields have a value and report the error if an input
    // is missing
    //
    // Check all required fields for sign up
    const sign_up_fields = {
      sign_up_name: "sn_error",
      sign_up_email: "se_error",
      sign_up_password: "sp_error",
      sign_up_confirm: "sc_error",
    };
    //
    // Validate required fields for sign up
    if (!this.#validate_required_fields(sign_up_fields)) {
      return;
    }
    //
    // Check if password and confirm password match
    const password: HTMLInputElement = <HTMLInputElement>(
      this.get_element("sign_up_password")
    );
    const confirm_password: HTMLInputElement = <HTMLInputElement>(
      this.get_element("sign_up_confirm")
    );

    if (password.value !== confirm_password.value) {
      //
      // Find the error span to display mismatch message
      const error_span1: HTMLElement = this.get_element("sp_error");
      const error_span2: HTMLElement = this.get_element("sc_error");
      //
      // Show error if passwords do not match
      error_span1.textContent = "Passwords do not match";
      error_span2.textContent = "Passwords do not match";
      return;
    }

    return <operation_id>section.id;
  }
  //
  // Check forgot password details
  #check_forgot(section: HTMLElement): operation_id | undefined {
    //
    // check if all forgot password fields have a value and report the error if an input
    // is missing
    //
    // Check all required fields for forgot password
    const forgot_fields = {
      forgot_name: "fn_error",
      forgot_email: "fe_error",
    };
    //
    // Validate required fields for forgot password
    if (!this.#validate_required_fields(forgot_fields)) {
      return;
    }

    //
    // Check all fields in the forgot password section
    // For forgot password, we just return the section id as no specific password validation is needed
    return <operation_id>section.id;
  }

  // Check change password details with validation
  #check_change(section: HTMLElement): operation_id | undefined {
    //
    // check if all change password fields have a value and report the error if an input
    // is missing
    //
    // Check all required fields for change password
    const change_fields = {
      change_name: "cn_error",
      change_password: "cp_error",
      change_new_password: "cnp_error",
      change_confirm: "cc_error",
    };
    //
    // Validate required fields for change password
    if (!this.#validate_required_fields(change_fields)) {
      return;
    }
    //
    // Check if new password and confirm new password match
    const new_password: HTMLInputElement = <HTMLInputElement>(
      this.get_element("change_new_password")
    );
    const confirm_password: HTMLInputElement = <HTMLInputElement>(
      this.get_element("change_confirm")
    );

    if (new_password.value !== confirm_password.value) {
      //
      // Find the error span to display mismatch message
      const error_span1: HTMLElement = this.get_element("cnp_error");
      const error_span2: HTMLElement = this.get_element("cc_error");
      //
      // Show error if passwords do not match
      error_span1.textContent = "Passwords do not match";
      error_span2.textContent = "Passwords do not match";
      return;
    }

    return <operation_id>section.id;
  }
  //
  // Handle login credentials extraction
  #get_login(): credentials {
    //
    // Get the name and password inputs
    const name = this.get_element("login_name") as HTMLInputElement;
    const passwordInput = this.get_element(
      "login_password"
    ) as HTMLInputElement;
    //
    // Return the login credentials
    return {
      operation: "login",
      name: name.value,
      password: passwordInput.value,
    };
  }
  //
  // Handle sign up credentials extraction
  #get_sign_up(): credentials {
    //
    // Get the name, email and password inputs
    const name = this.get_element("sign_up_name") as HTMLInputElement;
    const email = this.get_element("sign_up_email") as HTMLInputElement;
    const password = this.get_element("sign_up_password") as HTMLInputElement;
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
    // Get the name and email inputs
    const name = this.get_element("forgot_name") as HTMLInputElement;
    const email = this.get_element("forgot_email") as HTMLInputElement;
    //
    // Return the forgot password credentials
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
    // Get the name, old password and new password inputs
    const name = this.get_element("change_name") as HTMLInputElement;
    const old_password = this.get_element(
      "change_password"
    ) as HTMLInputElement;
    const new_password = this.get_element(
      "change_new_password"
    ) as HTMLInputElement;
    //
    // Return the change password credentials
    return {
      operation: "change",
      name: name.value,
      password: old_password.value,
      new_password: new_password.value,
    };
  }
  //
  // Create credentials object from pre-validated inputs
  // This method transforms the validated inputs into a credentials object
  #get_inputs(operation: operation_id): credentials {
    // Populate credentials based on the selected operation
    switch (operation) {
      case "login":
        //
        // Get the login credentials
        return this.#get_login();
      case "sign_up":
        //
        // Get the sign up credentials
        return this.#get_sign_up();
      case "forgot":
        //
        // Get the forgot password credentials
        return this.#get_forgot();
      case "change":
        //
        // Get the change password credentials
        return this.#get_change();
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
  // Main method to get credentials
  // Combines input checking and credentials collections
  #get_credentials(): credentials | undefined {
    //
    // First, check and validate inputs returning the HTML element
    // that represents that section. If the check fails,return undefined
    const choice: operation_id | undefined = this.#check_inputs();
    //
    //return undefined if the chck fails
    if (!choice) return undefined;
    //
    // Collect the credentials
    const credentials: credentials = this.#get_inputs(choice);
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
    // Find the error span for login to display errors
    const name_error: HTMLElement = this.get_element("ln_error");
    const password_error: HTMLElement = this.get_element("lp_error");
    //
    //confirm the opration is login
    if (credentials.operation !== "login") {
      return;
    }
    //
    //Check if a user with the current name exists
    const current_user = await this.#check_user(credentials.name);
    if (!current_user) {
      name_error.textContent = "User does not exist";
      return;
    }
    //
    //Verify the current users password
    const verified_password: boolean = await this.exec_php(
      "mutall",
      [],
      "password_verify",
      [credentials.password, current_user.password]
    );
    if (verified_password) {
      //
      //Set the the current user to the fetched user
      const cur_user = new user(current_user.name, current_user.user);
      return cur_user;
    }
    //
    //show an error if the credentials dont match
    name_error.textContent = "Username does not match password";
    password_error.textContent = "Passwords does not match username";
    return;
  }
  //
  // Register a new user in the system with provided credentials
  async #register_user(credentials: credentials): Promise<user | undefined> {
    //
    // Find the error span for sign up to display errors
    const name_error: HTMLElement = this.get_element("sn_error");
    //
    //confirm the opration is sign_up
    if (credentials.operation !== "sign_up") {
      return;
    }
    //
    //Check if a user with the same name exists
    const current_user = await this.#check_user(credentials.name);
    if (current_user) {
      name_error.textContent = "User with this name  exists";
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
    if (response === "ok") {
      const current_user = await this.#check_user(credentials.name);
      const cur_user = new user(current_user!.name, current_user!.user);
      return cur_user;
    }
    //
    //show an error if registration fails
    name_error.textContent = "Registration  failed";
    return;
  }
  // Function for forgot password operation
  async #forgot_password(credentials: credentials): Promise<user | undefined> {
    // Check if the user exists
    const name_error: HTMLElement = this.get_element("fn_error");
    const current_user = await this.#check_user(credentials.name);

    if (!current_user) {
      name_error.textContent = "User does not exist";
      return;
    }

    // Set password to a shared/default password
    await this.#update_password(credentials.name, "shared_password");
    this.#show_error("Password reset to default");

    // Create and return a user instance
    return new user(current_user.name, current_user.user);
  }

  // Function for changing password operation
  async #change_password(credentials: credentials): Promise<user | undefined> {
    //
    //confirm the opration is change
    if (credentials.operation !== "change") {
      return;
    }
    // Find error spans for change password
    const name_error: HTMLElement = this.get_element("cn_error");
    const password_error: HTMLElement = this.get_element("cp_error");

    // Check if the user exists
    const current_user = await this.#check_user(credentials.name);

    if (!current_user) {
      name_error.textContent = "User does not exist";
      return;
    }

    // Authenticate old password
    const isPasswordVerified = await this.exec_php(
      "mutall",
      [],
      "password_verify",
      [credentials.password!, current_user.password]
    );

    if (isPasswordVerified) {
      // Update to new password
      await this.#update_password(credentials.name, credentials.new_password!);

      this.#show_error("Password reset");

      // Create and return a user instance
      return new user(current_user.name, current_user.user);
    }

    // If old password is incorrect
    name_error.textContent = "Username does not match password";
    password_error.textContent = "Passwords does not match username";
    return;
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
    const result = await this.exec_php(
      "questionnaire",
      ["mutall_users"],
      "load_common",
      [layout]
    );

    if (result !== "ok") this.#show_error("Password update failed");
  }
  //
  // Log out the current user by clearing their session
  async logout(): Promise<void> {
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
  current_user(): user | undefined {
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
  #show_error(error: string): void {
    //
    //get the error span for general error reporting on the form
    const error_elem = document.getElementById("form_error") as HTMLSpanElement;
    //
    //show the error
    error_elem.textContent = error;
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
