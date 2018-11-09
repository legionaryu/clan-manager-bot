"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const royale_wrapper_1 = __importDefault(require("./royale-wrapper"));
const Discord = __importStar(require("discord.js"));
const Winston = __importStar(require("winston"));
const Auth = __importStar(require("../token.json"));
// - Config the logger
const logger = Winston.createLogger({
    level: "silly",
    format: Winston.format.combine(Winston.format.colorize({ all: true }), Winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss"
    }), Winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)),
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
const royaleWrapper = new royale_wrapper_1.default(Auth.default.royaleToken);
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
client
    .login(Auth.default.token)
    .then(response => {
    logger.info("Logged into these channels: " + client.channels);
    for (const [id, channel] of client.channels) {
        if (id === "441596084033421323") {
            channel.send("Estou aqui!");
        }
    }
})
    .catch(error => {
    logger.error(error);
});
//# sourceMappingURL=index.js.map