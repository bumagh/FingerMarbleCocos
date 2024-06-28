import { Player, PlayerState } from "./Player";
import { IEntity } from "../IEntity";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { Validator } from "../../../Libraries/Utility/Validator";
import { OnSelfEnterRoomContext, OnSelfEnterRoomStatus } from "../Room/Pipelines/OnSelfEnterRoomPipeline";
import { sys } from "cc";
import { Debug } from "../../../Libraries/Utility/Debug";
import { OnOtherEnterRoomContext } from "../Room/Pipelines/OnOtherEnterRoomPipeline";
import { UpdatePlayerUIContext } from "../Subgame/Pipelines/UpdatePlayerUIPipeline";
import { Pipeline, PipelineContext } from "../../../Libraries/Utility/PipelineContext";
import { IAccountName, IAvatarUrl, IGameId, IPlayerId } from "../Interfaces";
import { LeaveRoomContext } from "../Room/Pipelines/OnSelfLeaveRoomPipeline";
import { Team } from "../../../Game/Scripts/Common/Enums";

export class PlayerController implements IEntity
{
    player: Player;

    OnEnable(): void
    {
        EventManager.On("PlayerOnSelfEnterRoom", this.PlayerOnSelfEnterRoom, this);
        EventManager.On("PlayerOnOtherEnterRoom", this.PlayerOnOtherEnterRoom, this);
        EventManager.On("PlayerOnSelfLeaveRoom", this.PlayerOnSelfLeaveRoom, this);
        EventManager.On("PlayerOnOtherLeaveRoom", this.PlayerOnOtherLeaveRoom, this);
        EventManager.On("SetPlayerState", this.SetPlayerState, this);
        EventManager.On("GetPlayerInfoOnUpdatePlayerUI", this.GetPlayerInfoOnUpdatePlayerUI, this);
        EventManager.On("GetPlayerGameId", this.GetPlayerGameId, this);
        EventManager.On("GetPlayerAccountData", this.GetPlayerAccountData, this);
        EventManager.On("UpdatePlayerTeam", this.UpdatePlayerTeam, this);
    }

    OnDisable(): void
    {
        EventManager.Off("PlayerOnSelfEnterRoom", this.PlayerOnSelfEnterRoom, this);
        EventManager.Off("PlayerOnOtherEnterRoom", this.PlayerOnOtherEnterRoom, this);
        EventManager.Off("PlayerOnSelfLeaveRoom", this.PlayerOnSelfLeaveRoom, this);
        EventManager.Off("PlayerOnOtherLeaveRoom", this.PlayerOnOtherLeaveRoom, this);
        EventManager.Off("SetPlayerState", this.SetPlayerState, this);
        EventManager.Off("GetPlayerInfoOnUpdatePlayerUI", this.GetPlayerInfoOnUpdatePlayerUI, this);
        EventManager.Off("GetPlayerGameId", this.GetPlayerGameId, this);
        EventManager.Off("GetPlayerAccountData", this.GetPlayerAccountData, this);
        EventManager.Off("UpdatePlayerTeam", this.UpdatePlayerTeam, this);
    }

    private PlayerOnSelfEnterRoom(context: OnSelfEnterRoomContext): void
    {
        Debug.Log("PlayerOnSelfEnterRoom")
        if (this.player.id != sys.localStorage.getItem("ClientPlayerId")) return;
        if (Validator.IsObjectIllegal(context, "OnEnterRoomContext")) return;
        if (Validator.IsObjectIllegal(context.response, "response")) return;
        var gameRoom = context.response["gameroom"];
        if (Validator.IsObjectIllegal(gameRoom, "gameRoom")) return;
        if (this.player.seatIndex < 0)
            context.status = OnSelfEnterRoomStatus.HasNoSeat;
        var ischarge = sys.localStorage.getItem("IsCharge") as boolean;
        if (!ischarge && gameRoom["gamenum"] > 1)
            context.status = OnSelfEnterRoomStatus.Unpaid;
        context.StageComplete();
    }

