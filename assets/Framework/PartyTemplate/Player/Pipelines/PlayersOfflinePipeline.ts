import { director } from "cc";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { PlayerRoomState } from "../Player";
import { Tools } from "../../../../Game/Scripts/Common/Tools";

export class PlayersOfflineContext extends PipelineContext
{
    public playerIds: number[] = [];

    /**
     * 本机玩家是否在大厅
     */
    public stayInArcade: boolean = false;
}

export class PlayersOfflinePipeline extends Pipeline<PlayersOfflineContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "PlayersOfflinePipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // SubgameController
        this.AddCallback(() =>
        {
            this.context.stayInArcade = director.getScene().name == "Arcade";
            if (this.context.stayInArcade) return true;
            for (let i = 0; i < this.context.playerIds.length; i++)
            {
                const playerId = this.context.playerIds[i].toString();
                if (playerId != Tools.GetClientPlayerId())
                    EventManager.Emit("OnOtherLeaveRoomPipeline", playerId);
            }
            return true;
        });

        // ArcadeController 移除所有掉线玩家的控制器
        this.AddStage("RemoveOfflinePlayerControllers");

        // GameArcadeController 大厅中移除所有掉线玩家的头像
        this.AddStage("RemoveOfflineAvatars");

        // GameArcadeController 大厅更新所有小游戏的View
        this.AddCallback(() =>
        {
            if (this.context.stayInArcade)
                EventManager.Emit("UpdateSubgameViews");
            return true;
        });
    }

    private CreateContext(playerIds: number[]): PlayersOfflineContext
    {
        if (Validator.IsObjectIllegal(playerIds, "playerIdArray")) return null;
        var context = new PlayersOfflineContext();
        context.playerIds = playerIds;
        return context;
    }
}