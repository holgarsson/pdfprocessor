# API Testing HTTP Files

This folder contains HTTP files for testing the PdfProcessor.API endpoints. These files can be used with Visual Studio Code's REST Client extension.

## Files Structure

- `register.http`: Test cases for user registration
- `login.http`: Test cases for user authentication
- `pdf_operations.http`: Test cases for PDF file processing
- `http-client.env.json`: Environment configuration

## Prerequisites

1. The API should be running (default: `http://localhost:5000`)
2. Create a `files` folder and add some PDF files for testing:
   - `files/example1.pdf`
   - `files/example2.pdf`

## Usage

1. First register a user using `register.http`
2. Login with the registered user using `login.http` (this will automatically set the auth token)
3. Use `pdf_operations.http` to test PDF operations (it will use the token from login)

## Environment Setup

The `http-client.env.json` file contains environment-specific configurations:

```json
{
  "dev": {
    "baseUrl": "http://localhost:5000",
    "authToken": ""
  }
}
```

To use a different environment:
1. Add a new environment section in `http-client.env.json`
2. Select the environment in VS Code's REST Client
3. The variables will be automatically used in the requests