    private PlayerOnOtherEnterRoom(context: OnOtherEnterRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "OnOtherEnterRoomContext")) return;
        if (Validator.IsStringIllegal(context.playerId, "context.playerId")) return;
        if (this.player.id != context.playerId) return;
        const playerInfoArray = context.response["gameuser"] as Array<any>;
        const playerInfo = playerInfoArray.find(p => p["id"] == this.player.id);
        this.SetPlayerRuntimeData(playerInfo);
        context.StageComplete();
    }

    /**
     * 本机玩家离开游戏，重置部分数据
     */
    private PlayerOnSelfLeaveRoom(context: LeaveRoomContext): void
    {
        if (this.player.id != sys.localStorage.getItem("ClientPlayerId")) return;
        if (Validator.IsObjectIllegal(context, "LeaveRoomContext")) return;
        if (Validator.IsStringIllegal(context.gameId, "context.playerId")) return;
        if (this.player.gameId != context.gameId)
            Debug.Error(`玩家${this.player.id}此时的游戏房间为${this.player.gameId}，但传入的游戏房间为${context.gameId}`);
        this.ClearPlayerRuntimeData();
        context.StageComplete();
    }

    private PlayerOnOtherLeaveRoom(context: LeaveRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "LeaveRoomContext")) return;
        if (Validator.IsStringIllegal(context.playerId, "context.playerId")) return;
        if (this.player.id != context.playerId) return;
        context.gameId = this.player.gameId;
        this.ClearPlayerRuntimeData();
        context.StageComplete();
    }

    private SetPlayerState(contextPlayerId: string, playerState: PlayerState): void
    {
        if (Validator.IsStringIllegal(contextPlayerId, "contextPlayerId")) return;
        if (this.player.id != contextPlayerId) return;
        if (playerState == PlayerState.Ready && this.player.state == PlayerState.Gaming)
        {
            Debug.Error(`玩家${this.player.id}在游戏中尝试准备`);
            return;
        }
        this.player.state = playerState;
    }

    private GetPlayerInfoOnUpdatePlayerUI(context: UpdatePlayerUIContext): void
    {
        if (Validator.IsObjectIllegal(context, "UpdatePlayerUIContext")) return;
        if (this.player.id != context.playerId) return;
        context.playerState = this.player.state;
        context.gameId = this.player.gameId;
        context.acountName = this.player.acountName;
        context.avatarUrl = this.player.avatarUrl;
        context.gender = this.player.gender;
        context.seatIndex = this.player.seatIndex;
        context.team = this.player.team;
        context.isClientPlayer = this.player.id == sys.localStorage.getItem("ClientPlayerId");
        context.StageComplete();
    }

    private GetPlayerGameId(context: PipelineContext & IPlayerId & IGameId): void
    {
        if (Validator.IsObjectIllegal(context, "context")) return;
        if (this.player.id != context.playerId) return;
        context.gameId = this.player.gameId;
        context.StageComplete();
    }

    private GetPlayerAccountData(context: PipelineContext & IPlayerId & IAccountName & IAvatarUrl): void
    {
        if (Validator.IsObjectIllegal(context, "GetPlayerAccountData context")) return;
        if (this.player.id != context.playerId) return;
        context.accountName = this.player.acountName;
        context.avatarUrl = this.player.avatarUrl;
        context.StageComplete();
    }

    private UpdatePlayerTeam(playerId: string, team: Team): void
    {
        if (Validator.IsStringIllegal(playerId, "playerId")) return;
        if (Validator.IsNumberIllegalNoStrict(team, "team")) return;
        if (playerId != this.player.id) return;
        this.player.team = team;
    }

    public SetPlayerRuntimeData(playerInfo: any): void
    {
        if (Validator.IsObjectIllegal(playerInfo, "playerInfo")) return;
        this.player.gameId = playerInfo["gameid"];
        this.player.seatIndex = playerInfo["index"];
        this.player.team = playerInfo["teamid"];
        this.player.score = playerInfo["integral"];
        this.player.sign = playerInfo["sign"];
        this.player.state = playerInfo["state"] as PlayerState;
    }

    public ClearPlayerRuntimeData(): void
    {
        this.player.gameId = null;
        this.player.seatIndex = -1;
        this.player.team = 0;
        this.player.score = 0;
        this.player.sign = 0;
        this.player.state = PlayerState.Idle;
    }
}