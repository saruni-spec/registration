//
//define the type for credentials
interface credentials {
  operation: choice;
  user_name: string;
  email?: string;
  password?: string;
}
//
//the possible choices that are allowed
type choice = "login" | "sign_up" | "forgot" | "change";
//
//Collect the inputs on a form and log them
export function submit_form() {
  //
  //get the form with the inputs
  const form = document.querySelector("form") as HTMLFormElement;
  //
  //add a funtion to collect inputs and log them to the form
  collect_inputs(form);
  //
  //add function to clear errors when user starts typing
  clear_errors(form);
}

//
//Function to validate required fields based on operation
function validate_required_fields(fieldset: HTMLElement): boolean {
  //
  //get all required inputs in the fieldset
  const inputs = fieldset.querySelectorAll(
    'input:not([type="radio"])'
  ) as NodeListOf<HTMLInputElement>;
  //
  //flag to track if all inputs are valid
  let is_valid = true;

  //
  //check each input
  inputs.forEach((input) => {
    //
    //get the error span for this input
    const error_span = input
      .closest("label")
      ?.querySelector(".error") as HTMLSpanElement;
    //
    //clear any existing error
    error_span.textContent = "";

    //
    //check if the input is empty
    if (input.value.trim() === "") {
      //
      //set error message
      error_span.textContent = "This field is required";
      is_valid = false;
    }
  });

  return is_valid;
}
//
//Function to clear error messages when any input in the form changes
function clear_errors(form: HTMLFormElement) {
  //
  //add a change event listener to the form to catch all input changes
  form.addEventListener("input", () => {
    //
    //get all error spans in the form
    const error_spans = form.querySelectorAll(
      ".error"
    ) as NodeListOf<HTMLSpanElement>;
    //
    //clear all error messages
    error_spans.forEach((span) => (span.textContent = ""));
  });
}
//
//Check for choice made for the operation,collect needed inputs for the operation then log them
function collect_inputs(form: HTMLFormElement) {
  //
  //add an event listener to the form for when its submited
  form.addEventListener("submit", (e) => {
    //
    //prevent default behaviour of the form
    e.preventDefault();
    //
    //get the radio buttons to find the opeartion choice made on the form
    const radio_choice = document.querySelector(
      "input[name=choice]:checked"
    ) as HTMLInputElement;
    //
    //check if a radio button has been selected
    if (!radio_choice) {
      //
      //alert the user to select an option
      alert("Please select an option");
      return;
    }
    const choice = radio_choice.value as choice;
    //
    //get the fieldset element with the inputs required for the opeartion chosen
    const field_set = document.getElementById(choice) as HTMLElement;
    //
    //validate required fields before proceeding
    if (!validate_required_fields(field_set)) {
      return;
    }
    //
    //get the username.The username is required in each operation
    const user_name = field_set.querySelector(
      "input[type=text]"
    ) as HTMLInputElement;
    //
    //create the credentials object
    const credentials: credentials = {
      operation: choice,
      user_name: user_name.value,
    };
    //
    //check for the choic of opeartion to determine whic inputs are needed
    switch (choice) {
      case "login": {
        //
        //for login,get the password
        const login_password = field_set.querySelector(
          "input[type=password]"
        ) as HTMLInputElement;
        //
        //add the password to the credentials
        credentials.password = login_password.value;
        break;
      }
      case "sign_up": {
        //
        //for sigm up,get the email,password and confirm password
        const email = field_set.querySelector(
          "input[type=email]"
        ) as HTMLInputElement;
        //Since there are two password inputs,get both
        const passwords = field_set.querySelectorAll(
          "input[type=password]"
        ) as NodeListOf<HTMLInputElement>;
        // Access the first as password and the second as confirmPassword
        const password = passwords[0];
        const confirmPassword = passwords[1];
        //
        //validate the passwords match
        if (password.value !== confirmPassword.value) {
          const error = "Passwords dont match";
          //
          //get the closest error span to output the error messsage
          const error_span = confirmPassword
            .closest("label")
            ?.querySelector(".error") as HTMLSpanElement;
          error_span.textContent = error;
          return;
        }
        //
        //add the inputs to the credentials
        credentials.email = email.value;
        credentials.password = password.value;
        break;
      }
      case "forgot": {
        //
        //get the email for reset password
        const email = field_set.querySelector(
          "input[type=email]"
        ) as HTMLInputElement;
        credentials.email = email.value;
        break;
      }
      //
      //when no choice is made
      default:
        alert("Please choose an operation");
    }
    //
    //log the credentials
    console.log(credentials);
    // const reg_user = new outlook(credentials.user_name, credentials.password);
    // reg_user.register_user();
  });
}
