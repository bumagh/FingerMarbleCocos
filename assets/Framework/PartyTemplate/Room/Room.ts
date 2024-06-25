
export class Room
{
    public id: string;
    public gameId: string;
    public hostId: string;                  // 房主的id
    public maxPlayerCount: number;          // 房间最多能容纳多少人
    public minPlayerCount: number;          // 房间最少要容纳多少人才能开始游戏
}