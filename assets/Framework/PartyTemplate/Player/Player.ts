
export enum PlayerState
{
    Idle = 1,           // 空闲
    Ready = 2,          // 已准备
    Gaming = 3,         // 游戏中
    GameEnd = 4,        // 游戏结束
    Victory = 5,        // 游戏胜利
    Failed = 6,         // 游戏失败
}

export enum PlayerRoomState
{
    EnterRoom = 1,      // 进入房间
    StayRoom = 2,       // 待在房间
    LeaveRoom = 3,      // 离开房间
}

/**
 * 玩家的顺序（轨道号）
 */
export class PlayerOrder
{
    public playerId: string = null;
    public order: number = 0;
    public illegal: boolean = false;
}

export class Player
{
    id: string;                     // 玩家唯一id
    acountName: string;             // 账号昵称
    avatarUrl: string;              // 头像url
    gender: string;                 // 性别
    arcadeId: string;               // 当前大厅的id

    gameId: string;                 // 当前小游戏的房间id，不是大厅的id，目前此房间id = 小游戏的id
    seatIndex: number = -1;         // 当前席位
    team: number = 0;               // 当前队伍
    score: number = 0;              // 当前得分
    state: PlayerState = PlayerState.Idle;  // 玩家状态
    sign: number = 0;               // 玩家标识
    isClientPlayer: boolean = false;        // 是否为本机的玩家，此字段不存在数据库中

    public Clone(): Player
    {
        var player = new Player();

        player.id = this.id;
        player.acountName = this.acountName;
        player.avatarUrl = this.avatarUrl;
        player.gender = this.gender;
        player.arcadeId = this.arcadeId;

        player.gameId = this.gameId;
        player.seatIndex = this.seatIndex;
        player.team = this.team;
        player.score = this.score;
        player.state = this.state;
        player.sign = this.sign;

        player.isClientPlayer = this.isClientPlayer;

        return player;
    }
}