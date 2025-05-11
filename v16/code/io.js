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
        let meta;
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
            proxy = source;
            //
            //metadata - the name the anchor were to hook the io and the initial value if any
            meta = this.get_metadata(source);
        }
        //
        //The io specification is direct
        else {
            options = source.options;
            io_type = source.type;
            proxy = undefined;
            //
            //metadata
            meta = {
                name: source.name,
                anchor: source.anchor,
                init_value: source.init_value,
            };
        }
        //
        //Use the iotype and options collected above to create the io
        return this.create_io(io_type, options, meta, proxy);
    }
    //
    //Collect the name the anchor where to hook the io and the initial value if any is present. This
    //information is imporatnt when creating an io.
    get_metadata(element) {
        //
        //Get the anchor
        const anchor = {
            //
            //The element is the parent of the source if it is present otherwise the current document body
            element: element.parentElement
                ? element.parentElement
                : this.document.body,
            parent: this,
        };
        //
        //Get the name of the io
        const { name, init_value } = this.read_metadata(element);
        //
        return { name, anchor, init_value };
    }
    //
    //Read the metadata of the io from the given element
    read_metadata(element) {
        //
        //Get the data io key attribute of the element
        const io_key = element.getAttribute("data-io_key");
        //
        //If the data type is not specified throw an error
        if (!io_key)
            throw new mutall_error(`The io type is not specified for the given element`);
        //
        //Depending on the indicated data_type on the io element generate the most appropriate query
        //selector to get the data collection element
        switch (io_key) {
            //
            //In the data-type text accoding to our text definition its an input of type text
            case "input":
                return this.read_input_metadata(element);
            //
            //The int io is an input of type number
            case "textarea":
                return this.read_textarea_metadata(element);
            //
            //If the key retrievet is not amonges the above alert the user we are not able to process it
            default:
                throw new mutall_error(`The type ${io_key} is not supported. Check the data-io_key attributes on your form!!`);
        }
    }
    //
    //Read input name and initial values
    read_input_metadata(element) {
        //
        //Get the input element
        const input = element.querySelector("input");
        //
        //If the input is not specified throw an error
        if (!input)
            throw new mutall_error(`No input element found in the io source!`);
        //
        //Get the name of the input
        const name = input.name;
        //
        //If the name is not specified throw an error
        if (!name)
            throw new mutall_error(`The name of the input is not specified for the given element`);
        //
        //Get the initial value of the input
        const init_value = input.value
            ? input.value
            : undefined;
        //
        return { name, init_value };
    }
    //
    //Read the name and value of a text area
    read_textarea_metadata(element) {
        //
        //Get the text area element
        const textarea = element.querySelector("textarea");
        //
        //If the text area is not specified throw an error
        if (!textarea)
            throw new mutall_error(`No text area element found in the io source!`);
        //
        //Get the name of the text area
        const name = textarea.name;
        //
        //If the name is not specified throw an error
        if (!name)
            throw new mutall_error(`The name of the text area is not specified for the given element`);
        //
        //Get the initial value of the text area
        const init_value = textarea.value
            ? textarea.value
            : undefined;
        //
        return { name, init_value };
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
            //IF We get to this point the type given is not in our various defined io types
            //alert the user
            default:
                throw new mutall_error(`The type ${io_key} is not supported. Check the data-io_key attributes on your form!!`);
        }
    }
    //
    //
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
    //
    //Retirns a named io
    create_io(io_type, options, metadata, proxy) {
        //
        //Destructure the io type to reveal its components
        const { type, parameters } = io_type;
        //
        //Destructure the metadata
        const { name, anchor, init_value } = metadata;
        //
        //Create specific io, depending on the type
        switch (type) {
            case "input": {
                //
                //Create the io given the above arguments
                const io = new io_module.input(name, anchor, options, init_value, ...parameters);
                //
                //If the proxy is present pass it on to the io
                if (proxy && proxy instanceof HTMLElement)
                    io.proxy = proxy;
                //
                return [io.name, io];
            }
            case "textarea": {
                //
                //Create the io given the above arguments
                const io = new io_module.textarea(name, anchor, options, init_value, ...parameters);
                //
                //If the proxy is present pass it on to the io
                if (proxy && proxy instanceof HTMLElement)
                    io.proxy = proxy;
                //
                return [io.name, io];
            }
            default:
                throw new mutall_error(`The io type ${type} is not supported`);
        }
    }
}
