import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { typeDefs } from './schema.js';
import { resolvers } from './resolvers.js';
import { createAuthContext, AuthContext } from './auth.js';
import { authDirectiveTransformer } from './directives.js';

const PORT = parseInt(process.env.PORT || '8080');

async function startServer() {
  // Create schema with directive transformer
  let schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  // Apply the auth directive transformer
  schema = authDirectiveTransformer(schema);

  const server = new ApolloServer({
    schema,
  });

  const { url } = await startStandaloneServer(server, {
    listen: { port: PORT },
    context: async ({ req }: { req: any }) => {
      const authHeader = req.headers.authorization;
      const authContext = await createAuthContext(authHeader);
      return { auth: authContext };
    },
  });

  console.log(`🚀 GraphQL Gateway ready at ${url}`);
  console.log(`📊 GraphiQL available at ${url}`);
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

