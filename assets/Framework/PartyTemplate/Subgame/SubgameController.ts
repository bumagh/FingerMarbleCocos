import { CCBoolean, CCString, Component, _decorator } from "cc";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { Subgame, SubgameState } from "./Subgame";
import { Validator } from "../../../Libraries/Utility/Validator";
import { OnSelfEnterRoomContext } from "../Room/Pipelines/OnSelfEnterRoomPipeline";
import { Debug } from "../../../Libraries/Utility/Debug";
import { Architecture } from "../../../Game/Scripts/Architecture";
import { RoomController } from "../Room/RoomController";
import { OtherPrepareContext } from "../Player/Pipelines/OtherPreparePipeline";
import { Player, PlayerRoomState } from "../Player/Player";
import { UpdatePlayerUIContext } from "./Pipelines/UpdatePlayerUIPipeline";
import { OtherGameEndContext } from "../Player/Pipelines/OtherGameEndPipeline";
import { SelfGameEndContext } from "../Player/Pipelines/SelfGameEndPipeline";
import { GameEndContext } from "./Pipelines/GameEndPipeline";
import { UpdateSubgameUIContext } from "./Pipelines/UpdateSubgameUIPipeline";
import { PipelineContext } from "../../../Libraries/Utility/PipelineContext";
import { IGameId, IIsClientPlayerGaming, INextPipeline, ISubgameState } from "../Interfaces";
import { UpdateRoomHostContext } from "../Room/Pipelines/UpdateRoomHostPipeline";
import { LeaveRoomContext } from "../Room/Pipelines/OnSelfLeaveRoomPipeline";
import { OnFinishEnterRoomContext } from "../Room/Pipelines/OnFinishEnterRoomPipeline";
import { IPartialPlayerList, ITeamNumDif } from "../../../Game/Scripts/Interfaces/Interfaces";
import { OnOtherEnterRoomContext } from "../Room/Pipelines/OnOtherEnterRoomPipeline";
const { ccclass, property } = _decorator;

@ccclass('SubgameController')
export class SubgameController extends Component
{
    @property(CCString)
    protected subgameName: string = "";

    @property(CCBoolean)
    protected debugMode: boolean = false;

    protected subgameId: string = "0";
    protected subgameNameCN: string = "";
    protected subgame: Subgame = null;
    protected roomController: RoomController = null;

    protected onLoad(): void
    {
        this.LoadSubgameData();
        this.CreateModel();
        this.Init();
        this.roomController = new RoomController(this.subgameId, this.subgameId);
        EventManager.On("SubgameOnSelfEnterGame", this.SubgameOnSelfEnterGame, this);
        EventManager.On("SubgameOnSelfPrepare", this.SubgameOnSelfPrepare, this);
        EventManager.On("SubgameOnOtherPrepare", this.SubgameOnOtherPrepare, this);
        EventManager.On("SubgameOnGaming", this.SubgameOnGaming, this);
        EventManager.On("SubgameOnSelfGameEnd", this.SubgameOnSelfGameEnd, this);
        EventManager.On("SubgameOnOtherGameEnd", this.SubgameOnOtherGameEnd, this);
        EventManager.On("SubgameOnOtherEnterRoom", this.SubgameOnOtherEnterRoom, this);
        EventManager.On("SubgameOnSelfLeaveRoom", this.SubgameOnSelfLeaveRoom, this);
        EventManager.On("SubgameOnOtherLeaveRoom", this.SubgameOnOtherLeaveRoom, this);
        EventManager.On("SubgameOnGameEnd", this.SubgameOnGameEnd, this);
        EventManager.On("UpdateGameSetup", this.UpdateGameSetup, this);
        EventManager.On("UpdateTempData", this.UpdateTempData, this);
        EventManager.On("UpdateSeatIndexes", this.UpdateSeatIndexes, this);
        EventManager.On("SubgameOnHostUpdate", this.SubgameOnHostUpdate, this);
        EventManager.On("UpdatePlayerUI", this.UpdatePlayerUI, this);
        EventManager.On("SubgameOnFinishEnterRoom", this.SubgameOnFinishEnterRoom, this);
        EventManager.On("UpdateSubgameUI", this.UpdateSubgameUI, this);
        EventManager.On("GetCurrentGameId", this.GetCurrentGameId, this);
        EventManager.On("GetCurrentGameState", this.GetCurrentGameState, this);
        EventManager.On("SetGameEndNextPipeline", this.SetGameEndNextPipeline, this);
        EventManager.On("ShowGameEndTip", this.ShowGameEndTip, this);
        EventManager.On("EndShowReadyButton", this.EndShowReadyButton, this);
        EventManager.On("SubgameOnGameReset", this.SubgameOnGameReset, this);
    }

