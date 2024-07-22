import { director, sys } from "cc";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { IAccountName, IAvatarUrl, IClientPlayerId, IGameId, IHostId, IPlayerId, ISubgameState } from "../../Interfaces";
import { SubgameState } from "../../Subgame/Subgame";
import { Debug } from "../../../../Libraries/Utility/Debug";

export class UpdateRoomHostContext extends PipelineContext
    implements IGameId, IHostId, IClientPlayerId, ISubgameState, IPlayerId, IAccountName, IAvatarUrl
{
    public gameId: string = null;
    public hostId: string = null;
    public playerId: string;

    public clientPlayerId: string = null;
    public stayInArcade: boolean = false;
    public subgameState: SubgameState = SubgameState.Idle;
    public accountName: string = null;
    public avatarUrl: string = null;
}

export class UpdateRoomHostPipeline extends Pipeline<UpdateRoomHostContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "UpdateRoomHostPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        this.AddStage("RoomOnUpdateHost");
        this.AddStage("GetCurrentGameState");

        this.AddCallback(() =>
        {
            if (this.context.stayInArcade) return false;
            return true;
        });

        // 获取房主的头像和昵称
        this.AddStage("GetPlayerAccountData");

        this.AddCallback(() =>
        {
            var isHost = this.context.hostId == this.context.clientPlayerId;
            if (isHost && this.context.subgameState != SubgameState.Gaming)
                EventManager.Emit("ShowReadyButton", this.context.gameId, true);
            EventManager.Emit("SwitchReadyButtonLabel", this.context.gameId, isHost);
            return true;
        });

        this.AddStage("SubgameOnHostUpdate");
    }

    private CreateContext(gameId: string, hostId: string): UpdateRoomHostContext
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return null;
        if (Validator.IsStringIllegal(hostId, "hostId")) return null;
        var context = new UpdateRoomHostContext();
        context.gameId = gameId;
        context.hostId = hostId;
        context.playerId = hostId;
        context.clientPlayerId = sys.localStorage.getItem("ClientPlayerId");
        context.stayInArcade = director.getScene().name == "Arcade";
        return context;
    }
}