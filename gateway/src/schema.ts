export const typeDefs = `#graphql
  # Directive to mark fields that require authentication
  # Usage: Add @auth to any query or mutation field
  # Example: me: User @auth
  directive @auth on FIELD_DEFINITION

  type User {
    id: ID!
    email: String!
    username: String!
    role: UserRole!
    licenseStatus: LicenseStatus!
  }

  enum UserRole {
    STUDENT
    TEACHER
    ADMIN
  }

  type Query {
    getUser(id: ID!): User @auth
    me: User @auth
  }

  type Mutation {
    login(credentials: LoginInput!): AuthPayload!
    register(input: RegisterInput!): AuthPayload!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    username: String!
    role: UserRole = STUDENT
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type LicenseStatus {
    id: ID!
    isValidSeat: Boolean!
    seatType: String
    expirationDate: String
  }
`;

