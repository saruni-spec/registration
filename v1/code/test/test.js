import { input } from "../../../io/v1/code/io.js";
//
//render all the inputs for registration
export async function render_inputs() {
    //
    //Get the form on which to render all the inputs and radio selectors
    const form = document.getElementById("input-form");
    //
    //Get the div on which to render the login inputs
    let login_div = document.getElementById("login_div");
    const login_anchor = {
        element: login_div,
    };
    //
    //Create the login inputs,login and password
    await new input({
        required: true,
        annotation: "email",
        io_type: "email",
        id: "login_email",
        name: "login_email",
    }, login_anchor).render();
    await new input({
        required: true,
        annotation: "password",
        io_type: "password",
        len: 20,
        id: "login_password",
        name: "login_password",
    }, login_anchor).render();
    //
    //Get the div on which to render the sign up inputs
    const sign_up_div = document.getElementById("sign_up_div");
    const sign_up_anchor = {
        element: sign_up_div,
    };
    //
    //Create th sign up inputs,email,password and confirm password
    await new input({
        required: true,
        annotation: "email",
        io_type: "email",
        id: "reg_email",
        name: "reg_email",
    }, sign_up_anchor).render();
    await new input({
        required: true,
        annotation: "password",
        io_type: "password",
        len: 20,
        id: "reg_password",
        name: "reg_password",
    }, sign_up_anchor).render();
    await new input({
        required: true,
        annotation: "password",
        io_type: "password",
        len: 20,
        id: "confirm_password",
        name: "confirm_password",
    }, sign_up_anchor).render();
    //
    //Get the div on which to render the reset password inputs
    const reset_div = document.getElementById("reset_div");
    const reset_anchor = {
        element: reset_div,
    };
    //
    //Create the reset pssword inputs,email
    await new input({
        required: true,
        annotation: "email",
        io_type: "email",
        id: "reset_email",
        name: "reset_email",
    }, reset_anchor).render();
    //
    // Add a button to submit the inputs and add it to the form
    const submitBtn = document.createElement("button");
    submitBtn.type = "button";
    submitBtn.textContent = "Submit";
    //
    //add the function to submit the inputs to the button
    submitBtn.onclick = submit_inputs;
    form.appendChild(submitBtn);
}
//
//validate the email inputs
function validate_email(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
//
//validate the password exists then validate its length
function validate_password(password) {
    return password && password.length >= 6;
}
//
//FInd the error span closest to the current inpt and output the error message
function show_error(input_element, error) {
    const error_span = input_element.nextElementSibling?.nextElementSibling;
    if (error_span) {
        error_span.textContent = error;
    }
}
//
//Validate the inputs and log them after
function submit_inputs() {
    //
    // Get selected option (login/sign_up/reset_password)
    const selectedOption = document.querySelector('input[name="choice"]:checked');
    //
    //Make sure an option is selected
    if (!selectedOption) {
        alert("Please select an option first");
        return;
    }
    //
    //Get the value of the selected option
    const option = selectedOption.value;
    let credentials = { operation: option };
    let is_valid = true;
    //
    //Validate inputs based on selected option
    switch (option) {
        case "login": {
            //
            //Get the email and password
            const login_email = document.querySelector('input[name="login_email"]');
            const login_password = document.querySelector('input[name="login_password"]');
            //
            //Validate the login email
            if (!validate_email(login_email.value)) {
                show_error(login_email, "Please Enter a valid Email address");
                is_valid = false;
                break;
            }
            //
            //Validate the login password
            if (!validate_password(login_password.value)) {
                show_error(login_password, "Password must be at least 6 characters long");
                is_valid = false;
                break;
            }
            credentials = {
                operation: "login",
                email: login_email.value,
                password: login_password.value,
            };
            break;
        }
        case "sign_up": {
            //
            //get all sign up form inputs
            const reg_email = document.querySelector('input[name="reg_email"]');
            const reg_password = document.querySelector('input[name="reg_password"]');
            const confirm_password = document.querySelector('input[name="confirm_password"]');
            //
            //validate the registration email
            if (!validate_email(reg_email.value)) {
                show_error(reg_email, "Please enter a valid email address");
                is_valid = false;
                break;
            }
            //
            //validate the registration password
            if (!validate_password(reg_password.value)) {
                show_error(reg_password, "Password must be at least 6 characters long");
                is_valid = false;
                break;
            }
            //
            //check if the passwords match
            if (reg_password.value !== confirm_password.value) {
                show_error(confirm_password, "Passwords do not match");
                is_valid = false;
                break;
            }
            credentials = {
                operation: "sign_up",
                email: reg_email.value,
                password: reg_password.value,
            };
            break;
        }
        case "reset": {
            //
            //get the reset email
            const reset_email = document.querySelector('input[name="reset_email"]');
            //
            //validate the reset email
            if (!validate_email(reset_email.value)) {
                show_error(reset_email, "Please enter a valid email address");
                is_valid = false;
                break;
            }
            credentials = {
                operation: "reset",
                email: reset_email.value,
            };
            break;
        }
    }
    //
    //if the inputs are valid, log the data and show success
    if (is_valid) {
        //
        // Log the form data
        console.log("Form submitted successfully:", credentials);
        //
        // Add visual feedback
        const submit_button = document.querySelector('button[type="button"]');
        if (submit_button) {
            //
            //set te button content to 'success
            submit_button.textContent = "Success!";
            //
            //change the color of the button
            submit_button.style.backgroundColor = "#10B981";
        }
    }
}
