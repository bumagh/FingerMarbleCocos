import { _decorator, CCFloat, CCString, Component, math, Node } from 'cc';
import { AddToPersistRoot } from '../../Game/Scripts/Common/AddToPersistRoot';
import { EventManager } from '../../Libraries/Utility/EventManager';
import { OnSelfEnterRoomContext } from './Room/Pipelines/OnSelfEnterRoomPipeline';
import { SubgameState } from './Subgame/Subgame';
import { Validator } from '../../Libraries/Utility/Validator';
import { PipelineContext } from '../../Libraries/Utility/PipelineContext';
import { IGameId, IIsClientPlayerGaming } from './Interfaces';
import { GameEndContext } from './Subgame/Pipelines/GameEndPipeline';
import { LeaveRoomContext } from './Room/Pipelines/OnSelfLeaveRoomPipeline';
import { Tools } from '../../Game/Scripts/Common/Tools';
import { Debug } from '../../Libraries/Utility/Debug';
import { UpdateRoomHostContext } from './Room/Pipelines/UpdateRoomHostPipeline';
const { ccclass, property, requireComponent } = _decorator;

@ccclass('AutomaticTest')
@requireComponent(AddToPersistRoot)
export abstract class AutomaticTest extends Component
{
    @property(CCString)
    private subgameName: string = "";

    @property(CCString)
    private subgameId: string = "";

    protected readyEvent: string = "SelfPreparePipeline";

    protected offlineRate: number = 0.05;

    protected hostPrepareDelay: number = 0.3;

    protected seed: number;
    protected offline: boolean = false;
    protected debugTag: string = "AutomaticTest";

    protected subgameState: SubgameState = SubgameState.Idle;
    protected isClientPlayerHost: boolean = false;

    protected onLoad(): void
    {
        if (Validator.IsStringIllegal(this.subgameName, "this.subgameName")) return;
        if (Validator.IsStringIllegal(this.subgameId, "this.subgameId")) return;
        this.seed = new Date().getMilliseconds();

        EventManager.On("OnArcadeSceneStart", this.OnArcadeSceneStart, this);
        EventManager.On("SubgameOnSelfEnterGame", this.SubgameOnSelfEnterGame, this);
        EventManager.On("SubgameOnSelfLeaveRoom", this.SubgameOnSelfLeaveRoom, this);
        EventManager.On("SubgameOnGaming", this.SubgameOnGaming, this);
        EventManager.On("SubgameOnGameEnd", this.SubgameOnGameEnd, this);
        EventManager.On("SubgameOnHostUpdate", this.SubgameOnHostUpdate, this);
    }

    protected onDestroy(): void
    {
        EventManager.Off("OnArcadeSceneStart", this.OnArcadeSceneStart, this);
        EventManager.Off("SubgameOnSelfEnterGame", this.SubgameOnSelfEnterGame, this);
        EventManager.Off("SubgameOnSelfLeaveRoom", this.SubgameOnSelfLeaveRoom, this);
        EventManager.Off("SubgameOnGaming", this.SubgameOnGaming, this);
        EventManager.Off("SubgameOnGameEnd", this.SubgameOnGameEnd, this);
        EventManager.Off("SubgameOnHostUpdate", this.SubgameOnHostUpdate, this);
    }

    protected start(): void
    {
        this.AutoPrepare();
        this.AutoOffline();
    }

    protected OnArcadeSceneStart(): void
    {
        this.scheduleOnce(() => EventManager.Emit("OpenSubgame", this.subgameName, this.subgameId), 2);
    }

    //#region 此区域内参数为context的函数，是非侵入式插入正常逻辑内的，所以不需要 context.StageComplete();

    private SubgameOnSelfEnterGame(context: OnSelfEnterRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "OnEnterRoomContext")) return;
        if (Validator.IsObjectIllegal(context.response, "response")) return;
        if (this.subgameId != context.gameId) return;
        var gameRoom = context.response["gameroom"];
        var gameState = gameRoom["gamestate"] as SubgameState;
        this.subgameState = gameState;
        this.offline = false;
        this.OnSelfEnterRoom(gameRoom["gamecountdown"]);
    }

    private SubgameOnSelfLeaveRoom(context: LeaveRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "LeaveRoomContext")) return;
        if (this.subgameId != context.gameId) return;
        this.subgameState = context.subgameState;
        this.OnSelfLeaveRoom();
    }

    private SubgameOnGaming(context: PipelineContext & IGameId & IIsClientPlayerGaming): void
    {
        if (Validator.IsObjectIllegal(context, "SelfGamingContext")) return;
        if (this.subgameId != context.gameId) return;
        this.subgameState = SubgameState.Gaming;
        this.ClientOnGaming(context.isClientPlayerGaming);
    }

    private SubgameOnGameEnd(context: GameEndContext): void
    {
        if (Validator.IsObjectIllegal(context, "GameEndContext")) return;
        if (this.subgameId != context.gameId) return;
        this.subgameState = SubgameState.End;
        this.ClientOnGameEnd();
    }

    private SubgameOnHostUpdate(context: UpdateRoomHostContext): void
    {
        if (Validator.IsObjectIllegal(context, "UpdateRoomHostContext")) return;
        if (this.subgameId != context.gameId) return;
        this.isClientPlayerHost = context.hostId == Tools.GetClientPlayerId();
    }

    //#endregion

    protected AutoPrepare(): void
    {
        var delay = math.pseudoRandomRange(this.Seed, 0, 0.5);
        if (this.isClientPlayerHost)
            delay += this.hostPrepareDelay;
        this.scheduleOnce(() =>
        {
            if (!Tools.IsInArcadeScene() && !this.offline && this.subgameState != SubgameState.Gaming)
                EventManager.Emit(this.readyEvent);
        }, delay);
        this.scheduleOnce(() =>
        {
            EventManager.Emit("CloseTip");
        }, delay + 1.1);
        var recallDelay = math.pseudoRandomRange(this.Seed, 1.7, 5);
        this.scheduleOnce(() => this.AutoPrepare(), recallDelay);
        Debug.Log("尝试自动准备/开始", this.debugTag);
    }

    protected AutoOffline(): void
    {
        // 掉线概率
        var offlineRuntimeRate = math.pseudoRandomRange(this.Seed, 0, 1);
        var recallDelay: number = 0;
        if (offlineRuntimeRate >= (1 - this.offlineRate) && !this.offline)
        {
            this.offline = true;
            EventManager.Emit("WXOnHide");
            EventManager.Emit("WXOnShow");
            Debug.Log("自动掉线成功", this.debugTag);
            recallDelay = math.pseudoRandomRange(this.Seed, 5, 8);
            this.scheduleOnce(() => this.AutoOffline(), recallDelay);
        }
        else
        {
            recallDelay = math.pseudoRandomRange(this.Seed, 1, 5);
            this.scheduleOnce(() => this.AutoOffline(), recallDelay);
        }
        Debug.Log("尝试自动掉线", this.debugTag);
    }

    protected get Seed(): number
    {
        this.seed++;
        return this.seed;
    }

    // 因为事件监听的顺序无法控制，所以下列回调的顺序可能在SubgameController的回调之前，也可能在之后
    protected OnSelfEnterRoom(countdown: number): void { }
    protected OnSelfLeaveRoom(): void { }
    protected ClientOnGaming(isClientPlayerGaming: boolean): void { }
    protected ClientOnGameEnd(): void { }
    protected ClientOnGameReset(): void { }
}