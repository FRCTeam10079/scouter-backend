# scouter-backend

Backend server for Scouter (scouting app) that runs on port 8000.

## Scripts

```
pnpm run setup
```
```
node setup.js
```
Sets up the environment by installing PNPM if necessary, installing all packages, creating a .env file, and updating the database. This should be run after cloning the repository. PostgreSQL should already be installed, and you should have an OpenAI API key.

```
pnpm setup:prod
```
```
node setup.js --prod
```
Does the same as `pnpm run setup` and `node setup.js`, but additionally builds the project for production.

```
pnpm dev
```
Runs the server in development mode with logging and automatic reloading.

```
pnpm build
```
Builds the project for production.

```
pnpm start
```
Runs the server in production mode. This will fail if the server has not been setup in production mode with either `pnpm setup:prod` or `node setup.js --prod`.

```
pnpm reset-db
```
Resets the database's data and seeds it with the test user.

```
pnpm check
```
Runs the linter and code formatter on the project without changing any files.

```
pnpm fix
```
Runs the linter and code formatter on the project, fixing any files that can be fixed automatically.

```
pnpm test
```
Runs all tests. `pnpm reset-db` should be run before and after tests to clean up leftover data.

```
pnpm test:watch
```
Does the same as `pnpm test` but with automatic reloading.

## Routes

Note that any route could return a 5XX status code. All 4XX status codes have the following response body where `code` is a SCREAMING_SNAKE_CASE error code:
```ts
{ code: string }
```
See https://fastify.dev/docs/latest/Reference/Errors/#fst_err_validation for generic error codes. Routes that are not for authentication require the Authorization header to be set with a valid bearer token. See https://github.com/fastify/fastify-jwt?tab=readme-ov-file#error-code for possible error codes.

### GET /me

Returns basic information about the user. If the account has been deleted, a 410 status code is returned with `code` set to `DELETED_ACCOUNT`. Upon success, a 200 status code is returned with the following response body:
```ts
{
  username: string, // 1-30 characters
  firstName: string, // 1-50 characters
  lastName: string, // 1-50 characters
}
```

### PATCH /me

Updates the user's profile and settings. If the content type is not multipart/form-data, a 406 status code is returned with `code` set to `FST_INVALID_MULTIPART_CONTENT_TYPE`. If the form data is invalid, a 400 status code is returned with `code` set to `INVALID_FORM_DATA`. If the account has been deleted, a 410 status code is returned with `code` set to `DELETED_ACCOUNT`. Upon success, a 204 status code is returned. The following schema is used for form data:
```ts
{
  username?: string, // 1-30 characters
  password?: string, // 1-50 characters
  firstName?: string, // 1-50 characters
  lastName?: string, // <=50 characters
  avatar?: File, // image
}
```

### DELETE /me

Deletes the user's account. A 204 status code is always returned.

### GET /users

Returns a list of users. A 200 status code is always returned with the following response body:
```ts
{
  id: number, // unsigned integer
  firstName: string, // 1-30 characters
  lastName: string, // 1-30 characters
}[]
```

### GET /avatar/:userId

Returns the specified user's avatar. `userId` must be an unsigned integer. If the user does not have a profile picture or their account has been deleted, a 404 status code is returned with `code` set to `NO_SUCH_AVATAR`. `size` is required as a query parameter to specify the size to load the image in and must an integer be between `32` and `512`. Upon success, a 200 status code is returned with a WebP image. See https://reactnative.dev/docs/image#gif-and-webp-support-on-android for supporting WebP on android.

### GET /report/:id

Returns a scouting report. `id` must be an unsigned integer. If the report does not exist, a 404 status code is returned with `code` set to `REPORT_NOT_FOUND`. Upon success, a 200 status code is returned with the following response body:
```ts
{
  user: {
    id: number, // unsigned integer
    firstName: string, // 1-30 characters
    lastName: string, // 1-30 characters
  } | null,
  createdAt: string, // ISO 8601 date-time
  eventCode: string, // 5 characters
  matchType: "QUALIFICATION" | "PLAYOFF",
  matchNumber: number, // integer 1-200
  teamNumber: number, // integer 1-20000
  notes: string, // <=400 characters
  minorFouls: number, // unsigned integer
  majorFouls: number, // unsigned integer
  auto: {
    notes: string, // <=400 characters
    movement: boolean,
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level1: boolean,
  },
  teleop: {
    notes: string, // <=400 characters
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level: "ONE" | "TWO" | "THREE" | "FAILED" | null,
  },
  endgame: {
    notes: string, // <=400 characters
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level: "ONE" | "TWO" | "THREE" | "FAILED" | null,
  },
}
```

