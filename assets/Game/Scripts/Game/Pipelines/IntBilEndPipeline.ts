import { game } from "cc";
import { IClonePlayers, IGameId, IHostId } from "../../../../Framework/PartyTemplate/Interfaces";
import { Player } from "../../../../Framework/PartyTemplate/Player/Player";
import { SubgameState } from "../../../../Framework/PartyTemplate/Subgame/Subgame";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { List } from "../../../../Libraries/Utility/List";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { CommonEventType } from "../../Common/CommonEventType";
import { NetAPITools } from "../../Common/NetAPITools";
import { Tools } from "../../Common/Tools";
import { IntBilEndData } from "../InterestingBilliardTypes";
import { Rank } from "../../Dialogs/RankListDlg";


export class IntBilEndContext extends PipelineContext implements IClonePlayers, IGameId, IHostId
{
    public endData: IntBilEndData = {
        gameresult: [],
        showPunish: false,
        victoryName: ""
    };
    public clonePlayers: List<Player> = null;
    public gameId: string = null;
    public hostId: string = null;
    public hasRankDlg: boolean = false;     // 是否有排行榜
    public rankArray: Rank[] = null;
    public subgameState: SubgameState = SubgameState.End;
}

export class IntBilEndPipeline extends Pipeline<IntBilEndContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "IntBilEndPipeline";
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
        //清除临时数据
        this.AddCallback(()=>{
            NetAPITools.SetGameTempdata(this.context.gameId,JSON.stringify({gaming:false}));
            return true;
        });
        this.AddStage("GetPlayerCloneListInSubgame");
        this.AddStage("IntBilUpdatePartialPlayerList");
        this.AddCallback(() =>
        {
            if (this.context.hasRankDlg)
            {
                var rankArray: Rank[] = [];
                for (let i = 0; i < this.context.endData.gameresult.length; i++)
                {
                    const result = this.context.endData.gameresult[i];
                    var rank = new Rank();
                    rank.playerId = result.id;
                    rank.sign = result.sign;
                    rank.rank = result.sort;
                    rank.acountName = result.acountName;
                    rank.avatarUrl = result.avatarUrl;
                    rankArray[i] = rank;
                }
                this.context.rankArray = rankArray;
            }
            return true;
        });
        // WhackAMoleController 获取游戏结果
        this.AddCallback(() =>
        {
            if (this.context.hasRankDlg)
                EventManager.Emit(CommonEventType.ShowRankListDlg, this.context.gameId, this.context.rankArray, 48, this.context.endData.showPunish, true);
            // var tipStr = this.context.endData.victoryName != "" ? ("玩家 " + this.context.endData.victoryName + "清空了对方的球，本轮游戏结束") : "本轮游戏结束";
            var tipStr = "本轮游戏结束";
            EventManager.Emit(CommonEventType.ShowTipDuration, tipStr, true, 1, null, 0.5);//为了防止之前的提示框关闭当前提示框，延迟1秒
            return true;
        });
    }

    private CreateContext(gameId: string, endData: IntBilEndData): IntBilEndContext
    {
        if (Validator.IsObjectIllegal(endData, "IntBilEndData")) return null;
        var context = new IntBilEndContext();
        context.endData = endData;
        context.gameId = gameId;
        return context;
    }
}