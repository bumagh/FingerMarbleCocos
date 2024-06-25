import { director } from "cc";
import { Pipeline, PipelineContext } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PlayerRoomState } from "../../Player/Player";
import { Debug } from "../../../../Libraries/Utility/Debug";
import { LeaveRoomContext } from "./OnSelfLeaveRoomPipeline";

/**
 * 其他玩家离开游戏时，本机玩家可能在游戏内，也可能在大厅
 */
export class OnOtherLeaveRoomPipeline extends Pipeline<LeaveRoomContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "OnOtherLeaveRoomPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // SubgameController 在子类中对离开游戏的玩家的UI进行处理
        this.AddCallback(() =>
        {
            this.context.isInArcade = director.getScene().name == "Arcade";
            if (!this.context.isInArcade)
                EventManager.Emit("UpdatePlayerUIPipeline", this.context.playerId, PlayerRoomState.LeaveRoom);
            return true;
        });

        // PlayerController 更新离开游戏的玩家的数据
        this.AddStage("PlayerOnOtherLeaveRoom");

        // 若本机玩家在大厅
        this.AddCallback(() =>
        {
            if (this.context.isInArcade)
            {
                // 刷新玩家列表中玩家的绿点
                EventManager.Emit("ShowArcadePlayerReadyIcon", this.context.playerId, false);
                // 刷新所有小游戏的的人数和外发光
                EventManager.Emit("UpdateSubgameViews");
            }
            return true;
        });

        this.AddStage("GetCurrentGameState");

        // 若玩家在小游戏内
        this.AddCallback(() =>
        {
            if (!this.context.isInArcade)
            {
                // ArcadeController
                EventManager.Emit("GetGamingPlayerCount", this.context);
                // SubgameController
                EventManager.Emit("SubgameOnOtherLeaveRoom", this.context);
            }
            return true;
        });

        this.AddCallback(() =>
        {
            EventManager.Emit("UpdateUnreadyCountTipPipeline", this.context.gameId);
            return true;
        });
    }

    private CreateContext(playerId: string): LeaveRoomContext
    {
        if (Validator.IsStringIllegal(playerId, "playerId")) return null;
        var context = new LeaveRoomContext();
        context.playerId = playerId;
        return context;
    }
}