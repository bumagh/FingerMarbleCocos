import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { IGameId, IPlayerId } from "../../Interfaces";
import { PlayerState } from "../Player";

export class OtherGameEndContext extends PipelineContext implements IPlayerId, IGameId
{
    public playerId: string = null;
    public sign: number = 0;
    public gameId: string = null;
}

export class OtherGameEndPipeline extends Pipeline<OtherGameEndContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "OtherGameEndPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // PlayerController
        this.AddStage("GetPlayerGameId");

        this.AddCallback(() =>
        {
            EventManager.Emit("SetPlayerState", this.context.playerId, PlayerState.GameEnd);
            return true;
        });

        this.AddStage("SubgameOnOtherGameEnd");
    }

    private CreateContext(playerId: string, sign: number): OtherGameEndContext
    {
        if (Validator.IsStringIllegal(playerId, "playerId")) return null;
        var context = new OtherGameEndContext();
        context.playerId = playerId;
        context.sign = sign;
        return context;
    }
}