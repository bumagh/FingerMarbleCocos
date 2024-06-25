import { Debug } from "../../../../Libraries/Utility/Debug";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { IGameId, INextPipeline, IReadyPlayerCount, ITotalPlayerCount } from "../../Interfaces";
import { PlayerRoomState } from "../../Player/Player";

export class UpdateSubgameUIContext extends PipelineContext
    implements IGameId, ITotalPlayerCount, IReadyPlayerCount, INextPipeline
{
    public gameId: string = null;
    public playerRoomState: PlayerRoomState = PlayerRoomState.EnterRoom;

    public totalPlayerCount: number = 0;
    public readyPlayerCount: number = 0;
    public nextPipeline: string = null;
}

export class UpdateSubgameUIPipeline extends Pipeline<UpdateSubgameUIContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "UpdateSubgameUIPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // ArcadeController 获取该游戏中，已准备的玩家数和玩家总数
        this.AddStage("GetTotalPlayerCount");
        this.AddStage("GetReadyPlayerCount");

        // SubgameController 更新小游戏的UI
        this.AddStage("UpdateSubgameUI");

        this.AddCallback(() =>
        {
            if (!Validator.IsStringEmpty(this.context.nextPipeline))
                EventManager.Emit(this.context.nextPipeline, this.context.gameId, this.context.playerRoomState);
            return true;
        });
    }

    private CreateContext(gameId: string, playerRoomState: PlayerRoomState): UpdateSubgameUIContext
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return;
        var context = new UpdateSubgameUIContext();
        context.gameId = gameId;
        context.playerRoomState = playerRoomState;
        return context;
    }
}