### POST /report

Creates a scouting report. A 201 status code is always returned. The following request body schema is used:
```ts
{
  createdAt: string, // ISO 8601 date-time
  eventCode: string, // 5 characters
  matchType: "QUALIFICATION" | "PLAYOFF",
  matchNumber: number, // integer 1-200
  teamNumber: number, // integer 1-20000
  notes: string, // <=400 characters
  minorFouls: number, // unsigned integer
  majorFouls: number, // unsigned integer
  auto: {
    notes: string, // <=400 characters
    movement: boolean,
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level1: boolean,
  },
  teleop: {
    notes: string, // <=400 characters
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level: "ONE" | "TWO" | "THREE" | "FAILED" | null,
  },
  endgame: {
    notes: string, // <=400 characters
    hubScore: number, // unsigned integer
    hubMisses: number, // unsigned integer
    level: "ONE" | "TWO" | "THREE" | "FAILED" | null,
  },
}
```

### GET /reports

Returns a list of reports. Query parameters can be used to filter the results. The following schema is used for query parameters:
```ts
{
  userId?: number, // unsigned integer
  eventCode?: string, // 5 characters
  matchType?: "QUALIFICATION" | "PLAYOFF",
  minMatchNumber?: number, // integer 1-200
  maxMatchNumber?: number, // integer 1-200
  teamNumber?: number, // integer 1-20000
  maxMinorFouls?: number, // unsigned integer
  maxMajorFouls?: number, // unsigned integer
  autoMovement? boolean,
  autoMinHubScore?: number, // integer >=1
  autoMaxHubMisses?: number, // integer >=1
  autoLevel1?: boolean,
  teleopMinHubScore?: number, // integer >=1
  teleopMaxHubMisses?: number, // integer >=1
  endgameMinHubScore?: number, // integer >=1
  endgameMaxHubMisses?: number, // integer >=1
  take: number, // unsigned integer - return N reports
  skip: number, // unsigned integer - skip first N reports
}
```
A 200 status code is always returned with the following response body:
```ts
{
  id: number, // unsigned integer
  teamNumber: number, // integer 1-20000
  user: {
    id: number, // unsigned integer
    firstName: string, // 1-50 characters
    lastName: string, // 1-50 characters
  } | null,
}[]
```

### GET /rankings

Returns team ranking data using the OpenAI API. Upon success, a 200 status code is returned with the following response body:
```ts
{
  teamNumber: number, // integer 1-20000
  score: number, // 0-1 - aggregate score
  confidence: number, // 0-1
  overview: string, // Markdown
}[] // unsorted array
```
I would personally recommend having a slider on the frontend that uses a formula like $score\times(n^2+(1-n^2)\times confidence)$ to rank teams with a default value around $0.7$.

### Authentication

All authentication routes start with **/auth**. The user's ID can be accessed by decoding the access token and accessing the `id` value. Upon success, all authentication routes return a 201 status code with the following response body, except for **/auth/logout**:
```ts
{
  accessToken: string, // JWT
  refreshToken: string, // UUID V4
}
```

#### POST /auth/sign-up

Creates an account. If the team password is not "AlexaIsOurScoutingLead!", a 401 status code is returned with `code` set to `INCORRECT_TEAM_PASSWORD`. If the username is taken, a 409 status code is returned with `code` set to `USERNAME_TAKEN`. The following request body schema is used:
```ts
{
  username: string, // 1-30 characters
  password: string, // 1-50 characters
  firstName: string, // 1-50 characters
  lastName: string, // <=50 characters
  teamPassword: string, // >=1 character
}
```

#### POST /auth/login

Logs the user in. If the user does not exist, a 401 status code is returned with `code` set to `NO_SUCH_USER`. If the password is incorrect, a 401 status code is returned with `code` set to `INCORRECT_PASSWORD`. The following request body schema is used:
```ts
{
  username: string, // 1-30 characters
  password: string, // 1-50 characters
}
```

#### POST /auth/logout

Logs the user out by deleting the refresh token. The request body must be the refresh token. A 204 status code is always returned.

#### POST /auth/refresh

Creates a new access token and rotates the refresh token. This should be called when the access token expires. The request body should be the refresh token. If the refresh token is invalid, a 401 status code with `code` set to `INVALID_REFRESH_TOKEN`. If the refresh token has already expired, a 401 status code is returned with `code` set to `EXPIRED_REFRESH_TOKEN`.

## Test User

There is a test user with a username of "testuser" and password of "4FeetTallRisith?45!" that is useful for development.
