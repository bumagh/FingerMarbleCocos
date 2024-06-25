import { sys } from "cc";
import { Pipeline, PipelineContext } from "../../../../Libraries/Utility/PipelineContext";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PlayerRoomState, PlayerState } from "../Player";
import { IGameId, IPlayerId, IReadyPlayerCount, ITotalPlayerCount } from "../../Interfaces";
import { DlgTools } from "../../../../Game/Scripts/Common/DlgTools";


export class SelfPrepareContext extends PipelineContext
    implements IPlayerId, IGameId, ITotalPlayerCount, IReadyPlayerCount
{
    public playerId: string = null;
    public hostId: string = null;
    public gameId: string = null;
    public totalPlayerCount: number = 0;
    public readyPlayerCount: number = 0;
}

export class SelfPreparePipeline extends Pipeline<SelfPrepareContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "SelfPreparePipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // 检查游戏是否已经开始
        this.AddStage("SubgameOnSelfPrepare");

        // 玩家更新本地的状态
        this.AddCallback(() =>
        {
            EventManager.Emit("SetPlayerState", this.context.playerId, PlayerState.Ready);
            return true;
        });

        // ArcadeController 
        this.AddStage("GetTotalPlayerCount");
        this.AddStage("GetReadyPlayerCount");

        // 检查是否能够准备，以及是否能够开始游戏
        this.AddStage("RoomOnSelfPrepare");

        this.AddCallback(() =>
        {
            // 隐藏准备按钮
            EventManager.Emit("ShowReadyButton", this.context.gameId, false);
            // 更新玩家UI
            EventManager.Emit("UpdatePlayerUIPipeline", this.context.playerId, PlayerRoomState.StayRoom);
            return true;
        });

        // 弹出确认框，确认后发送准备/开始的请求
        this.AddCallback(() =>
        {
            DlgTools.ShowUnreadyCountTip(this.context);
            return true;
        });
    }

    private CreateContext(): SelfPrepareContext
    {
        var context = new SelfPrepareContext();
        context.playerId = sys.localStorage.getItem("ClientPlayerId");
        return context;
    }
}