import { IGameId, IClonePlayers, ISubgameState } from "../../../../Framework/PartyTemplate/Interfaces";
import { Player } from "../../../../Framework/PartyTemplate/Player/Player";
import { SubgameState } from "../../../../Framework/PartyTemplate/Subgame/Subgame";
import { List } from "../../../../Libraries/Utility/List";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { Tools } from "../../Common/Tools";


export class IntBilGamingContext extends PipelineContext implements IGameId, IClonePlayers,ISubgameState
{
    public subgameState: SubgameState=SubgameState.Gaming;
    public clonePlayers: List<Player>=null;
    public gameId: string = null;
}

export class IntBilGamingPipeline extends Pipeline<IntBilGamingContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "IntBilGamingPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        this.AddCallback(() =>
        {
            if (Tools.IsInArcadeScene()) return false;
            return true;
        });
        this.AddStage("GetPlayerCloneListInSubgame");
        this.AddStage("IntBilUpdatePartialPlayerList");
        this.AddStage("IntBilUpdateUI");
        this.AddStage("IntBilGamingSetCurRoundPlayerIds");
    }

    private CreateContext(gameId:string): IntBilGamingContext
    {
        if (Validator.IsStringIllegal(gameId, "IntBilGamingContext gameId")) return null;
        var context = new IntBilGamingContext();
        context.gameId = gameId;
        return context;
    }
}