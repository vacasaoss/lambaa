# lambaa 🐑

A small framework, with very few dependencies to help build API's using AWS API Gateway & Lambda.

## Installation

```
npm i lambaa
```

```
npm i @types/aws-lambda -D
```

## Example Project

Have a look at a [Serverless project](examples/serverless) created using the `aws-nodejs-typescript` template.

## Guide

### Controllers

This library has the concept of controllers, similar to other web frameworks.

To create a controller, add the `@Controller()` decorator to a class and define routes using one of the [route decorators](src/decorators/Route.ts), e.g. `@GET("/ping")`.

> Currently only API Gateway, Scheduled, SQS and Dynamo DB stream events are supported.

```typescript
import { Controller, GET } from "lambaa"
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"

@Controller()
class ExampleController {
    @GET("/ping")
    public ping(event: APIGatewayProxyEvent): APIGatewayProxyResult {
        return { statusCode: 200, body: "pong" }
    }
}
```

### Setup

Create an `index.ts` file and export the handler.

```typescript
import { Router } from "lambaa"

const router = new Router().registerController(new PingController())

export const handler = router.getHandler()
```

#### Use With Serverless (`serverless.yml`)

Your handler can be referenced in your `serverless.yml` as follows:

```yml
functions:
    ping:
        handler: src/index.handler
    events:
        - http:
              path: ping
              method: get
```

> See the Serverless [example project](examples/serverless) for an example of how to use with `serverless.ts`.

##### API Gateway Generic Proxy Resources

Generic proxy resources are also supported using the `{proxy+}` path variable.

This can simplify the handler setup by allowing you to configure a single event to handle many different HTTP requests.

```yml
events:
    - http:
          path: /{proxy+}
          method: ANY
```

> Note: if you choose to use a proxy resource, API Gateway will forward all matching HTTP requests to your Lambda function. This will result in an error if the route is not handled by your application. It is recommended to handle this error using a middleware. Check for the `RouterError` type.

### Middleware

Middleware can be used to modify the request/response pipeline.

You can define middleware by using the `Middleware`, or `MiddlewareFunction` interfaces.

```typescript
import { MiddlewareFunction } from "lambaa"

const middleware: MiddlewareFunction = async (event, context, next) => {
    // Operate on the request here

    // Pass the event to the next middleware
    const response = await next(event, context)

    // Operate on the response here
    return response
}
```

```typescript
import { Middleware, Handler } from "lambaa"
import {
    APIGatewayProxyEvent,
    APIGatewayProxyResult,
    Context,
} from "aws-lambda"

class LogRequestMiddleware implements Middleware {
    public async invoke(
        event: APIGatewayProxyEvent,
        context: Context,
        next: Handler
    ): Promise<APIGatewayProxyResult> {
        console.log(
            `Received request - method: ${event.httpMethod}, resource: ${event.resource}`
        )

        const response = await next(event, context)

        return response
    }
}
```

The default middleware event/result types can be changed by specifying generic type parameters.

```typescript
const sqsMiddleware: MiddlewareFunction<SQSEvent, void> = async (
    event,
    context,
    next
) => {
    // ...
}
```

#### Applying Middleware

Middleware can be added to a controller method directly, by using the `@Use()` decorator.

```typescript
@Use(new AuthenticationMiddleware())
@Use(new LogRequestMiddleware())
@GET("/ping")
public ping(event: APIGatewayProxyEvent) {
    return {
        statusCode: 200,
        body: "pong",
    }
}
```

They can also be applied by being passed to the `@Controller()` decorator.

```typescript
@Controller({ middleware: [new LogRequestMiddleware()] })
class PingController {}
```

Finally, they can be applied globally using the `Router`.

```typescript
export const handler = new Router()
    .registerController(new PingController())
    .registerMiddleware(new LogRequestMiddleware())
    .getHandler()
```

### Request Parsing

Parameter decorators can be used to extract the parts of the request which we need.

```typescript
@GET("/user/{id}")
public getUser(
    @FromHeader("Accept") accept: string,
    @FromPath("id") id: string,
) {
    return {
        statusCode: 200,
        body: ""
    }
}
```

| Function        | Description                      | Type   |
| --------------- | -------------------------------- | ------ |
| `@FromPath()`   | Extract a path parameter         | string |
| `@FromQuery()`  | Extract a query string parameter | string |
| `@FromBody()`   | Extract JSON body data           | any    |
| `@FromHeader()` | Extract header value             | string |

##### Request Parsing Errors

If the required request parameters cannot be found, a `RequestError` will be thrown.

It is recommended to handle this using a middleware.

```typescript
class HandleRequestErrorMiddleware implements Middleware {
    public async invoke(
        event: APIGatewayProxyEvent,
        context: Context,
        next: Handler
    ): Promise<APIGatewayProxyResult> {
        try {
            return await next(event, context)
        } catch (err) {
            if (err instanceof RequestError) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        code: err.code,
                    }),
                }
            }

            throw err
        }
    }
}
```
