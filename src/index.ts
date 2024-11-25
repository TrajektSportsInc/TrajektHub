/** env variables */
import * as DOTENV from "dotenv";
const dotenv = DOTENV.config();
if (!!dotenv.error) {
  throw dotenv.error;
} else {
  console.debug(dotenv.parsed);
}

/** path resolution */
import moduleAlias from "module-alias";
moduleAlias.addAliases({
  "@root": __dirname,
  "@classes": __dirname + "/classes",
  "@controllers": __dirname + "/controllers",
  "@enums": __dirname + "/enums",
  "@interfaces": __dirname + "/interfaces",
  "@services": __dirname + "/services",
});

import MainServer from "@root/server";
MainServer.start();
