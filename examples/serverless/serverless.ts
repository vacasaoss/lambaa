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
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        },
        lambdaHashingVersion: "20201221",
    },
    // import the function via paths
    functions: { handler },
}

module.exports = serverlessConfiguration
