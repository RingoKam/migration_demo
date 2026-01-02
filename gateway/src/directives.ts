import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { GraphQLSchema, defaultFieldResolver } from 'graphql';
import { AuthContext } from './auth.js';

interface Context {
  auth: AuthContext;
}

/**
 * Authentication directive that checks if user is authenticated
 * Usage: Add @auth to any field in the schema
 */
export function authDirectiveTransformer(schema: GraphQLSchema) {
  return mapSchema(schema, {
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      const authDirective = getDirective(schema, fieldConfig, 'auth')?.[0];
      
      if (authDirective) {
        const { resolve = defaultFieldResolver } = fieldConfig;
        
        fieldConfig.resolve = async (source, args, context: Context, info) => {
          // Check authentication
          if (!context.auth.isAuthenticated || !context.auth.userId) {
            throw new Error('Authentication required');
          }
          
          // Call the original resolver
          return resolve(source, args, context, info);
        };
      }
      
      return fieldConfig;
    },
  });
}

