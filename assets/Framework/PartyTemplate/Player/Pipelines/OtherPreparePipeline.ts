import { Debug } from "../../../../Libraries/Utility/Debug";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { Pipeline, PipelineContext } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { IGameId, IPlayerId } from "../../Interfaces";
import { PlayerRoomState, PlayerState } from "../Player";

export class OtherPrepareContext extends PipelineContext implements IPlayerId, IGameId
{
    public playerId: string = null;
    public gameId: string = null;
}

export class OtherPreparePipeline extends Pipeline<OtherPrepareContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "OtherPreparePipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        this.AddStage("GetPlayerGameId");
        this.AddStage("SubgameOnOtherPrepare");

        this.AddCallback(() =>
        {
            EventManager.Emit("SetPlayerState", this.context.playerId, PlayerState.Ready);
            return true;
        });

        this.AddCallback(() =>
        {
            EventManager.Emit("UpdatePlayerUIPipeline", this.context.playerId, PlayerRoomState.StayRoom);
            return true;
        });

        this.AddCallback(() =>
        {
            EventManager.Emit("UpdateUnreadyCountTipPipeline", this.context.gameId);
            return true;
        });
    }

    private CreateContext(playerId: string): OtherPrepareContext
    {
        if (Validator.IsStringIllegal(playerId, "playerId")) return null;
        var context = new OtherPrepareContext();
        context.playerId = playerId;
        return context;
    }
}