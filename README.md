# Blogging-backend
Backend for the blogging platform

This repo holds the backend code for a seo friendly blogging platform.
It uses mongodb as the database and node with express in frontend.
It also has feature to login with google
[link to the frontend repo](https://github.com/K-Kumar-01/Blog-frontend)

# Running it on your local machine
1. Clone the repo
2. Cd into the folder and run `yarn install`
3. Run the following command to add devDependcies `yarn add nodemon dotenv morgan`
4. Create a .env file and have the following variables in that 
```
NODE_ENV=development
APP_NAME=
PORT=
CLIENT_URL=
DB_PASSWORD=
DB_NAME=
DB_DATABASE=
DB_LOCAL=
JWT_SECRET=
JWT_ACCOUNT_ACTIVATION=
SENDGRID_API_KEY=
SENDGRID_API_KEY_2=
EMAIL_TO=
EMAIL_FROM=
JWT_RESET_PASSWORD=
GOOGLE_CLIENT_ID=
```
5. Run `nodemon server.js` to open up the server. The server will be running on the port described in the .env file
