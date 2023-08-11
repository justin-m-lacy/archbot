import { BotContext } from '@src/bot/botcontext';
import { AlreadyInGameError, GamePhase, PlayerState, PlayerRole } from './types';
const NO_VOTE = "NO_VOTE";

type Vote = string | typeof NO_VOTE;

const RolePercents = {

    [PlayerRole.Wolf]: 0.2,
    [PlayerRole.Villager]: 0.8

}

interface WereRole {

    readonly role: PlayerRole;

    target(self: WerePlayer, targ: WerePlayer, game: WerewolfGame): void;


}

const VillagerRole = {

    init(bot: BotContext, game: WerewolfGame) {

    },

    vote(self: WerePlayer, game: WerewolfGame): void {

    }

}

const WolfRole = {

    role: PlayerRole.Wolf,

    target(self: WerePlayer, targ: WerePlayer, game: WerewolfGame) {
    }

};

const ThiefRole = {

    role: PlayerRole.Thief,

    target(self: WerePlayer, targ: WerePlayer, game: WerewolfGame) {
    }

}

export class WerePlayer {

    public readonly id: string;

    private role: PlayerRole = PlayerRole.Villager;

    private state: PlayerState = PlayerState.Alive;

    constructor(id: string) {

        this.id = id;

    }

    getState() {
        return this.state;
    }
    setState(state: PlayerState) {
        this.state = state;
    }

    setRole(type: PlayerRole) {
        this.role = type;
    }

    getRole() {
        return this.role;
    }

}

export class WerewolfGame {

    public readonly channelId: string;
    public readonly channelName: string;

    private gamePhase: GamePhase = GamePhase.Joining;

    private readonly playersById: Map<string, WerePlayer> = new Map();

    /// Votes at each round.
    private readonly votes: Map<string, Vote> = new Map();

    private voteCount: number = 0;

    get playerCount() { return this.playersById.size }

    constructor(channelId: string, channelName: string) {

        this.channelId = channelId;
        this.channelName = channelName;
    }

    join(playerId: string) {

        if (this.playersById.has(playerId)) {
            return new AlreadyInGameError();
        }
        this.playersById.set(playerId, new WerePlayer(playerId));


    }

    assignRoles() {

        const players = Array.from(this.playersById.values());
        const count = players.length;

        const wolves: number = Math.ceil(RolePercents[PlayerRole.Wolf]);

        const villagers = count - wolves;

        let index = 0;
        this.setRoles(PlayerRole.Wolf, players, index, wolves);
        index += wolves;
        this.setRoles(PlayerRole.Villager, players, index, villagers);

    }

    setRoles(role: PlayerRole, players: WerePlayer[], at: number, count: number) {

        for (let i = at; i < at + count; i++) {
            players[i].setRole(role);
        }

    }

    /**
     * Assign words, begin game.
     */
    startGame() {



    }

    /**
     * Player uses ability to target another player.
     * @param player 
     * @param vote 
     */
    target(player: string, vote: string) {

        const curVote = this.votes.get(player);

        /// must vote for player in game.
        if (!this.playersById.has(vote)) {

            return false;

        } else if (curVote !== undefined && curVote === NO_VOTE) {

            this.votes.set(player, vote);
            this.voteCount++;


        }
        if (this.gamePhase === GamePhase.Voting && this.voteCount >= this.playersById.size) {
            this.tallyVotes();
        }


    }

    tallyVotes() {
    }

}