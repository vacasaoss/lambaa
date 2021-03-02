# Serverless - AWS Node.js Typescript

This project has been generated using the `aws-nodejs-typescript` template from the [Serverless framework](https://www.serverless.com/).

For detailed instructions, please refer to the [documentation](https://www.serverless.com/framework/docs/providers/aws/).

## Test your service

This template contains a single lambda function triggered by an HTTP request made on the provisioned API Gateway REST API `/ping` route with `GET` method.

### Locally

In order to test the hello function locally, run the following command:

- `npx sls invoke local -f handler --path mock.json`

Check the [sls invoke local command documentation](https://www.serverless.com/framework/docs/providers/aws/cli-reference/invoke-local/) for more information.

