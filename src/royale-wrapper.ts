import got from "got";
import * as Auth from "../token.json";

export default class RoyaleWrapper {
  __defaultOptions = {
    baseUrl: "https://api.royaleapi.com/",
    headers: {
      auth: "__authToken"
    }
  };

  constructor(authToken: string) {
    this.__defaultOptions.headers.auth = authToken;
  }

  getClan(tag: string, callback: (clan: Clan) => void) {
    got.get("/clan/" + tag.replace(/[#%]*/g, ""), this.__defaultOptions).then(
      response => {
        // console.log("Headers:", response.headers, " | Body:", response.body);
        callback(Convert.toClan(response.body));
      }
    );
  }

  getPlayer(tag: string, callback: (player: Player) => void) {
    got.get("/clan/" + tag.replace(/[#%]*/g, ""), this.__defaultOptions).then(
      response => {
        // console.log("Headers:", response.headers, " | Body:", response.body);
        callback(Convert.toPlayer(response.body));
      }
    );
  }
}

if (typeof require !== "undefined" && require.main === module) {
  console.log("Testing RoyaleWrapper...");
  new RoyaleWrapper(Auth.default.royaleToken)
    .getClan("#9Y9JC0PQ", (clan) => {
      console.log("Clan => name:", clan.name, " | tag:", clan.tag);
    });
}

// To parse this data:
//
//   import { Convert, Player } from "./file";
//
//   const player = Convert.toPlayer(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Player {
  tag:              string;
  name:             string;
  trophies:         number;
  rank:             undefined;
  arena:            Arena;
  clan:             Clan;
  stats:            Stats;
  games:            Games;
  leagueStatistics: LeagueStatistics;
  deckLink:         string;
  currentDeck:      Card[];
  cards:            Card[];
  achievements:     Achievement[];
}

export interface Achievement {
  name:   string;
  stars:  number;
  value:  number;
  target: number;
  info:   string;
}

export interface Arena {
  name:        string;
  arena:       string;
  arenaID:     number;
  trophyLimit: number;
}

export interface Card {
  name:               string;
  level:              number;
  maxLevel:           number;
  count:              number;
  rarity:             Rarity;
  requiredForUpgrade: number;
  leftToUpgrade?:     number;
  icon:               string;
  key:                string;
  elixir:             number;
  type:               Type;
  arena:              number;
  description:        string;
  id:                 number;
}

export enum Rarity {
  Common = "Common",
  Epic = "Epic",
  Legendary = "Legendary",
  Rare = "Rare",
}

export enum Type {
  Building = "Building",
  Spell = "Spell",
  Troop = "Troop",
}

export interface Clan {
  tag:           string;
  name:          string;
  description:   string;
  type:          string;
  score:         number;
  memberCount:   number;
  requiredScore: number;
  donations:     number;
  badge:         Badge;
  location:      Location;
  members:       Member[];
  tracking:      Tracking;
}

export interface Badge {
  name:     string;
  category: string;
  id:       number;
  image:    string;
}

export interface Location {
  name:      string;
  isCountry: boolean;
  code:      string;
}

export interface Member {
  name:              string;
  tag:               string;
  rank:              number;
  previousRank:      number;
  role:              Role;
  expLevel:          number;
  trophies:          number;
  donations:         number;
  donationsReceived: number;
  donationsDelta:    number;
  arena:             Arena;
  donationsPercent:  number;
}

export enum Role {
  CoLeader = "coLeader",
  Elder = "elder",
  Leader = "leader",
  Member = "member",
}

export interface Tracking {
  active:        boolean;
  legible:       boolean;
  available:     boolean;
  snapshotCount: number;
}

export interface Games {
  total:           number;
  tournamentGames: number;
  wins:            number;
  warDayWins:      number;
  winsPercent:     number;
  losses:          number;
  lossesPercent:   number;
  draws:           number;
  drawsPercent:    number;
}

export interface LeagueStatistics {
  currentSeason:  CurrentSeason;
  previousSeason: PreviousSeason;
  bestSeason:     BestSeason;
}

export interface BestSeason {
  id:       string;
  trophies: number;
}

export interface CurrentSeason {
  trophies:     number;
  bestTrophies: number;
}

export interface PreviousSeason {
  id:           string;
  trophies:     number;
  bestTrophies: number;
}

export interface Stats {
  clanCardsCollected: number;
  tournamentCardsWon: number;
  maxTrophies:        number;
  threeCrownWins:     number;
  cardsFound:         number;
  favoriteCard:       FavoriteCard;
  totalDonations:     number;
  challengeMaxWins:   number;
  challengeCardsWon:  number;
  level:              number;
}

export interface FavoriteCard {
  name:        string;
  id:          number;
  maxLevel:    number;
  icon:        string;
  key:         string;
  elixir:      number;
  type:        Type;
  rarity:      Rarity;
  arena:       number;
  description: string;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export namespace Convert {
  export function toPlayer(json: string): Player {
      return cast(JSON.parse(json), r("Player"));
  }

  export function playerToJson(value: Player): string {
      return JSON.stringify(uncast(value, r("Player")), undefined, 2);
  }
  export function toClan(json: string): Clan {
    return cast(JSON.parse(json), r("Clan"));
  }

  export function clanToJson(value: Player): string {
      return JSON.stringify(uncast(value, r("Clan")), undefined, 2);
  }
  function invalidValue(typ: any, val: any): never {
      throw Error(`Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`);
  }

  function jsonToJSProps(typ: any): any {
      if (typ.jsonToJS === undefined) {
          const map: any = {};
          typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
          typ.jsonToJS = map;
      }
      return typ.jsonToJS;
  }

  function jsToJSONProps(typ: any): any {
      if (typ.jsToJSON === undefined) {
          const map: any = {};
          typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
          typ.jsToJSON = map;
      }
      return typ.jsToJSON;
  }

  function transform(val: any, typ: any, getProps: any): any {
      function transformPrimitive(typ: string, val: any): any {
          if (typeof typ === typeof val) return val;
          return invalidValue(typ, val);
      }

      function transformUnion(typs: any[], val: any): any {
          // val must validate against one typ in typs
          const l = typs.length;
          for (let i = 0; i < l; i++) {
              const typ = typs[i];
              try {
                  return transform(val, typ, getProps);
              } catch (_) {}
          }
          return invalidValue(typs, val);
      }

      function transformEnum(cases: string[], val: any): any {
          if (cases.indexOf(val) !== -1) return val;
          return invalidValue(cases, val);
      }

      function transformArray(typ: any, val: any): any {
          // val must be an array with no invalid elements
          if (!Array.isArray(val)) return invalidValue("array", val);
          return val.map(el => transform(el, typ, getProps));
      }

      function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
          if (val === null || typeof val !== "object" || Array.isArray(val)) {
              return invalidValue("object", val);
          }
          const result: any = {};
          Object.getOwnPropertyNames(props).forEach(key => {
              const prop = props[key];
              const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
              result[prop.key] = transform(v, prop.typ, getProps);
          });
          Object.getOwnPropertyNames(val).forEach(key => {
              if (!Object.prototype.hasOwnProperty.call(props, key)) {
                  result[key] = transform(val[key], additional, getProps);
              }
          });
          return result;
      }

      if (typ === "any") return val;
      if (typ === null) {
          if (val === null) return val;
          return invalidValue(typ, val);
      }
      if (typ === false) return invalidValue(typ, val);
      while (typeof typ === "object" && typ.ref !== undefined) {
          typ = typeMap[typ.ref];
      }
      if (Array.isArray(typ)) return transformEnum(typ, val);
      if (typeof typ === "object") {
          return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
              : typ.hasOwnProperty("arrayItems")    ? transformArray(typ.arrayItems, val)
              : typ.hasOwnProperty("props")         ? transformObject(getProps(typ), typ.additional, val)
              : invalidValue(typ, val);
      }
      return transformPrimitive(typ, val);
  }

  function cast<T>(val: any, typ: any): T {
      return transform(val, typ, jsonToJSProps);
  }

  function uncast<T>(val: T, typ: any): any {
      return transform(val, typ, jsToJSONProps);
  }

  function a(typ: any) {
      return { arrayItems: typ };
  }

  function u(...typs: any[]) {
      return { unionMembers: typs };
  }

  function o(props: any[], additional: any) {
      return { props, additional };
  }

  function m(additional: any) {
      return { props: [] as any[], additional };
  }

  function r(name: string) {
      return { ref: name };
  }

  const typeMap: any = {
      "Player": o([
          { json: "tag", js: "tag", typ: "" },
          { json: "name", js: "name", typ: "" },
          { json: "trophies", js: "trophies", typ: 0 },
          { json: "rank", js: "rank", typ: undefined },
          { json: "arena", js: "arena", typ: r("Arena") },
          { json: "clan", js: "clan", typ: r("Clan") },
          { json: "stats", js: "stats", typ: r("Stats") },
          { json: "games", js: "games", typ: r("Games") },
          { json: "leagueStatistics", js: "leagueStatistics", typ: r("LeagueStatistics") },
          { json: "deckLink", js: "deckLink", typ: "" },
          { json: "currentDeck", js: "currentDeck", typ: a(r("Card")) },
          { json: "cards", js: "cards", typ: a(r("Card")) },
          { json: "achievements", js: "achievements", typ: a(r("Achievement")) },
      ], false),
      "Achievement": o([
          { json: "name", js: "name", typ: "" },
          { json: "stars", js: "stars", typ: 0 },
          { json: "value", js: "value", typ: 0 },
          { json: "target", js: "target", typ: 0 },
          { json: "info", js: "info", typ: "" },
      ], false),
      "Arena": o([
          { json: "name", js: "name", typ: "" },
          { json: "arena", js: "arena", typ: "" },
          { json: "arenaID", js: "arenaID", typ: 0 },
          { json: "trophyLimit", js: "trophyLimit", typ: 0 },
      ], false),
      "Card": o([
          { json: "name", js: "name", typ: "" },
          { json: "level", js: "level", typ: 0 },
          { json: "maxLevel", js: "maxLevel", typ: 0 },
          { json: "count", js: "count", typ: 0 },
          { json: "rarity", js: "rarity", typ: r("Rarity") },
          { json: "requiredForUpgrade", js: "requiredForUpgrade", typ: 0 },
          { json: "leftToUpgrade", js: "leftToUpgrade", typ: u(undefined, 0) },
          { json: "icon", js: "icon", typ: "" },
          { json: "key", js: "key", typ: "" },
          { json: "elixir", js: "elixir", typ: 0 },
          { json: "type", js: "type", typ: r("Type") },
          { json: "arena", js: "arena", typ: 0 },
          { json: "description", js: "description", typ: "" },
          { json: "id", js: "id", typ: 0 },
      ], false),
      "Clan": o([
          { json: "tag", js: "tag", typ: "" },
          { json: "name", js: "name", typ: "" },
          { json: "description", js: "description", typ: "" },
          { json: "type", js: "type", typ: "" },
          { json: "score", js: "score", typ: 0 },
          { json: "memberCount", js: "memberCount", typ: 0 },
          { json: "requiredScore", js: "requiredScore", typ: 0 },
          { json: "donations", js: "donations", typ: 0 },
          { json: "badge", js: "badge", typ: r("Badge") },
          { json: "location", js: "location", typ: r("Location") },
          { json: "members", js: "members", typ: a(r("Member")) },
          { json: "tracking", js: "tracking", typ: r("Tracking") },
      ], false),
      "Badge": o([
          { json: "name", js: "name", typ: "" },
          { json: "category", js: "category", typ: "" },
          { json: "id", js: "id", typ: 0 },
          { json: "image", js: "image", typ: "" },
      ], false),
      "Location": o([
          { json: "name", js: "name", typ: "" },
          { json: "isCountry", js: "isCountry", typ: true },
          { json: "code", js: "code", typ: "" },
      ], false),
      "Member": o([
          { json: "name", js: "name", typ: "" },
          { json: "tag", js: "tag", typ: "" },
          { json: "rank", js: "rank", typ: 0 },
          { json: "previousRank", js: "previousRank", typ: 0 },
          { json: "role", js: "role", typ: r("Role") },
          { json: "expLevel", js: "expLevel", typ: 0 },
          { json: "trophies", js: "trophies", typ: 0 },
          { json: "donations", js: "donations", typ: 0 },
          { json: "donationsReceived", js: "donationsReceived", typ: 0 },
          { json: "donationsDelta", js: "donationsDelta", typ: 0 },
          { json: "arena", js: "arena", typ: r("Arena") },
          { json: "donationsPercent", js: "donationsPercent", typ: 3.14 },
      ], false),
      "Tracking": o([
          { json: "active", js: "active", typ: true },
          { json: "legible", js: "legible", typ: true },
          { json: "available", js: "available", typ: true },
          { json: "snapshotCount", js: "snapshotCount", typ: 0 },
      ], false),
      "Games": o([
          { json: "total", js: "total", typ: 0 },
          { json: "tournamentGames", js: "tournamentGames", typ: 0 },
          { json: "wins", js: "wins", typ: 0 },
          { json: "warDayWins", js: "warDayWins", typ: 0 },
          { json: "winsPercent", js: "winsPercent", typ: 3.14 },
          { json: "losses", js: "losses", typ: 0 },
          { json: "lossesPercent", js: "lossesPercent", typ: 3.14 },
          { json: "draws", js: "draws", typ: 0 },
          { json: "drawsPercent", js: "drawsPercent", typ: 3.14 },
      ], false),
      "LeagueStatistics": o([
          { json: "currentSeason", js: "currentSeason", typ: r("CurrentSeason") },
          { json: "previousSeason", js: "previousSeason", typ: r("PreviousSeason") },
          { json: "bestSeason", js: "bestSeason", typ: r("BestSeason") },
      ], false),
      "BestSeason": o([
          { json: "id", js: "id", typ: "" },
          { json: "trophies", js: "trophies", typ: 0 },
      ], false),
      "CurrentSeason": o([
          { json: "trophies", js: "trophies", typ: 0 },
          { json: "bestTrophies", js: "bestTrophies", typ: 0 },
      ], false),
      "PreviousSeason": o([
          { json: "id", js: "id", typ: "" },
          { json: "trophies", js: "trophies", typ: 0 },
          { json: "bestTrophies", js: "bestTrophies", typ: 0 },
      ], false),
      "Stats": o([
          { json: "clanCardsCollected", js: "clanCardsCollected", typ: 0 },
          { json: "tournamentCardsWon", js: "tournamentCardsWon", typ: 0 },
          { json: "maxTrophies", js: "maxTrophies", typ: 0 },
          { json: "threeCrownWins", js: "threeCrownWins", typ: 0 },
          { json: "cardsFound", js: "cardsFound", typ: 0 },
          { json: "favoriteCard", js: "favoriteCard", typ: r("FavoriteCard") },
          { json: "totalDonations", js: "totalDonations", typ: 0 },
          { json: "challengeMaxWins", js: "challengeMaxWins", typ: 0 },
          { json: "challengeCardsWon", js: "challengeCardsWon", typ: 0 },
          { json: "level", js: "level", typ: 0 },
      ], false),
      "FavoriteCard": o([
          { json: "name", js: "name", typ: "" },
          { json: "id", js: "id", typ: 0 },
          { json: "maxLevel", js: "maxLevel", typ: 0 },
          { json: "icon", js: "icon", typ: "" },
          { json: "key", js: "key", typ: "" },
          { json: "elixir", js: "elixir", typ: 0 },
          { json: "type", js: "type", typ: r("Type") },
          { json: "rarity", js: "rarity", typ: r("Rarity") },
          { json: "arena", js: "arena", typ: 0 },
          { json: "description", js: "description", typ: "" },
      ], false),
      "Rarity": [
          "Common",
          "Epic",
          "Legendary",
          "Rare",
      ],
      "Type": [
          "Building",
          "Spell",
          "Troop",
      ],
      "Role": [
          "coLeader",
          "elder",
          "leader",
          "member",
      ],
  };
}