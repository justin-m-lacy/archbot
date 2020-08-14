# archbot
general purpose discord bot

this was my first-ever javascript project based off node and npm so it's a bit rough around the edges. The bot works though RPG has an error at the moment when attempting to create new chars. yerg. Chess is dubious.

NOTE:

The bot only knows about game, logoff, and logon events that it sees while online. If the bot goes offline, it can miss events and misreport offline times, online times, etc. Also the bot will not know any user's time information until it sees them come online for the first time. The bot works best when running 24/7 or with only short downtimes.

INSTALLATION:

Requires node.js and npm to run the bot.

Open project directory and run `npm i`

Create an 'auth.json' file with the contents: { "token":"YOUR_BOT_TOKEN_HERE"} This token is private and should not be shared.

Open a command terminal and type: node archbot.js A path to node.js must be in your command path for this to work.

I made the bot before I understood npm package scripts, but I might add one when I have the time.

On Windows you can create a shortcut to command.exe, select Properties, and add '/k node archbot.js' to the target. Then I change the "Start In" directory to the bot directory. This makes for easy double-click quickstart.
