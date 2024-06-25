import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { PlayerState } from "../Player";

export class SelfGameEndContext extends PipelineContext
{
    public playerId: string = null;
    public sign: number = 0;
}

export class SelfGameEndPipeline extends Pipeline<SelfGameEndContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "SelfGameEndPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        this.AddCallback(() =>
        {
            EventManager.Emit("SetPlayerState", this.context.playerId, PlayerState.GameEnd);
            return true;
        });

        this.AddStage("SubgameOnSelfGameEnd");
    }

    private CreateContext(playerId: string, sign: number): SelfGameEndContext
    {
        if (Validator.IsStringIllegal(playerId, "playerId")) return null;
        var context = new SelfGameEndContext();
        context.playerId = playerId;
        context.sign = sign;
        return context;
    }
}