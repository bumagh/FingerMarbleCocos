import { Vec3 } from "cc";
import { IHostId } from "../../../Framework/PartyTemplate/Interfaces";
import { Player } from "../../../Framework/PartyTemplate/Player/Player";
import { Subgame } from "../../../Framework/PartyTemplate/Subgame/Subgame";
import { List } from "../../../Libraries/Utility/List";
import { IPartialPlayerList, IIsClientPlayerHost } from "../Interfaces/Interfaces";
import { FingerMarbleBall } from "./FingerMarbleBall";
import { InterestingBilliardGamingState, IntBilTempData } from "./InterestingBilliardTypes";


export class FingerMarbleGame extends Subgame implements IPartialPlayerList, IIsClientPlayerHost, IHostId
{
    public hostId: string;
    public isClientPlayerHost: boolean = false;
    public playerRecords = new Map<string, number>();
    public partialPlayerList: List<Player> = new List<Player>();
    public gamingPlayerList: List<Player> = new List<Player>();//游戏中的玩家列表
    public curRoundPlayerIds: string[] = [];
    public touchTimer: number = 0;//推杆蓄力计时
    public touchStarted: boolean = false;//是否开始触控

    public gamingState: InterestingBilliardGamingState = InterestingBilliardGamingState.Idle;
    public runTimer: boolean = false;
    public runningSeconds: number = 0;
    public curRoundTime: number = 0;
    public maxRoundTime: number = 5;
    public maxCueSettingTime: number = 30;
    public clockTipTime: number = 10;
    public nextRoundPlayerId: string = null;
    public curRoundFallBalls: List<FingerMarbleBall> = new List<FingerMarbleBall>//记录当前轮次结算记录

    public clientPlayerId: string = null;
    public audioCurTime: number = 0;
    public tempData: IntBilTempData =
        {
            gamingPlayerId: "0",
            gamingPlayerIds: [],
            gaming: false,
            mainBallPos: new Vec3(),
            subBallPos: []
        };
}