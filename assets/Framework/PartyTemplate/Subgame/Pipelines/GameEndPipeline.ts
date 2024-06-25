import { Debug } from "../../../../Libraries/Utility/Debug";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { IGameId, INextPipeline } from "../../Interfaces";
import { PlayerRoomState, PlayerState } from "../../Player/Player";

export class GameEndContext extends PipelineContext implements IGameId, INextPipeline
{
    public response: any = null;
    public gameId: string = null;
    public playerIds: number[] = null;
    public nextPipeline: string = null;
    public showDefaultGameEndTip: boolean = true;
    public endShowReadyButton: boolean = true;
}

export class GameEndPipeline extends Pipeline<GameEndContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "GameEndPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // SubgameController
        this.AddStage("SubgameOnGameEnd");
        this.AddStage("SetGameEndNextPipeline");
        this.AddStage("ShowGameEndTip");
        this.AddStage("EndShowReadyButton");
        this.AddCallback(() =>
        {
            if (this.context.showDefaultGameEndTip)
                EventManager.Emit("ShowTip", "游戏结束", false);
            return true;
        });

        this.AddCallback(() =>
        {
            EventManager.Emit("ShowReadyButton", this.context.gameId, this.context.endShowReadyButton);
            for (let i = 0; i < this.context.playerIds.length; i++)
            {
                const playerId = this.context.playerIds[i];
                EventManager.Emit("SetPlayerState", playerId, PlayerState.Idle);
                EventManager.Emit("UpdatePlayerUIPipeline", playerId, PlayerRoomState.StayRoom);
            }
            return true;
        });

        this.AddCallback(() =>
        {
            if (!Validator.IsStringEmpty(this.context.nextPipeline))
                EventManager.Emit(this.context.nextPipeline, this.context.gameId, this.context.response);
            return true;
        });
    }

    private CreateContext(dataObj: any): GameEndContext
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return null;
        var playerIds = dataObj["useridlist"] as number[];
        var context = new GameEndContext();
        context.response = dataObj;
        context.gameId = dataObj['gameid'];
        context.playerIds = playerIds;
        return context;
    }
}