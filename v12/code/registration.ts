import {
  mutall_error,
  view,
  options,
  basic_value,
} from "../../../schema/v/code/schema.js";
import { input, input_type, io, io_option } from "../../../schema/v/code/io.js";
import { page } from "../../../outlook/v/code/outlook.js";
import { user } from "../../../outlook/v/code/app.js";
//
// The authoriser class is a page that is used to authorise a user to allow them access to
// mutall applications.
////It allows the user to login, register, or reset their password.
//
export class authoriser extends page {
  public sections: Map<"login" | "sign_up" | "forgot" | "change", section>;
  //
  // the login section
  public login: login;
  public forgot: forgot;
  public change: change;
  public sign_up: sign_up;
  //
  //
  constructor(parent?: view) {
    const url: string = "./registration.html";
    super(url, parent);
    //
    // Create the login section
    this.login = new login(this);
    this.forgot = new forgot(this);
    this.change = new change(this);
    this.sign_up = new sign_up(this);
    //
    // Create the sections
    this.sections = new Map([
      ["login", this.login],
      ["forgot", this.forgot],
      ["change", this.change],
      ["sign_up", this.sign_up],
    ]);
    //
    // Get the button for submitting the event
    const submit: HTMLElement = this.get_element("submit");
    //
    // Add the event listener for submit
    submit.onclick = (evt: Event) => this.authorise(evt);
  }
  //
  // When the form data is submitted on the page
  async authorise(event: Event): Promise<void> {
    //
    // Prevent the default form submission
    event.preventDefault();
    //
    // Get the selected section
    const current: section = this.get_current_section();
    //
    // Perform the authorisation based on the selected operation
    const user: user | undefined = await current.authorise();
    //
    // If the user is not found, end the function
    if (!user) {
      return;
    }
    //
    // store the user in the session storage
  }
  //
  //Get the operation id from the selected radio button on the form
  get_current_section(): section {
    //
    // Get the selected operation
    const operation = this.get_operation();
    //
    // Find the section that corresponds to the selected operation
    const section = this.sections.get(operation);
    //
    // If the section is not found, throw an error
    if (!section) {
      throw new mutall_error("Section not found");
    }
    //
    return section;
  }
  //
  //get the operation selected by the user
  get_operation(): "login" | "sign_up" | "forgot" | "change" {
    //
    // Find the selected radio button for the authentication operation
    const radio_choice = <HTMLInputElement>(
      this.query_selector("input[name='choice']:checked")
    );
    //
    // Get the selected operation (login, sign_up, forgot, change)
    const choice: string = radio_choice.value;
    //
    //check if choice is a valid operation
    const valid_operations = ["login", "sign_up", "forgot", "change"];
    //
    if (!valid_operations.includes(choice))
      throw new mutall_error(
        `Operation:'${choice}' not valid,valid operations are "login", "sign_up", "forgot", "change"`
      );

    return <"login" | "sign_up" | "forgot" | "change">choice;
  }
}
//
// Base abstract class for all sections of the authoriser page
// A section is the area/part that we collect/create and process user inputs from
export abstract class section extends view {
  //
  // An array of ios that are the inputs of the section
  public ios: Map<string, io>;
  //
  // The id of the section element
  abstract section_id: string;
  //
  // This is the element that contains the inputs of the section
  public section_element: HTMLElement;

