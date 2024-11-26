//
//Collect the inputs on a form and log them
export function submit_form() {
    //
    //get the form with the inputs
    const form = document.querySelector("form");
    //
    //add a funtion to collect inputs and log them to the form
    collect_inputs(form);
    //
    //add function to clear errors when user starts typing
    clear_errors(form);
}
//
//Function to validate required fields based on operation
function validate_required_fields(fieldset) {
    //
    //get all required inputs in the fieldset
    const inputs = fieldset.querySelectorAll('input:not([type="radio"])');
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
            ?.querySelector(".error");
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
function clear_errors(form) {
    //
    //add a change event listener to the form to catch all input changes
    form.addEventListener("input", () => {
        //
        //get all error spans in the form
        const error_spans = form.querySelectorAll(".error");
        //
        //clear all error messages
        error_spans.forEach((span) => (span.textContent = ""));
    });
}
//
//Check for choice made for the operation,collect needed inputs for the operation then log them
function collect_inputs(form) {
    //
    //add an event listener to the form for when its submited
    form.addEventListener("submit", (e) => {
        //
        //prevent default behaviour of the form
        e.preventDefault();
        //
        //get the radio buttons to find the opeartion choice made on the form
        const radio_choice = document.querySelector("input[name=choice]:checked");
        //
        //check if a radio button has been selected
        if (!radio_choice) {
            //
            //alert the user to select an option
            alert("Please select an option");
            return;
        }
        const choice = radio_choice.value;
        //
        //get the fieldset element with the inputs required for the opeartion chosen
        const field_set = document.getElementById(choice);
        //
        //validate required fields before proceeding
        if (!validate_required_fields(field_set)) {
            return;
        }
        //
        //get the username.The username is required in each operation
        const user_name = field_set.querySelector("input[type=text]");
        //
        //create the credentials object
        const credentials = {
            operation: choice,
            user_name: user_name.value,
        };
        //
        //check for the choic of opeartion to determine whic inputs are needed
        switch (choice) {
            case "login": {
                //
                //for login,get the password
                const login_password = field_set.querySelector("input[type=password]");
                //
                //add the password to the credentials
                credentials.password = login_password.value;
                break;
            }
            case "sign_up": {
                //
                //for sigm up,get the email,password and confirm password
                const email = field_set.querySelector("input[type=email]");
                //Since there are two password inputs,get both
                const passwords = field_set.querySelectorAll("input[type=password]");
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
                        ?.querySelector(".error");
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
                const email = field_set.querySelector("input[type=email]");
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
