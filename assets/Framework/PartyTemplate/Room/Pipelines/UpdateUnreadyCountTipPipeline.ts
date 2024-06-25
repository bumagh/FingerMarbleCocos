import { CommonEventType } from "../../../../Game/Scripts/Common/CommonEventType";
import { IRefreshConfirmTip } from "../../../../Game/Scripts/Dialogs/ConfirmDlg";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { IGameId, ITotalPlayerCount, IReadyPlayerCount } from "../../Interfaces";

export class UpdateUnreadyCountTipContext extends PipelineContext
    implements IGameId, ITotalPlayerCount, IReadyPlayerCount, IRefreshConfirmTip
{
    public gameId: string = null;
    public totalPlayerCount: number = 0;
    public readyPlayerCount: number = 0;
    public oldConfirmTip: string = null;
    public newConfirmTip: string = null;
}

/**
 * 更新未准备玩家数量的提示
 */
export class UpdateUnreadyCountTipPipeline extends Pipeline<UpdateUnreadyCountTipContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "UpdateUnreadyCountTipPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // ArcadeController 
        this.AddStage("GetTotalPlayerCount");
        this.AddStage("GetReadyPlayerCount");

        this.AddCallback(() =>
        {
            var delta = this.context.totalPlayerCount - this.context.readyPlayerCount;
            this.context.oldConfirmTip = "人未准备，是否开始游戏？";
            this.context.newConfirmTip = `还有${delta}人未准备，是否开始游戏？`;
            // 刷新确认框的提示文本
            if (delta > 0)
                EventManager.Emit(CommonEventType.RefreshConfirmTip, this.context);
            // 关闭确认框
            else
                EventManager.Emit("OnConfirmTipConfirmed");
            return true;
        });
    }

    private CreateContext(gameId: string): UpdateUnreadyCountTipContext
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return;
        var context = new UpdateUnreadyCountTipContext();
        context.gameId = gameId;
        return context;
    }
}