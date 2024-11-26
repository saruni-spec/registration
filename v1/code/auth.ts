import { exec } from "../../../schema/v/code/server.js";
import { layout } from "../../../schema/v/code/questionnaire.js";
//
//Custom authentication (login,sign_up and forgot password) for mutall
export class auth {
  //
  constructor(
    public username: string,
    public password: string,
    public email?: string,
    public new_password?: string
  ) {}
  //
  //Check if a user exists
  async check_user(): Promise<{
    user_name: string;
    password: string;
    email: string;
  } | null> {
    //
    //query to get the user
    const sql = `
      SELECT user.user_name,user.password,user.email 
      FROM user 
      WHERE user_name = '${this.username}'`;
    //
    // Await the new user from the database
    const user: Array<{ user_name: string; password: string; email: string }> =
      await exec(
        //class
        "database",
        //
        //constructor
        ["mutall_users", false],
        "get_sql_data",
        [sql]
      );
    //
    //return null if a user does not exist
    if (!user) {
      return null;
    }
    //
    //return an existing user
    return user[0];
  }

  //
  //Create a session for the current logged in user
  async create_session(user: {
    user_name: string;
    email: string;
  }): Promise<void> {
    //
    //Save the user details to local storage as a JSON string
    const session = {
      user_name: user.user_name,
      email: user.email,
      is_authenticated: true,
    };
    localStorage.setItem("session", JSON.stringify(session));
  }

  //
  //Logout the current user by destroying their session
  async logout(): Promise<void> {
    //
    //Remove the session from local storage
    localStorage.removeItem("session");
    //
    //Redirect to login page
    window.location.href = "login page";
  }
  //
  //Check if a user is currently logged in
  isLoggedIn(): boolean {
    //
    //Get the session from local storage
    const session = localStorage.getItem("session");
    if (!session) return false;
    //
    //Parse and verify the session
    const sessionData = JSON.parse(session);
    return sessionData.is_authenticated === true;
  }

  //
  //This is our custom-made authentication (sign in) method using php hashing.
  //Used for loging in old users into the system
  async authenticate_user(): Promise<"ok" | string> {
    //
    //check if the user exists
    const user = await this.check_user();
    if (!user) {
      return "User does not exist";
    }
    //
    //authenticate their password
    if (password_verify(this.password, user.password)) {
      //
      //Create a session for the authenticated user
      await this.create_session(user);
      return "ok";
    }
    return "Credentials do not match";
  }
  //
  //Register the user requested in this login page
  //Used for signing up new users to the system
  async register_user(): Promise<"ok" | string> {
    //
    //check if the user exists
    const user = await this.check_user();
    if (user) {
      return "User already exists";
    }
    //
    //hash the users password
    const hashed_password = password_hash(this.password);
    //
    //create the layout for the exec method to update a user
    const layout: Array<layout> = [
      [hashed_password, "user", "password"],
      [this.username, "user", "username"],
      [this.email, "user", "email"],
    ];
    //
    //pass the layout to be executed to update the data
    const response: "ok" | string = await exec(
      "questionnaire",
      ["mutall_users"],
      "load_common",
      [layout]
    );
    if (response !== "ok") {
      console.log(response);
      return "Registration Failed";
    }
    return response;
  }
  //
  //Base method for updating user password
  //Takes a new password and updates it in the database
  private async update_password(new_password: string): Promise<"ok" | string> {
    //
    //check if the user exists
    const user = await this.check_user();
    if (!user) {
      return "User does not exist";
    }
    //
    //hash the new password
    const hashed_password = password_hash(new_password);
    //
    //create the layout for the exec method to update a user
    const layout: Array<layout> = [[hashed_password, "user", "password"]];

    //
    //pass the layout to be executed to update the data
    const response: "ok" | string = await exec(
      "questionnaire",
      ["mutall_users"],
      "load_common",
      [layout]
    );

    if (response !== "ok") {
      console.log(response);
      return "Password update Failed";
    }
    return response;
  }
  //
  //Reset password to a shared password when user forgets their password
  async reset_password(): Promise<string> {
    return this.update_password("shared_password");
  }
  //
  //Allow the user to change their password to a new one
  async change_password(): Promise<string> {
    if (!this.new_password) {
      return "New password is required";
    }
    return this.update_password(this.new_password);
  }
}
