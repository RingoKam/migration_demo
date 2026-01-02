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
    featureToggles: FeatureToggleState!
  }

  type Mutation {
    login(credentials: LoginInput!): AuthPayload!
    register(input: RegisterInput!): MutationResult!
    updateFeatureToggles(input: FeatureToggleInput!): FeatureToggleState!
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
    license: LicenseInput
  }

  input LicenseInput {
    isValidSeat: Boolean
    seatType: String
    expirationDate: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type MutationResult {
    success: Boolean!
    message: String
    userId: ID
  }

  type LicenseStatus {
    id: ID!
    isValidSeat: Boolean!
    seatType: String
    expirationDate: String
  }

  type FeatureToggleState {
    userService: Boolean!
    licenseService: Boolean!
  }

  input FeatureToggleInput {
    userService: Boolean
    licenseService: Boolean
  }
`;

