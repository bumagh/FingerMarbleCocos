import { director } from "cc";
import { Pipeline, PipelineContext } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PlayerRoomState } from "../../Player/Player";
import { IPlayerId } from "../../Interfaces";
import { Debug } from "../../../../Libraries/Utility/Debug";

export class OnOtherEnterRoomContext extends PipelineContext implements IPlayerId
{
    public playerId: string = null;
    public roomId: string = null;

    /**
     * 服务器返回的数据
     */
    public response: any = null;

    /**
     * 本机玩家是否在大厅
     */
    public stayInArcade: boolean = false;

    public nextPipeline: string = null;
}

/**
 * 其他玩家进入游戏，本机玩家可能在游戏内，也可能在大厅
 */
export class OnOtherEnterRoomPipeline extends Pipeline<OnOtherEnterRoomContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "OnOtherEnterRoomPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // PlayerController 更新进入游戏的玩家的数据
        this.AddStage("PlayerOnOtherEnterRoom");

        // SubgameController
        this.AddStage("SubgameOnOtherEnterRoom");

        // SubgameController 如果本机玩家在游戏内,在子类中对进入游戏的玩家的UI进行处理
        this.AddCallback(() =>
        {
            if (!this.context.stayInArcade)
                EventManager.Emit("UpdatePlayerUIPipeline", this.context.playerId, PlayerRoomState.EnterRoom);
            return true;
        });

        this.AddCallback(() =>
        {
            // EventManager.Emit("OnFinishEnterRoomPipeline", this.context.roomId, this.context.playerId);
            return true;
        });
    }

    private CreateContext(response: any): OnOtherEnterRoomContext
    {
        if (Validator.IsObjectIllegal(response, "response")) return null;
        var context = new OnOtherEnterRoomContext();
        context.playerId = response["requestuid"];
        context.roomId = response["gameroom"]["gameid"];
        context.response = response;
        return context;
    }
}