# `mutall_mailer` Class Documentation

## Overview

The `mutall_mailer` class is a PHP implementation that extends PHPMailer library to provide a way to send emails from Mutall applications. It handles SMTP configuration, error handling, and sending of emails.

This class is currently beig used for password recovery for mutall users where users receive their new passwords in the emails when they forget their previous ones.
The implementation allows any mutall programmer to send emails from their applications through mutall's libary.

## Class Structure

### Namespace

```php
namespace mutall;
```

### Dependencies

- PHPMailer\PHPMailer\PHPMailer
- PHPMailer\PHPMailer\SMTP
- PHPMailer\PHPMailer\Exception

### Class Inheritance

`mutall_mailer` extends `PHPMailer`.

## Constants

This class does not define any constants.

## Properties

The class inherits all properties from the PHPMailer class and configures several of them during initialization:

The class inherits properties from PHPMailer, including:

SMTPDebug - Enables detailed debugging messages.

Host - Specifies the SMTP server host.

SMTPAuth - Enables authentication for the SMTP server.

Username - The SMTP server username (email address).

Password - The SMTP server password.

SMTPSecure - The encryption method for secure communication.

Port - The SMTP server port.

## Methods

### Constructor

```php

public function __construct()

```

The constructor initializes the PHPMailer instance with exception handling enabled, sets up the SMTP server configuration, and configures default sending addresses.

### Private Methods

#### `server_config()`

```php

private function server_config()

```

Configures the SMTP server connection details including:

- Debug level (disabled by default)
- SMTP server host (smtp.gmail.com)
- Authentication credentials
- Encryption type (TLS)
- Server port (587)

#### `set_source_addresses()`

```php

private function set_source_addresses()

```

Sets up the default sender and reply-to addresses for all emails sent through this class.

### Public Methods

#### `send_email()`

```php

public function send_email(
    string $receiver,
    string $subject,
    string $body,
    string $name = "",
    string $attachment = null,
    bool $is_html = false
): string

```

Sends an email to the specified recipient.

**Parameters:**

- `$receiver` (string) - Email address of the recipient
- `$subject` (string) - Subject of the email
- `$body` (string) - Content of the email
- `$name` (string, optional) - Name of the recipient, defaults to empty string
- `$attachment` (string, optional) - Path to an attachment file, defaults to null
- `$is_html` (bool, optional) - Whether the email body contains HTML, defaults to false

**Returns:**

- `string` - "ok" on success, or an error message on failure

## Usage Example

```php
// Create a new instance of the mailer
$mailer = new \mutall\mutall_mailer();

// Send a simple text email
$result = $mailer->send_email(
    "recipient@example.com",
    "Test Subject",
    "This is a test email body",
    "Recipient Name"
);

// Check if the email was sent successfully
if ($result === "ok") {
    echo "Email sent successfully!";
} else {
    echo "Error sending email: " . $result;
}

// Send an HTML email with an attachment
$result = $mailer->send_email(
    "recipient@example.com",
    "HTML Email with Attachment",
    "<h1>Hello World!</h1><p>This is an <b>HTML</b> email.</p>",
    "Recipient Name",
    "/path/to/attachment.pdf",
    true // Set to true for HTML emails
);
```

## HTML Form Implementation

Here's an example of how to use the `mutall_mailer` class with a JavaScript frontend for a password recovery feature:

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Password Recovery</title>
    <script type="module">
      import { exec } from "../../../schema/v/code/server.js";

      // Send an email to the user
      async function send_mail(e) {
        // Set the message and subject for the email
        const subject = "Password Recovery";
        const message = "Your new password is: 1234";

        // Get the email and name of the user
        const email = document.getElementById("email").value;
        const name = document.getElementById("user_name").value;

        // Use the mutall_mailer to send the email
        const result = await exec(
          // Name of the class
          "mutall_mailer",
          [],
          // Name of the method to send the email
          "send_email",
          // Parameters to the method,(email, subject, message, name)
          [email, subject, message, name]
        );

        // Check if the email was sent successfully
        if (result === "ok") {
          alert("New password sent to your email");
          return;
        }

        // If the email was not sent successfully
        alert(result);
      }

      // When the window loads, add the onclick event to the button
      window.onload = () => {
        const button = document.querySelector("button");
        button.onclick = send_mail;
      };
    </script>
  </head>
  <body>
    <form>
      <input type="text" id="email" placeholder="Email" />
      <input type="text" id="user_name" placeholder="Name" />
      <button type="button">Forgot Password</button>
    </form>
  </body>
</html>
```

## Security Considerations

1. The class uses hardcoded SMTP credentials. In a production environment, these should be stored in a secure configuration file or environment variables.
2. The example includes a password recovery implementation that sends a static password. In a real-world scenario, you should generate secure random passwords or tokens.
3. Consider implementing rate limiting to prevent abuse of email-sending capabilities.

## Contributions

To contribute to this class:

1. Enhance error handling for better debugging and logging
2. Add support for multiple recipients and CC/BCC options as parameters
3. Implement templates for common email types
4. Add support for loading configuration from environment variables
5. Create unit tests to verify functionality

## TypeScript Interface

For TypeScript projects interacting with this PHP class:

```typescript
//
// mutall_mailer class declaration
interface mutall_mailer {
  //
  // Send an email to the given recipient
  // Returns 'ok' on success or an error message on failure
  send_email(
    // Email address of the recipient
    receiver: string,
    // Subject of the email
    subject: string,
    // Content of the email
    body: string,
    // Name of the recipient (optional)
    name?: string,
    // Path to an attachment file (optional)
    attachment?: string,
    // Whether the email body contains HTML (optional)
    is_html?: boolean
  ): Promise<string>;
}
```
