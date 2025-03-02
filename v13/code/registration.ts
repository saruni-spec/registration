import {
  mutall_error,
  view,
  mymap,
  basic_value,
} from "../../../schema/v/code/schema.js";
import { input, input_type, io, io_option } from "../../../schema/v/code/io.js";
import { page } from "../../../outlook/v/code/outlook.js";
import { user } from "../../../outlook/v/code/app.js";
import { exec } from "../../../schema/v/code/server.js";
import { layout } from "../../../schema/v/code/questionnaire.js";
//
// The section id is the id of the fieldset section,ie the operations
export type section_id = "login" | "forgot" | "change" | "sign_up";
//
// The authoriser class is a page that is used to authorise a user to allow them access to
// mutall applications.
// It allows the user to login, register, or reset their password.
//
export class authoriser extends page {
  //Key for saving a user to the local storage
  static user_key: string = "last_logged_in_user";
  //
  //The sections of an authoriser: login, forgot, etc
  public sections: mymap<section_id, section>;
  //
  constructor(parent?: view) {
    //
    const url: string = "./authoriser.html";
    super(url, parent);
    //
    // Create the sections from the identified fieldsets in the html
    this.sections = this.get_sections();
    //
    // Get the button for submitting the event
    const submit: HTMLElement = this.get_element("submit");
    //
    // Add the event listener for submit
    submit.onclick = (evt: Event) => this.authorise(evt);
  }

  // Create the sections from the identified fieldsets in the html
  get_sections(): mymap<section_id, section> {
    //
    //Collect all the identified fields
    const list: NodeListOf<Element> =
      this.document.querySelectorAll("fieldset[id]");
    //
    //Convert the nodelist to an array of elements; an array has more processing o\
    //options than a nodelist
    const elements: Array<Element> = Array.from(list);
    //
    //Map the elements to section_id/section pairs
    const pairs: Array<[section_id, section]> = elements.map((element) =>
      this.create_section(element)
    );
    //
    //Use the pairs to create a map
    const collection = new mymap<section_id, section>("sections", pairs);

    //Return the map
    return collection;
  }

  //Use the identified fieldset element to create a section
  create_section(fieldset: Element): [id: section_id, section: section] {
    //
    //Get teh section id
    const id: string = fieldset.id;
    //
    //Create a section that matches the id of the fieldset
    let section: section;
    //
    switch (fieldset.id) {
      case "login":
        section = new login(fieldset, this);
        break;
      case "forgot":
        section = new forgot(fieldset, this);
        break;
      case "sign_up":
        section = new sign_up(fieldset, this);
        break;
      case "change":
        section = new change(fieldset, this);
        break;
      default:
        throw new mutall_error(`Section ${id} not known`);
    }
    //
    //We definitely know that id is indeed a section id
    return [<section_id>id, section];
  }

  //
  // When the form data is submitted on the page
  async authorise(event: Event): Promise<void> {
    //
    // Prevent the default form submission
    event.preventDefault();
    //
    // Perform the authorisation based on the selected operation
    const user: user | undefined = await this.section.authorise();
    //
    //Do not update the last user if the authorisaton failed
    if (!user) return;
    //
    //Save the user to the windows local storage
    window.localStorage.setItem(authoriser.user_key, JSON.stringify(user));
  }

  //
  //Returns the current section by looking up the the one that is_current
  get section(): section {
    //
    // Find the section that corresponds to the selected operation
    const section: section | undefined = Array.from(
      this.sections.values()
    ).find((sect) => sect.is_current);
    //
    // If the section is not found, throw an error
    if (!section) {
      throw new mutall_error("Section not found");
    }
    //
    return section;
  }
}
//
// Base abstract class for all sections of the authoriser page
// A section is the area/part that we collect/create and process user inputs from
export abstract class section extends view {
  //
  // An array of ios that are the inputs of the section
  public ios: mymap<string, io>;
  //
  //Shows if the section is current or not. We look at the input field named choice
  //for each section. If checked, then it is the current
  public get is_current(): boolean {
    //
    //Get the input element named choice
    const input: HTMLInputElement | null = this.document.querySelector(
      'input[name="choice"]'
    );
    //
    //It is an error if none is found
    if (!input)
      throw new mutall_error(`Input element named choice is not found`);
    //
    //The checked satatus of the element determines the result
    return input.checked;
  }
  //
  //Number of errors on this section on authorise. The number will be increase as
  // more and more errors are reported
  public errors: number = 0;

