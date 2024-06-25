import { sys } from "cc";
import { Tools } from "../../../../Game/Scripts/Common/Tools";
import { Debug } from "../../../../Libraries/Utility/Debug";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { Pipeline, PipelineContext } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { IGameId, IGamingPlayerCount, IIsInArcade, IPlayerId, ISubgameState } from "../../Interfaces";
import { SubgameState } from "../../Subgame/Subgame";

export class LeaveRoomContext extends PipelineContext
    implements IPlayerId, IGameId, IGamingPlayerCount, ISubgameState, IIsInArcade
{
    public playerId: string = null;
    public gameId: string = null;
    public gamingPlayerCount: number = 0;
    public subgameState: SubgameState = SubgameState.Idle;
    public isInArcade: boolean = false;
}

export class OnSelfLeaveRoomPipeline extends Pipeline<LeaveRoomContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "OnSelfLeaveRoomPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // PlayerController 重置玩家的部分数据
        this.AddStage("PlayerOnSelfLeaveRoom");

        // ArcadeController
        this.AddStage("GetGamingPlayerCount");

        // SubgameController
        this.AddStage("GetCurrentGameState");
        this.AddStage("SubgameOnSelfLeaveRoom");

        this.AddCallback(() =>
        {
            // RankListDlg 设置排行榜的gameId
            EventManager.Emit("SetRankListDlgGameId", null);
            return true;
        });

        this.AddCallback(() =>
        {
            var data = {
                clientid: Tools.GetClientId(),
                roomid: Tools.GetArcadeId(),
                gameid: this.context.gameId
            };
            EventManager.Emit("RequestAPI", "/v1/leavegame", data);
            return true;
        });
    }

    private CreateContext(gameId: string): LeaveRoomContext
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return null;
        var context = new LeaveRoomContext();
        context.playerId = Tools.GetClientPlayerId();
        context.gameId = gameId;
        return context;
    }
}