import { Team } from "../../../../Game/Scripts/Common/Enums";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { Pipeline, PipelineContext } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { IGameId, IHostId, IPlayerId } from "../../Interfaces";
import { PlayerRoomState, PlayerState } from "../../Player/Player";

export class UpdatePlayerUIContext extends PipelineContext implements IPlayerId, IGameId, IHostId
{
    public playerId: string = null;
    public playerRoomState: PlayerRoomState = PlayerRoomState.EnterRoom;
    public showPlayerMessage: boolean = true;

    public playerState: PlayerState = PlayerState.Idle;
    public gameId: string = null;
    public acountName: string = null;
    public avatarUrl: string = null;
    public gender: string = null;
    public seatIndex: number = -1;
    public isClientPlayer: boolean = false;
    public hostId: string = null;
    public team: Team = Team.Red;
}

export class UpdatePlayerUIPipeline extends Pipeline<UpdatePlayerUIContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "UpdatePlayerUIPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // PlayerController 获取玩家信息
        this.AddStage("GetPlayerInfoOnUpdatePlayerUI");

        // RoomController 获取房主信息
        this.AddStage("GetHostId");

        // SubgameController 更新玩家UI
        this.AddStage("UpdatePlayerUI");

        // 显示玩家消息
        this.AddCallback(() =>
        {
            if (!this.context.showPlayerMessage) return true;
            var rightMsg: string;
            switch (this.context.playerRoomState)
            {
                case PlayerRoomState.EnterRoom:
                    rightMsg = "进入了房间";
                    break;
                case PlayerRoomState.LeaveRoom:
                    rightMsg = "离开了房间";
                    break
                default:
                    return true;
            }
            EventManager.Emit("ShowPlayerMessage", this.context.playerId, this.context.acountName,
                this.context.avatarUrl, "玩家", rightMsg);
            return true;
        });

        this.AddCallback(() =>
        {
            EventManager.Emit("UpdateSubgameUIPipeline", this.context.gameId, this.context.playerRoomState);
            return true;
        });
    }

    private CreateContext(playerId: string, playerRoomState: PlayerRoomState, showPlayerMessage: boolean = true): UpdatePlayerUIContext
    {
        if (Validator.IsStringIllegal(playerId, "playerId")) return null;
        var context = new UpdatePlayerUIContext();
        context.playerId = playerId;
        context.playerRoomState = playerRoomState;
        context.showPlayerMessage = showPlayerMessage;
        return context;
    }
}