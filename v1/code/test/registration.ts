import { input } from "../../../io/v1/code/io.js";
//
//In this module,we render the inputs dynamically based on the selected option
//The inputs are rendered after an option is selected
//The new inputs replace the old inputs in the same section/div
//
//The possible inputs for choice
type choice = "login" | "sign_up" | "reset";
//
//Render the inputs needed for registration
export async function render_inputs(choice: choice) {
  //
  // Get the form to render the inputs on
  const form = document.getElementById("input-form") as HTMLFormElement;
  //
  // Create a container for holding inputs and the submit button
  const dynamic_content: HTMLDivElement = document.createElement("div");
  dynamic_content.id = "dynamic-content";
  //
  //define the anchor,needed when rendering the inputs to decide where the element the will be placed in
  const anchor: {
    element: HTMLElement;
  } = { element: dynamic_content };
  //
  // Create submit button
  const submit_button: HTMLButtonElement = document.createElement("button");
  submit_button.type = "button";
  //
  //Add the function to submit the inputs
  submit_button.onclick = submit_inputs;
  //
  // Render different inputs based on choice
  switch (choice) {
    //
    //render login inputs
    case "login":
      //
      //email input
      await new input(
        {
          annotation: "Email",
          io_type: "email",
          id: "login_email",
          name: "login_email",
          required: true,
        },
        anchor
      ).render();
      //
      //password input
      await new input(
        {
          annotation: "Password",
          io_type: "password",
          len: 20,
          id: "login_password",
          name: "login_password",
          required: true,
        },
        anchor
      ).render();
      //
      //set the tsxt on the button to 'login'
      submit_button.textContent = "Login";
      break;
    //
    //render the sign up inputs
    case "sign_up":
      //
      //email input
      await new input(
        {
          annotation: "Email",
          io_type: "email",
          id: "reg_email",
          name: "reg_email",
          required: true,
        },
        anchor
      ).render();
      //
      //password input
      await new input(
        {
          annotation: "Password",
          io_type: "password",
          len: 20,
          id: "reg_password",
          name: "reg_password",
          required: true,
        },
        anchor
      ).render();
      //
      //Confirm password input
      await new input(
        {
          annotation: "Confirm Password",
          io_type: "password",
          len: 20,
          id: "confirm_password",
          name: "confirm_password",
          required: true,
        },
        anchor
      ).render();
      //
      //set the text on the button
      submit_button.textContent = "Sign Up";
      break;
    //
    //render the rest password inputs
    case "reset":
      await new input(
        {
          annotation: "Email",
          io_type: "email",
          id: "reset_email",
          name: "reset_email",
          required: true,
        },
        anchor
      ).render();
      //
      //set the test on the button to reset password
      submit_button.textContent = "Reset Password";
      break;
  }
  //
  // Add inputs and submit button to the dynamic content container
  dynamic_content.appendChild(submit_button);
  //
  // Add the dynamic content container to the form
  form.appendChild(dynamic_content);
}
//
//validate the email inputs
function validate_email(email: string) {
  //
  //define the expression to validate the email
  //[^\s@] -Any characters that is not-(^) whitespace-(\s) or @
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email_regex.test(email);
}
//
//validate the password exists then validate its length
function validate_password(password: string) {
  //
  //password is present and is longer tha 5 character
  return password && password.length >= 6;
}
//
//FInd the error span closest to the current input and output the error message
function show_error(input_element: Element, error: string) {
  //
  //The inputs are all arranged as input->output->error
  //So we select the 2nd elemnt after the input element ie,the error
  const error_span = input_element.nextElementSibling?.nextElementSibling;
  if (error_span) {
    error_span.textContent = error;
  }
}
//
//define  a type for the credential to stucture the form output
interface Credentials {
  operation: choice;
  email: string;
  password?: string;
}
//
//Validate the inputs and log them after
function submit_inputs() {
  //
  // Get selected option (login/sign_up/reset_password)
  const selectedOption = document.querySelector(
    'input[name="choice"]:checked'
  ) as HTMLInputElement;

  //
  //make sure an option is selected
  if (!selectedOption) {
    alert("Please select an option first");
    return;
  }

  //
  //get the value of the selected option
  const option = selectedOption.value as choice;
  let credentials: Credentials = { operation: option } as Credentials;
  let is_valid = true;

  //
  //validate inputs based on selected option
  switch (option) {
    case "login": {
      //
      //get the email and password
      const login_email = document.querySelector(
        'input[name="login_email"]'
      ) as HTMLInputElement;
      const login_password = document.querySelector(
        'input[name="login_password"]'
      ) as HTMLInputElement;
      //
      //validate the login email
      if (!validate_email(login_email.value)) {
        show_error(login_email, "Please Enter a valid Email address");
        is_valid = false;
        break;
      }
      //
      //validate the login password
      if (!validate_password(login_password.value)) {
        show_error(
          login_password,
          "Password must be at least 6 characters long"
        );
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
      const reg_email = document.querySelector(
        'input[name="reg_email"]'
      ) as HTMLInputElement;
      const reg_password = document.querySelector(
        'input[name="reg_password"]'
      ) as HTMLInputElement;
      const confirm_password = document.querySelector(
        'input[name="confirm_password"]'
      ) as HTMLInputElement;
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
      const reset_email = document.querySelector(
        'input[name="reset_email"]'
      ) as HTMLInputElement;
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
    const submit_button = document.querySelector(
      'button[type="button"]'
    ) as HTMLButtonElement;
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