  constructor(parent?: view | undefined, options?: options | undefined) {
    super(parent, options);
    //
    // Get the section element
    this.section_element = this.get_section();
    //
    // Create the inputs
    this.ios = this.create_inputs();
  }
  //
  // Check if the inputs are valid
  abstract check_inputs(): boolean;
  //
  // Clear all the error mesaages in a section
  // Used when the user selects a different section
  clear_errors() {
    //
    // Loop through the ios and clear the error messages
    this.ios.forEach((io) => {
      //
      // io.clear_error();
      // io.report_error("");
    });
  }
  //
  // Verify the inputs in the database
  abstract verify(): Promise<user | undefined>;
  //
  // Collect the inputs
  create_inputs(): Map<string, io> {
    //
    // Create a map to store the input elements
    const input_map = new Map<string, io>();
    //
    // Get all the inputs in the section
    const inputs: NodeListOf<Element> =
      this.section_element.querySelectorAll("input");
    //
    // If the inputs are not found, throw an error
    if (inputs.length === 0) {
      throw new mutall_error("Inputs not found");
    }
    //
    // Loop through the inputs and store them in the map
    inputs.forEach((input) => {
      //
      // Get the name of the input
      const name: string | null = input.getAttribute("name");
      //
      // If the name is not found, throw an error
      if (!name) {
        throw new mutall_error("Input 'name' attribute not found");
      }

      //
      // Create an input io for the input
      const io = this.get_io(name);
      //
      // Store the input in the map
      input_map.set(name, io);
    });
    //
    // Return the map
    return input_map;
  }
  //
  //
  // Get the section element
  get_section(): HTMLElement {
    //
    // Find the login section
    const section = this.query_selector(this.section_id);
    //
    // If the section is not found, throw an error
    if (!section) {
      throw new mutall_error("Section not found");
    }
    //
    // Return the section
    return section;
  }
  //
  // Authenticate the user inputs by checking if they are valid
  // and if they are in the database
  async authorise(): Promise<user | undefined> {
    //
    // Check the inputs for the section
    const inputs_vaild: boolean = this.check_inputs();
    //
    //
    if (!inputs_vaild) {
      return;
    }
    //
    // Verify the inputs against data in the db
    const user: user | undefined = await this.verify();
    //
    return user;
  }
  //
  // Create an input io for the section
  get_io(name: string): input {
    //
    // Get the input element
    const proxy: HTMLElement = this.get_proxy(name);
    //
    // Get the input type
    const type: input_type = { type: "text" };
    //
    //
    const parent: view = this;
    //
    //
    const options: Partial<io_option> = {};
    //
    // Create the input object
    return new input(proxy, type, parent, options);
  }
  //
  // Get the proxy element of the input which is its label
  get_proxy(name: string): HTMLElement {
    //
    // Get the input
    const input = this.section_element.querySelector(`input[name='${name}']`);
    //
    // If the input is not found, throw an error
    if (!input) {
      throw new mutall_error("Input not found");
    }
    //
    // Get the label
    const label: HTMLElement | null = input.parentElement;
    //
    // If the label is not found, throw an error
    if (!label) {
      throw new mutall_error("Label not found");
    }
    //
    // Return the label
    return label;
  }
  async check_user(name: basic_value): Promise<
    | {
        user: number;
        name: string;
        password: string;
        email: string;
      }
    | undefined
  > {
    if (!name) return;
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
    //return a user
    return user[0];
  }
}

// Login section implementation
class login extends section {
  //
  // The name of the section
  section_id = "login";
  //
  //
  check_inputs(): boolean {
    const ios = this.ios;
    //
    // Check if name input is valid.ie not empty
    const name_io: io | undefined = ios.get("name");
    //
    if (!name_io) {
      throw new mutall_error("Name input not found");
    }
    //
    // If the name input is empty, report the error
    if (name_io.value?.toString().trim() === "") {
      name_io.report_error("Name is required");
      return false;
    }
    //
    // Check if password input is valid.ie not empty
    const password_io: io | undefined = ios.get("password");
    //
    if (!password_io) {
      throw new mutall_error("Password input not found");
    }
    //
    // If the password input is empty, report the error
    if (password_io.value?.toString().trim() === "") {
      password_io.report_error("Password is required");
      return false;
    }
    //
    // Check if password input is valid.ie not empty
    return true;
  }
  //
  // Log in an existing user by verifying credentials
  async verify(): Promise<user | undefined> {
    const ios = this.ios;
    //
    //Check if a user with the current name exists
    const current_user = await this.check_user(ios.get("name")?.value);
    //
    //If the user does not exist,show an error message
    if (!current_user) {
      //
      ios.get("name")?.report_error("Username does not match password");
      //
      ios.get("password")?.report_error("Password does not match username");
      return;
    }
    //
    //Verify the current users password
    const isPasswordVerified: boolean = await this.exec_php(
      "mutall",
      [],
      "password_verify",
      [ios.get("password")?.value, current_user.password]
    );
    //
    //If the password does not match the user name, show an error message
    if (!isPasswordVerified) {
      //
      //get the error span for the user name
      ios.get("name")?.report_error("User name does not match password");
      //
      ios.get("password")?.report_error("Password does not match user name");
      return;
    }
    //
    // Construct and return the user object for the current user
    return new user(current_user.name, current_user.user);
  }
}

class change extends section {
  section_id = "change";
}
class forgot extends section {
  section_id = "forgot";
}
class sign_up extends section {
  section_id = "sign_up";
}
