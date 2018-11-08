import * as Discord from "discord.js";
import * as Winston from "winston";
import * as PouchDB from "pouchdb";
import * as Auth from "../token.json";

// - Config the logger
const logger = Winston.createLogger({
  level: "silly",
  format: Winston.format.combine(
    Winston.format.colorize({ all: true }),
    Winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss"
    }),
    Winston.format.printf(
      info => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new Winston.transports.Console({ handleExceptions: true }),
    new Winston.transports.File({ filename: "error.log", level: "error" }),
    new Winston.transports.File({ filename: "combined.log" })
  ]
});

const client = new Discord.Client();

logger.info("Starting bot server...");

client.once("ready", () => {
  logger.info("Ready!");

  client.user.setPresence({
    game: {
      name: "Clash Royale",
      type: "WATCHING"
    },
    status: "online"
  });
});

client.on("message", msg => {
  for (const user of msg.mentions.users) {
    if (user[0] === client.user.id) {
      if (msg.content.indexOf("ping") > -1) {
        logger.info("Message:", msg.cleanContent);
        msg.reply("Pong!");
      }
      else {
        msg.reply("tenta me mandar um 'ping'");
      }
      break;
    }
  }
});

client.login(Auth.default.token);
