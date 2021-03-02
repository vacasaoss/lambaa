import { MiddlewareFunction } from "lambaa";

const logRequestMiddleware: MiddlewareFunction = async (
  event,
  context,
  next
) => {
  console.log(`Received request - ${JSON.stringify(event)}`);
  const response = await next(event, context);
  console.log(`Received response - ${JSON.stringify(response)}`);
  return response;
};

export default logRequestMiddleware;
