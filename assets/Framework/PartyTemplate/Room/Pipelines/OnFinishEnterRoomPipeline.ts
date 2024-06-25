import { sys } from "cc";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { IGameId, IClientPlayerId, IPlayerId } from "../../Interfaces";

export class OnFinishEnterRoomContext extends PipelineContext
    implements IGameId, IPlayerId
{
    public playerId: string;
    public gameId: string = null;
}

export class OnFinishEnterRoomPipeline extends Pipeline<OnFinishEnterRoomContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "OnFinishEnterRoomPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // SubgameController
        this.AddStage("SubgameOnFinishEnterRoom");
    }

    private CreateContext(gameId: string, playerId: string): OnFinishEnterRoomContext
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return null;
        if (Validator.IsStringIllegal(playerId, "playerId")) return null;
        var context = new OnFinishEnterRoomContext();
        context.gameId = gameId;
        context.playerId = playerId;
        return context;
    }
}