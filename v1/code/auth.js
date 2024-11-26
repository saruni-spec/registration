import { user } from "../../../outlook/v/code/app.js";
import { exec } from "../../../schema/v/code/server.js";
//
//Custom authentication (login,sign_up and forgot password) for mutall
export class outlook {
    username;
    password;
    //
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }
    //
    //This is our custom-made authentication (sign in) method using php hashing.
    //Used for loging in old users into the system
    async authenticate_user() {
        //
        //Authenticate the user using the given user_name and password
        const ans = await exec("database", ["mutall_users"], "authenticate", [
            this.username,
            this.password,
        ]);
        //
        //If the answer is ok, return a valid user; otherwise return the error.
        return ans.result === "ok"
            ? new user(this.username, ans.pk)
            : new Error(ans.msg);
    }
    //Register the user requested in this login page
    //Used for signing up new users to the system
    async register_user() {
        //
        //Create the user account and return the user's primary key
        const ans = await exec("database", ["mutall_users"], "register", [
            this.username,
            this.password,
        ]);
        //
        //use load_common to add email
        //
        //If the result is ok, return a new user; otherise, return an error
        console.log(ans);
        return ans.result === "ok"
            ? new user(this.username, ans.pk)
            : new Error(ans.msg);
    }
    //
    //Custom forgot password funtion
    //Takes a username,checks if the user exists and selects their email
    //Sends an email with a page redirect to reset their password or send them their current password
    reset_password() {
        //
        //Use the email and username to get the current user
        //
        //reset their password to the shared password
    }
    change_password() { }
}
