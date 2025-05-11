# `mutall_mailer` Class Documentation

## Overview

The `mutall_mailer` class is a PHP implementation that extends PHPMailer library to provide a way to send emails from Mutall applications. It handles SMTP configuration, error handling, and sending of emails.

This class is currently beig used for password recovery for mutall users where users receive their new passwords in the emails when they forget their previous ones.
The implementation allows any mutall programmer to send emails from their applications through mutall's libary.

### Prerequisites

## PHPMailer Installation Guide

### Installation Methods

#### Method 1: Using Composer Global Installation

1. Open your terminal or command prompt.
2. Navigate to your project directory.
3. Run the following Composer command:

```bash
composer require phpmailer/phpmailer
```

#### Method 2: Using Local Composer (composer.phar)

1. Open your terminal or command prompt.
2. Navigate to your project directory.
3. Run the following command:

```bash
php composer.phar require phpmailer/phpmailer
```

### Differences Between Installation Methods

- **Global Composer**: Uses the globally installed Composer
- **Local Composer (composer.phar)**: Uses a local Composer installation,requires a composer.phar in your project directory

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

The class inherits all properties from the PHPMailer class and configures several of them during initialization

## Methods

### Constructor

```php


public function __construct()


```

The constructor initializes the PHPMailer instance .Requires no parameters.

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

## TypeScript Interface

```typescript
//
// mutall_mailer class declaration
class mutall_mailer {
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

## Usage Example

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
