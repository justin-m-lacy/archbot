# archbot
general purpose discord bot

# INSTALLATION:

NOTE: node.js and `npm` or a similar package manager (`pnpm`, `yarn`) are required to run the bot.
Search online for help.

Open project directory and run `npm i`

# Configuration

## Authorization

Create an `auth.json` file in the project directory with the contents:
```
{
	"token":"YOUR_BOT_TOKEN_HERE",
	"owner:"Your discord id",
	"admins":[
		"list of discord user ids"
	],
	"dev"{
		"token":"token for development version of bot"
	}
}
```
`token` is private and should NOT BE SHARED or COMMITTED to a code repository.

"admins" is a list of ids of Discord users who can run commands to control or kill the bot.
These is NOT the same as the Admins of Servers where your bot is active.
Bot admins will have access to any commands that require admin privilege.

"dev" is an optional object to use a Different Discord bot for debugging/development.
When running in dev mode, this alternate bot will run instead of the primary bot
(Which may remain in use. )

auth.json should NOT be pushed to any public repository.


## Configuration Options

Create a file called `config.json` in the project directory with the following options:

```
{
	"pluginsdir": "./plugins/",
	"savedir": "./savedata",
	"cmdprefix": "!",
	"spamblock": {
		"71322723764242184": {
			"301832693452339780": true,
			"317196432374310868": true
		},
		"328369275237283926": {
			"412644371232641306": true
		},
		"612495527484046435": {
			"612577144123785776": true
		}
	},
	"dev": {
		"cmdprefix": ">",
		"savedir": "./devdata"
	}
}
```

`pluginsdir` - the directory of bot plugins. Cannot be changed without also changing tsconfig.json include paths.

`savedir` - directory where bot save files will be kept.

`cmdprefix` - prefix text that triggers bot commands. e.g. `!` in `!help`

`spamblock` - Set channelIds for each discord server where bot will not interact. Format is:

			```
			{
				"discord-server-id": {
					"discord-channel-id" : true,
					"another-discord-channel-id" : false
				}
			}
			```
Every discord channel id marked as `true` will block bot interactions for that discord channel.

`dev` - Separate `cmdprefix` and `savedir` options for a bot running in `development` mode.


## Compiling Bot

Run `npm build` or `pnpm build` from the command line.

The bot will be compiled to the `dist/` folder and can be run from that directory.


## Running Bot

AFTER `auth.json` and `config.json` have been configured, the bot can be run in a number of ways:

1) `npm run start` ( or `npm run dev` ) ( `pnpm`, `yarn` package managers can also be used. )

2) Open a command terminal and run node archbot.js A path to node.js must be in your command path for this to work.


Linux/Unix Run script:

3) archrun - bash script to run bot in background process.

Windows Run script:

4) archrun.bat - Double click the script to run the bot.