    protected LoadSubgameData(): void
    {
        if (Validator.IsStringIllegal(this.subgameName, "subgameName")) return;
        if (!Architecture.instance.subgameIdMap.has(this.subgameName))
        {
            Debug.Error(`未找到名称为${this.subgameName}的小游戏id`);
            return;
        }
        this.subgameId = Architecture.instance.subgameIdMap.get(this.subgameName);
        this.subgameNameCN = Architecture.instance.subgameNameCNMap.get(this.subgameName);
    }

    protected CreateModel(): void
    {
        this.subgame = new Subgame();
    }

    protected Init(): void
    {
        this.subgame.id = this.subgameId;
        this.subgame.roomId = this.subgameId;
        this.subgame.nameCN = this.subgameNameCN;
    }

    protected onEnable(): void
    {
        this.roomController.OnEnable();
    }

    protected onDisable(): void
    {
        this.roomController.OnDisable();
    }

    protected start(): void
    {
        // EventManager.Emit("OnSubgameControllerStart", this.subgameId);
    }

    protected onDestroy(): void
    {
        EventManager.Off("SubgameOnSelfEnterGame", this.SubgameOnSelfEnterGame, this);
        EventManager.Off("SubgameOnSelfPrepare", this.SubgameOnSelfPrepare, this);
        EventManager.Off("SubgameOnOtherPrepare", this.SubgameOnOtherPrepare, this);
        EventManager.Off("SubgameOnGaming", this.SubgameOnGaming, this);
        EventManager.Off("SubgameOnSelfGameEnd", this.SubgameOnSelfGameEnd, this);
        EventManager.Off("SubgameOnOtherGameEnd", this.SubgameOnOtherGameEnd, this);
        EventManager.Off("SubgameOnOtherEnterRoom", this.SubgameOnOtherEnterRoom, this);
        EventManager.Off("SubgameOnSelfLeaveRoom", this.SubgameOnSelfLeaveRoom, this);
        EventManager.Off("SubgameOnOtherLeaveRoom", this.SubgameOnOtherLeaveRoom, this);
        EventManager.Off("SubgameOnGameEnd", this.SubgameOnGameEnd, this);
        EventManager.Off("UpdateGameSetup", this.UpdateGameSetup, this);
        EventManager.Off("UpdateTempData", this.UpdateTempData, this);
        EventManager.Off("UpdateSeatIndexes", this.UpdateSeatIndexes, this);
        EventManager.Off("SubgameOnHostUpdate", this.SubgameOnHostUpdate, this);
        EventManager.Off("UpdatePlayerUI", this.UpdatePlayerUI, this);
        EventManager.Off("SubgameOnFinishEnterRoom", this.SubgameOnFinishEnterRoom, this);
        EventManager.Off("UpdateSubgameUI", this.UpdateSubgameUI, this);
        EventManager.Off("GetCurrentGameId", this.GetCurrentGameId, this);
        EventManager.Off("GetCurrentGameState", this.GetCurrentGameState, this);
        EventManager.Off("SetGameEndNextPipeline", this.SetGameEndNextPipeline, this);
        EventManager.Off("ShowGameEndTip", this.ShowGameEndTip, this);
        EventManager.Off("SubgameOnGameReset", this.SubgameOnGameReset, this);
        EventManager.Off("EndShowReadyButton", this.EndShowReadyButton, this);
    }

