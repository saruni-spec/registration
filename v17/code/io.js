import { mutall_error, view, } from "../../../schema/v/code/schema.js";
import { io } from "./io_classes.js";
//
//Re-export the io, so that users dont have to import io_classes.js
export { io };
//
//Import all the classes as a module
import * as io_module from "./io_classes.js";
//
//To house the static procedures and properties of the io
export class io_parent extends view {
    //
    constructor(parent, options) {
        super(parent, options);
    }
    //
    //A factory method to create a named io from a given source -- a (proxy) html
    // element or iotype. Try to collect the relevant information that will be
    // used to create io then create the io and ensure that we pass the relevant
    // html elements to the created io
    parse(source) {
        //
        //Prepare to derive the io type and options
        let io_type;
        let options;
        let proxy;
        let name;
        let init_value;
        let anchor;
        //
        //The io specs come from an existing html....
        if (source instanceof Element) {
            //
            //Get the io type and use it to get specification of the desired io
            io_type = this.get_io_type(source);
            //
            //Collect the options of the io
            options = this.collect_io_options(source);
            //
            //Get the name
            name = this.get_name(source);
            //
            //Get the initial value if any
            init_value = this.get_value(source);
            //
            //TODO: Should we constraint the source to a html element????
            // Ensure that the source is a html element
            if (!(source instanceof HTMLElement))
                throw new mutall_error("The source must be a html element!!!");
            //
            //The anchor of the io
            anchor = { parent: this, element: source };
            //
            proxy = source;
        }
        //
        //The io specification is direct
        else {
            //
            //Destructure the specification
            options = source.options;
            io_type = source.type;
            proxy = this.create_proxy_element();
            name = source.name;
            init_value = source.init_value;
            anchor = source.anchor;
        }
        //
        //Use the iotype and options collected above to create the io
        return this.create_io(io_type, options, proxy, name, init_value, anchor);
    }
    //
    //Given an io element try to deduce the name to associate with the io
    //TODO: What about the case of the registration form where the sections have radio buttons????
    get_name(element) {
        //
        //Get any element with a name attribute
        const input = element.querySelector("[name]");
        //
        if (!input)
            throw new mutall_error("No input with 'name' was found on the given element");
        //
        //Read the value of the name attribute
        const name = input.getAttribute("name");
        //
        //If no name was found alert the user
        if (!name)
            throw new mutall_error("No name was found on the given source element", element);
        //
        return name;
    }
    //
    //Get the value of the given io. When reading the initial value the io_key will help in determining
    //how we get the value
    get_value(element) {
        //
        //Get the data type attribute of the element
        const io_key = element.getAttribute("data-io_key");
        //
        //If the data type is not specified throw an error
        if (!io_key)
            throw new mutall_error(`The io type is not specified for the given element`);
        //
        //Use the io_key to determine which element will produce the initial value in the given io source
        //TODO:Use the default query selector provided by js since we are to look for the elements
        //within the element
        switch (io_key) {
            //
            case "input":
                return element.querySelector("input").value;
            case "textarea":
                return element.querySelector("textarea").value;
            //
            //If We get to this point the type given is not in our various defined io types
            //alert the user
            default:
                throw new mutall_error(`The type ${io_key} is not supported. Check the data-io_key attributes on your form!!`);
        }
    }
    //Collect the io options around tge given elemenet
    collect_io_options(source) {
        //
        //Initialize the options
        const options = {};
        //
        //Collect the user friendly label
        const caption = source.querySelector("span:not(.error)")?.textContent;
        //
        //If the caption is not null then add it to the options
        if (caption)
            options.caption = caption;
        //
        //Get the id associated with the io if any is present
        options.id = this.get_id(source);
        //
        //Get the disabled status of the io
        options.disabled = this.get_disabled(source);
        //
        //Get the required status of the io
        options.required = this.get_required(source);
        //
        return options;
    }
    //
    //Get the id of the io if any is present
    get_id(element) {
        //
        //Get the id attribute of the element
        const id = element.getAttribute("data-id");
        //
        //If the id is not specified return undefined
        if (id)
            return id;
        //
        //Check if the proxy has an id. if present return it
        if (element.id)
            return element.id;
        //
        //When we get here we are sure that the id was not provided at the proxy level look for the
        //elements that will be used for data collection
        const input = element.querySelector("input, textarea , select");
        //
        //Get the id from the input if present
        return input?.id;
    }
    //
    //Get the disabled status of the io
    get_disabled(element) {
        //
        //Get the disabled attribute of the element
        const disabled = element.hasAttribute("data-disabled");
        //
        //If the disabled attribute present return it
        if (disabled)
            return disabled;
        //
        //Get any element that is used for data collection
        const input = element.querySelector("input, textarea , select");
        //
        //Check and return if the elements are disabled
        return input?.hasAttribute("disabled");
    }
    //
    //Get the required status of the io
    get_required(element) {
        //
        //Get the required attribute of the element
        const required = element.hasAttribute("data-required");
        //
        //If the required attribute present return it
        if (required)
            return required;
        //
        //Get any element that is used for data collection
        const input = element.querySelector("input, textarea , select");
        //
        //Check and return if the elements are required
        return input?.hasAttribute("required");
    }
    //Cretae the proxy elemenet
    create_proxy_element() {
        //
        //For now use a simple label element
        return this.document.createElement("label");
    }
    //Given an html element return the io type that is associated with it
    get_io_type(element) {
        //
        //Get the data type attribute of the element
        const io_key = element.getAttribute("data-io_key");
        //
        //If the data type is not specified throw an error
        if (!io_key)
            throw new mutall_error(`The io type is not specified for the given element`);
        //
        //Proceed to compile the io_type specification from the various
        // attributes of the io element
        const io_type = this.compile_iotype(io_key, element);
        //
        //Return the io type
        return io_type;
    }
    //
    //This is to coordinate the process of collection of the various attributes depending on the io
    //type. We will also compile the attributes into a partial io type structure since we will be collecting
    //the io_type as we go along
    compile_iotype(io_key, element) {
        //
        //Depending on the indicated data_type on the io element generate the most appropriate query
        //selector to get the data collection element
        switch (io_key) {
            //
            case "input":
                return this.get_input_io_type(element);
            case "textarea":
                return this.get_textarea_io_type(element);
            //
            //If We get to this point the type given is not in our various defined io types
            //alert the user
            default:
                throw new mutall_error(`The type ${io_key} is not supported. Check the data-io_key attributes on your form!!`);
        }
    }
    //
    //Read the various attributes that are expected in a text io and compose a
    // io_type of text.
    //A typical input io structure has the folowing constructor parameters:-
    /*
      {
          type: 'text';
          //
          //The Physical length and number of characters a text input could allow
          length: number;
      };
      */
    get_input_io_type(element) {
        //
        //Get the html element that is used for data collection. We alerdy know that we are dealing
        //with simple text cases
        const input = element.querySelector("input");
        //
        //A text input must be present since the io is a text io
        if (!input)
            throw new mutall_error("You said its a text io and there is no input element present", element);
        //
        //The general input type is text
        const input_type = input.type;
        //
        //The nmaximum nuber of characters that the given text input can have
        const length = this.get_maxlength(input);
        //
        //Now compile the complete iotype
        const io_type = {
            type: "input",
            parameters: [input_type, length],
        };
        //
        //return the  io type
        return io_type;
    }
    //
    get_textarea_io_type(element) {
        //
        //
        //Get the html element that is used for data collection. We alerdy know that we are dealing
        //with simple text cases
        const input = element.querySelector('input[type="textarea"]');
        //
        //A text input must be present since the io is a text io
        if (!input)
            throw new mutall_error("You said its a text io and there is no input element present", element);
        //
        //Get the limit of a a texta text area text
        const length = this.get_maxlength(input);
        //
        return { type: "textarea", parameters: [input.offsetWidth, length] };
    }
    //
    //Get the datalist associated with the given input element if any
    get_datalist(input) {
        //
        //Get the datalist element associated with the input
        const datalist = input.list;
        //
        //If there is no datalist return undefined
        if (!datalist)
            return;
        //
        //Get the options of the datalist
        const options = Array.from(datalist.options);
        //
        //Map the options to their values
        const values = options.map((option) => option.value);
        //
        //Return the values
        return values;
    }
    //
    //Get the length of a given text input by reading the size attribute and converting it into an
    //integer
    get_maxlength(element) {
        //
        //The max length is only applicable when the input is a text or a textarea element
        if (!(element instanceof HTMLInputElement ||
            element instanceof HTMLTextAreaElement))
            throw new mutall_error("The max length attribute is only applicable to text and textarea elements", element);
        //
        //Get the length attribute of the input
        const length = element.maxLength;
        //
        //If a length is present return it
        if (!(length === null))
            return length;
        //
        //If the length is not present Alert the user of this problem
        throw new mutall_error("The length attribute is not present. Check the console!", element);
    }
    //Retirns a named io
    create_io(io_type, options, proxy, name, init_value, anchor) {
        //
        //Destructure the io type to reveal its components
        const { type, parameters } = io_type;
        //
        //Ensure that the proxy is a html element
        if (!(proxy instanceof HTMLElement))
            throw new mutall_error("The anchor is not a html element");
        //
        //Create specific io, depending on the type
        switch (type) {
            case "input": {
                //
                const io = new io_module.input(name, anchor, options, init_value, ...parameters);
                //
                return [io.name, io];
            }
            case "textarea": {
                //
                //Create the io given the above arguments
                const io = new io_module.textarea(name, anchor, options, init_value, ...parameters);
            }
            default:
                throw new mutall_error(`The io type ${type} is not supported`);
        }
    }
}
