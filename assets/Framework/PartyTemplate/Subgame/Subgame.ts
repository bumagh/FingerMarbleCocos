
export enum SubgameState
{
    Idle = 1,
    Gaming = 2,
    End = 3,
}

export class Subgame
{
    public id: string;
    public roomId: string;
    public nameCN: string;                  // 小游戏的中文名
    public playedTimes: number;             // 已游玩的次数
    public countdown: number;               // 游戏倒计时
    public autoStart: boolean = false;      // 是否自动开始游戏
    public state: SubgameState = SubgameState.Idle;
}