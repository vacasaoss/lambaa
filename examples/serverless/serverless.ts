import type { AWS } from "@serverless/typescript"

const handler = {
    handler: "src/index.handler",
    events: [
        {
            http: {
                method: "get",
                path: "ping",
            },
        },
        {
            http: {
                method: "get",
                path: "users",
            },
        },
        {
            sqs: {
                arn: {
                    "Fn::GetAtt": ["exampleQueue", "Arn"],
                },
            },
        },
    ],
}

const serverlessConfiguration: AWS = {
    service: "serverless-demo",
    frameworkVersion: "2",
    custom: {
        webpack: {
            webpackConfig: "./webpack.config.js",
            includeModules: true,
        },
    },
    plugins: ["serverless-webpack"],
    provider: {
        name: "aws",
        runtime: "nodejs14.x",
        apiGateway: {
            minimumCompressionSize: 1024,
            shouldStartNameWithService: true,
        },
        environment: {
            EXAMPLE_QUEUE_ARN: {
                "Fn::GetAtt": ["exampleQueue", "Arn"],
            },
        },
        lambdaHashingVersion: "20201221",
    },
    functions: { handler },
    resources: {
        Resources: {
            exampleQueue: {
                Type: "AWS::SQS::Queue",
                Properties: {
                    QueueName: "example-queue",
                },
            },
        },
    },
}

module.exports = serverlessConfiguration
