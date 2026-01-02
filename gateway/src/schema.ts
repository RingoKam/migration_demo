export const typeDefs = `#graphql
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
    getUser(id: ID!): User
    me: User
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
    isValidSeat: Boolean!
    seatType: String
    expirationDate: String
  }
`;

