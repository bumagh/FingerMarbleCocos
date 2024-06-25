import { sys } from "cc";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { IGameId, INextPipeline, IPlayerIdList, ITotalPlayerCount } from "../../Interfaces";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { List } from "../../../../Libraries/Utility/List";
import { NetAPITools } from "../../../../Game/Scripts/Common/NetAPITools";

export class StartAutoPrepareGameContext extends PipelineContext implements
    IGameId, ITotalPlayerCount, IPlayerIdList, INextPipeline
{
    public gameId: string = null;
    public totalPlayerCount: number = 0;
    public playerIdList: List<string> = null;
    public nextPipeline: string = null;
}

export class StartAutoPrepareGamePipeline extends Pipeline<StartAutoPrepareGameContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "StartAutoPrepareGamePipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // 检查游戏是否已经开始
        this.AddStage("SubgameOnSelfPrepare");

        // ArcadeController
        this.AddStage("GetTotalPlayerCount");
        this.AddStage("GetPlayerIdListInSubgame");

        // RoomController
        this.AddStage("GetHostId");
        this.AddStage("RoomOnStartGameInNoReadyMode");

        this.AddCallback(() =>
        {
            // 隐藏准备按钮
            EventManager.Emit("ShowReadyButton", this.context.gameId, false);
            return true;
        });

        // 发送通知
        this.AddCallback(() =>
        {
            var gamingPlayerIdArray: number[] = [];
            for (let i = 0; i < this.context.playerIdList.items.length; i++)
            {
                const id = this.context.playerIdList.items[i];
                gamingPlayerIdArray.push(Number(id));
            }
            NetAPITools.SendNotice(this.context.gameId, "GamingPipeline", gamingPlayerIdArray);
            return true;
        });

        this.AddStage("OnHostStartAutoPrepareGame");

        this.AddCallback(() =>
        {
            if (!Validator.IsStringEmpty(this.context.nextPipeline))
                EventManager.Emit(this.context.nextPipeline, this.context.gameId);
            return true;
        });
    }

    private CreateContext(): StartAutoPrepareGameContext
    {
        var context = new StartAutoPrepareGameContext();
        return context;
    }
}