    protected SubgameOnSelfEnterGame(context: OnSelfEnterRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "OnEnterRoomContext")) return;
        if (Validator.IsObjectIllegal(context.response, "response")) return;
        var gameRoom = context.response["gameroom"];
        if (Validator.IsObjectIllegal(gameRoom, "gameRoom")) return;
        if (this.subgame.id != gameRoom["gameid"]) return;
        this.subgame.playedTimes = gameRoom["gamenum"];
        this.subgame.countdown = gameRoom["gamecountdown"];
        this.subgame.autoStart = gameRoom["gameauto"];
        this.subgame.state = gameRoom["gamestate"] as SubgameState;
        this.UpdateGameSetup(this.subgame.id, gameRoom["defaultsetup"], gameRoom["upsetup"]);
        if (!Validator.IsStringEmpty(gameRoom["tempdata"]))
            this.UpdateTempData(this.subgame.id, JSON.parse(gameRoom["tempdata"]), true);
        context.subgameNameCN = this.subgame.nameCN;
        context.subgameState = this.subgame.state;
        context.StageComplete();
    }

    protected SubgameOnSelfPrepare(context: PipelineContext & IGameId & INextPipeline): void
    {
        if (Validator.IsObjectIllegal(context, "SubgameOnSelfPrepare context")) return;
        if (this.IsAlreadyGaming()) return;
        context.gameId = this.subgame.id;
        context.StageComplete();
    }

    protected SubgameOnOtherPrepare(context: OtherPrepareContext): void
    {
        if (Validator.IsObjectIllegal(context, "OtherPrepareContext")) return;
        if (this.subgame.id != context.gameId) return;
        if (this.IsAlreadyGaming()) return;
        context.StageComplete();
    }

    protected SubgameOnGaming(context: PipelineContext & IGameId & IIsClientPlayerGaming): void
    {
        if (Validator.IsObjectIllegal(context, "SelfGamingContext")) return;
        if (this.subgame.id != context.gameId) return;
        if (this.IsAlreadyGaming()) return;
        this.subgame.state = SubgameState.Gaming;
        if (context.isClientPlayerGaming)
            this.ClientOnGaming();
        context.StageComplete();
    }

    protected SubgameOnGameEnd(context: GameEndContext): void
    {
        if (Validator.IsObjectIllegal(context, "GameEndContext")) return;
        if (this.subgame.id != context.gameId) return;
        if (this.subgame.state != SubgameState.Gaming)
        {
            Debug.Warn("游戏结束前，游戏不在进行中");
            return;
        }
        this.subgame.state = SubgameState.End;
        this.ClientOnGameEnd();
        context.StageComplete();
    }

    protected SubgameOnGameReset(gameId: string): void
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return;
        if (this.subgame.id != gameId) return;
        this.subgame.state = SubgameState.Idle;
        this.ClientOnGameReset();
    }

    protected UpdatePlayerUI(context: UpdatePlayerUIContext): void
    {
        if (Validator.IsObjectIllegal(context, "UpdatePlayerUIContext")) return;
        if (Validator.IsStringIllegal(context.playerId, "context.playerId")) return;
        if (this.subgame.id != context.gameId) return;
        switch (context.playerRoomState)
        {
            case PlayerRoomState.EnterRoom:
                this.UpdatePlayerUIOnEnterRoom(context);
                break;

            case PlayerRoomState.StayRoom:
                this.UpdatePlayerUIOnStayRoom(context);
                break;

            case PlayerRoomState.LeaveRoom:
                this.UpdatePlayerUIOnLeaveRoom(context);
                break;

            default:
                break;
        }
    }

    protected UpdateSubgameUI(context: UpdateSubgameUIContext): void
    {
        if (Validator.IsObjectIllegal(context, "UpdateSubgameUIContext")) return;
        if (Validator.IsStringIllegal(context.gameId, "context.gameId")) return;
        if (this.subgame.id != context.gameId) return;
        switch (context.playerRoomState)
        {
            case PlayerRoomState.EnterRoom:
                this.UpdateSubgameUIOnEnterRoom(context);
                break;

            case PlayerRoomState.StayRoom:
                this.UpdateSubgameUIOnStayRoom(context);
                break;

            case PlayerRoomState.LeaveRoom:
                this.UpdateSubgameUIOnLeaveRoom(context);
                break;

            default:
                break;
        }
    }

    protected IsAlreadyGaming(): boolean
    {
        if (this.subgame.state == SubgameState.Gaming)
        {
            EventManager.Emit("ShowTip", "游戏已经开始", true);
            return true;
        }
        return false;
    }

    protected AddPlayer(game: IPartialPlayerList, context: UpdatePlayerUIContext): Player
    {
        if (Validator.IsObjectIllegal(game, "IPartialPlayerList")) return null;
        if (Validator.IsObjectIllegal(context, "UpdatePlayerUIContext")) return null;
        var player = game.partialPlayerList.Find(p => p.id == context.playerId);
        if (Validator.IsObjectEmpty(player))
        {
            player = new Player();
            game.partialPlayerList.Add(player);
        }
        player.id = context.playerId;
        player.gameId = context.gameId;
        player.acountName = context.acountName;
        player.avatarUrl = context.avatarUrl;
        player.gender = context.gender;
        player.seatIndex = context.seatIndex;
        player.state = context.playerState;
        player.isClientPlayer = context.isClientPlayer;
        player.team = context.team;
        return player;
    }

    protected RemovePlayer(game: IPartialPlayerList, context: UpdatePlayerUIContext): Player
    {
        if (Validator.IsObjectIllegal(game, "IPartialPlayerList")) return null;
        if (Validator.IsObjectIllegal(context, "UpdatePlayerUIContext")) return null;
        var player = game.partialPlayerList.Find(p => p.id == context.playerId);
        if (!Validator.IsObjectEmpty(player))
            game.partialPlayerList.Remove(player);
        return player;
    }

    /**
     * 获取当前运行的小游戏的id
     */
    private GetCurrentGameId(context: PipelineContext & IGameId): void
    {
        if (Validator.IsObjectIllegal(context, "GetCurrentGameId context")) return;
        context.gameId = this.subgame.id;
        context.StageComplete();
    }

    /**
     * 获取当前运行的小游戏的状态
     */
    private GetCurrentGameState(context: PipelineContext & IGameId & ISubgameState): void
    {
        if (Validator.IsObjectIllegal(context, "GetCurrentGameState context")) return;
        if (this.subgame.id != context.gameId) return;
        context.subgameState = this.subgame.state;
        context.StageComplete();
    }

    protected UpdateGameSetup(gameId: string, defaultSetup: any, runtimeSetup: any): void { }
    protected UpdateTempData(gameId: string, tempData: any, onEnterRoom: boolean): void { }

    /**
     * 更新此游戏的所有席位
     * @param gameId 游戏id
     * @param seatArray 席位数据数组，Key：玩家id，Value：席位索引
     */
    protected UpdateSeatIndexes(gameId: string, seatArray: [number, number][]): void { }

    protected ClientOnGaming(): void { }
    protected ClientOnGameEnd(): void { }
    protected ClientOnGameReset(): void { }

    protected SubgameOnSelfGameEnd(context: SelfGameEndContext): void { context?.StageComplete(); }
    protected SubgameOnOtherGameEnd(context: OtherGameEndContext): void { context?.StageComplete(); }
    protected SubgameOnOtherEnterRoom(context: OnOtherEnterRoomContext) { context?.StageComplete(); }
    protected SubgameOnSelfLeaveRoom(context: LeaveRoomContext): void { context?.StageComplete(); }
    protected SubgameOnOtherLeaveRoom(context: LeaveRoomContext): void { context?.StageComplete(); }
    protected SubgameOnHostUpdate(context: UpdateRoomHostContext): void { context?.StageComplete(); }
    protected SetGameEndNextPipeline(context: GameEndContext): void { context?.StageComplete(); }
    protected ShowGameEndTip(context: GameEndContext): void { context?.StageComplete(); }
    protected EndShowReadyButton(context: GameEndContext): void { context?.StageComplete(); }
    protected UpdatePlayerUIOnEnterRoom(context: UpdatePlayerUIContext): void { context?.StageComplete(); }
    protected UpdatePlayerUIOnStayRoom(context: UpdatePlayerUIContext): void { context?.StageComplete(); }
    protected UpdatePlayerUIOnLeaveRoom(context: UpdatePlayerUIContext): void { context?.StageComplete(); }

    protected UpdateSubgameUIOnEnterRoom(context: UpdateSubgameUIContext): void { context?.StageComplete(); }
    protected UpdateSubgameUIOnStayRoom(context: UpdateSubgameUIContext): void { context?.StageComplete(); }
    protected UpdateSubgameUIOnLeaveRoom(context: UpdateSubgameUIContext): void { context?.StageComplete(); }
    protected SubgameOnFinishEnterRoom(context: OnFinishEnterRoomContext): void { context?.StageComplete() }
}