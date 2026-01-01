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
  }

  type Mutation {
    login(credentials: LoginInput!): AuthPayload!
  }

  input LoginInput {
    email: String!
    password: String!
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

