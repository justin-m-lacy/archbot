# archbot
general purpose discord bot

NOTE:

The bot only knows about game, logoff, and logon events that it sees while online. If the bot goes offline, it can miss events and misreport offline times, online times, etc. Also the bot will not know any user's time information until it sees them come online for the first time. The bot works best when running 24/7 or with only short downtimes.

INSTALLATION:

NOTE: node.js and npm are required to run the bot. Search online for help.

Open project directory and run `npm i`

Create an 'auth.json' file with the contents: {
	"token":"YOUR_BOT_TOKEN_HERE",
	"owner:"Your discord id",
	"admins":[
		"list of discord user ids"
	],
	"dev"{
		"token":"token for development version of bot"
	}
}
token is private and should NOT BE SHARED..

"admins" is a list of ids of Discord users who can control or kill the bot.
These is NOT the same as the Admins of Servers where your bot is active. They will have
Users on the admin list have the power to completely shutdown the bot program,
as well as future powers not yet defined.

"dev" is an optional object to use a Different Discord bot for debugging/development.
When running in dev mode, this alternate bot will be run instead of the primary bot
(Which may remain in use. )

auth.json should not be pushed to any public repository.

AFTER auth.json is configured, the bot can be run in a number of ways:

1) npm run start ( or npm run dev )

2) Open a command terminal and run node archbot.js A path to node.js must be in your command path for this to work.


Linux/Unix Run script:

3) archrun - bash script to run bot in background process.

Windows Run script:

4) archrun.bat - Double click the script to run the bot.