  // Fieldset is the html element that contains the inputs of the section
  constructor(public fieldset: Element, parent: view) {
    super(parent);
    //
    //Create the ios of this section
    this.ios = this.create_ios();
  }

  //Retirn undefined if authorisation fails;
  abstract authorise(): Promise<user | undefined>;

  //
  // Collect the inputs
  create_ios(): mymap<string, input> {
    //
    // Create a map to store the input elements
    const input_map = new mymap<string, input>("ios", []);
    //
    // Get all the inputs in the section
    const inputs: NodeListOf<Element> = this.fieldset.querySelectorAll("input");
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
      if (!name) throw new mutall_error("Input 'name' attribute not found");
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
  // Create an input io for the section
  get_io(name: string): input {
    //
    // Get the input element
    const proxy: HTMLElement = this.get_proxy(name);
    //
    // Get the input type
    const type: input_type = { type: "text" };
    //
    const parent: view = this;
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
    const input = this.fieldset.querySelector(`input[name='${name}']`);
    //
    // If the input is not found, throw an error
    if (!input) throw new mutall_error("Input not found");
    //
    // Get the label
    const label: HTMLElement | null = input.parentElement;
    //
    // If the label is not found, throw an error
    if (!label) throw new mutall_error("Label not found");
    //
    // Return the label
    return label;
  }
  //
  //Reporting errors where they occur
  report(io: io, msg: string): void {
    //
    //Get the reporting (span) element
    const element: HTMLElement = io.error;
    //
    //Now do the reporting
    element.textContent = msg;
    //
    //Raise teh error counter
    this.errors++;
  }
  //
  // Get the user from the database
  async get_user(name: basic_value): Promise<
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
export class login extends section {
  //
  public name: io;
  public password: io;
  //
  constructor(fieldset: Element, parent: view) {
    super(fieldset, parent);
    //
    this.name = this.ios.get("name");
    this.password = this.ios.get("password");
  }
  //
  //Authorise the user to login
  async authorise(): Promise<user | undefined> {
    //
    //Check the raw inputs
    if (!this.name.value) this.report(this.name, "Name is required");
    if (!this.password.value)
      this.report(this.password, "Password is required");
    //
    //Discontinue if there are errors
    if (this.errors > 0) return;
    //
    //Get the user (pk);
    const curr_user = await this.get_user(this.name.value);
    //
    //If the user does not exist, report so and discontinue
    if (!curr_user) {
      this.report(this.name, "User does not exist");
      return;
    }
    //
    //The user exist. Match passwords;
    const isPasswordVerified: boolean = await this.exec_php(
      "mutall",
      [],
      "password_verify",
      [<string>this.password.value, curr_user.password]
    );
    //
    //If the passwords do not match, report so and discontinue
    if (!isPasswordVerified) {
      this.report(this.password, "Password is incorrect");
      return;
    }
    //
    //Compile and return the user
    const name = <string>this.name.value;
    /*
      pk: number, 
      parent?: view, 
      options?: options
      */
    const User: user = new user(name, curr_user.user, this);
    //
    return User;
  }
}

export class change extends section {
  //
  // The user name, old password, new password and confirm password required to change the password
  public name: io;
  public old_password: io;
  public confirm_password: io;
  public new_password: io;
  //
  constructor(fieldset: Element, parent: view) {
    super(fieldset, parent);
    //
    this.name = this.ios.get("name");
    this.new_password = this.ios.get("new_password");
    this.confirm_password = this.ios.get("confirm_password");
    this.old_password = this.ios.get("old_password");
  }
  //
  //Authorise the user to change their password
  async authorise(): Promise<user | undefined> {
    //
    //Check the inputs
    if (!this.name.value) this.report(this.name, "Name is required");
    if (!this.old_password.value)
      this.report(this.old_password, "Old password is required");
    if (!this.confirm_password.value)
      this.report(this.confirm_password, "Confirm password is required");
    if (!this.new_password.value)
      this.report(this.new_password, "New password is required");

    //
    //Discontinue if there are errors
    if (this.errors > 0) return;
    //
    // check if the new password and the confirm password match
    if (this.new_password.value !== this.confirm_password.value) {
      this.report(this.confirm_password, "Passwords do not match");
      this.report(this.new_password, "Passwords do not match");
      return;
    }
    //
    // check if the user exists
    const curr_user = await this.get_user(this.name.value);
    //
    //If the user does not exist, report and discontinue
    if (!curr_user) {
      this.report(this.name, "User does not exist");
      return;
    }
    //
    // check if the old password matches the password in the database
    const isPasswordVerified: boolean = await this.exec_php(
      "mutall",
      [],
      "password_verify",
      [<string>this.old_password.value, curr_user.password]
    );
    //
    //If the passwords do not match, report so and discontinue
    if (!isPasswordVerified) {
      this.report(this.old_password, "Password is incorrect");
      return;
    }
    //
    // update the password
    //
    //Hash the password before storing it
    const hashed_password = await exec("mutall", [], "password_hash", [
      this.new_password.value,
    ]);
    //
    //Save the new password to the database
    const layout: Array<layout> = [
      [hashed_password, "user", "password"],
      [this.name.value, "user", "name"],
    ];
    //
    //Save the new password to the db using the exec method
    await super.exec_php("questionnaire", ["mutall_users"], "load_common", [
      layout,
    ]);
    //
    // Notify the user the password has been changed
    //
    // Return the user
    const new_user = new user(curr_user.name, curr_user.user);
    return new_user;
  }
}

export class forgot extends section {
  //
  //Only name is required. We use the recoverly email to send you a new password
  public name: io;
  //
  constructor(fieldset: Element, parent: view) {
    super(fieldset, parent);
    //
    this.name = this.ios.get("name");
  }
  //
  //Authorise the user to recover their password
  async authorise(): Promise<user | undefined> {
    //
    // check if the user exists
    const curr_user = await this.get_user(this.name.value);
    //
    //If the user does not exist, report and discontinue
    if (!curr_user) {
      this.report(this.name, "User does not exist");
      return;
    }
    //
    // Generate a new password
    //
    // send the new password to the user's email
  }
}

export class sign_up extends section {
  //
  // The user name, password, confirm password and email required to sign up a new user
  public name: io;
  public password: io;
  public confirm_password: io;
  //
  //For password reccoverly purposes
  public email: io;
  //
  constructor(fieldset: Element, parent: view) {
    super(fieldset, parent);
    //
    this.name = this.ios.get("name");
    this.password = this.ios.get("password");
    this.confirm_password = this.ios.get("confirm_password");
    this.email = this.ios.get("email");
  }
  //
  //Authorise the user to sign up
  async authorise(): Promise<user | undefined> {
    //
    //Check the inputs
    if (!this.name.value) this.report(this.name, "Name is required");
    if (!this.password.value)
      this.report(this.password, "Password is required");
    if (!this.confirm_password.value)
      this.report(this.confirm_password, "Confirm password is required");
    if (!this.email.value) this.report(this.email, "Email is required");
    //
    //Discontinue if there are errors
    if (this.errors > 0) return;
    //
    // check if the new password and the confirm password match
    if (this.password.value !== this.confirm_password.value) {
      this.report(this.confirm_password, "Passwords do not match");
      this.report(this.password, "Passwords do not match");
      return;
    }
    //
    //Check if the user exists
    const curr_user = await this.get_user(this.name.value);
    //
    //If the user exists, report and discontinue
    if (curr_user) {
      this.report(this.name, "User already exists");
      return;
    }
    //
    //Hash the password before storing it
    const hashed_password = await exec("mutall", [], "password_hash", [
      this.password.value,
    ]);
    //
    //
    //Create a layout with the new users information
    const layout: Array<layout> = [
      [hashed_password, "user", "password"],
      [this.name.value, "user", "name"],
      [this.email.value, "user", "email"],
    ];
    //
    //Save the new user to the database suing the exec method
    const response = await super.exec_php(
      "questionnaire",
      ["mutall_users"],
      "load_common",
      [layout]
    );
    //
    // if the response is not successful, report so
    if (response !== "ok") {
      this.report(this.name, "User not saved");
      return;
    }
    //
    // return the user
    //
    // get the new created user
    const new_user = await this.get_user(this.name.value);
    //
    //If the user does not exist, report and discontinue
    if (!new_user) {
      this.report(this.name, "User registration failed");
      return;
    }
    //
    //Create a new user object
    const cur_user = new user(new_user.name, new_user.user);
    return cur_user;
  }
}
