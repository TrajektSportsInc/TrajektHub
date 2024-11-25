# node-server-ts

## Environment

Create a local `.env` file based on the `.env.example` file's structure.

## Scripts

 * `npm run build`: build for deployment into `./dist` directory (run this before `start:dist`)
 * `npm run start`: start the TypeScript server using `ts-node`
 * `npm run start:dev`: start the server and listen for changes to the source files
 * `npm run start:dist`: start the JavaScript server using `node` (assumes you've already run `build`)
