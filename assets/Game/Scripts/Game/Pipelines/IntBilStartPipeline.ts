import { sys } from "cc";
import { IPlayerId, IGameId, IReadyPlayerCount, IHostId } from "../../../../Framework/PartyTemplate/Interfaces";
import { PlayerState, PlayerRoomState } from "../../../../Framework/PartyTemplate/Player/Player";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { NetAPITools } from "../../Common/NetAPITools";
import { Tools } from "../../Common/Tools";



export class IntBilStartContext extends PipelineContext implements IPlayerId, IGameId, IReadyPlayerCount, IHostId
{
    public readyPlayerCount: number = 0;
    public playerId: string = null;
    public hostId: string = null;
    public nextPipeline: string = null;
    public gameId: string = null;
    public playerUIIndexes: string[] = null;
    public gamingPlayerIds: string[] = null;
}

export class IntBilStartPipeline extends Pipeline<IntBilStartContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "IntBilStartPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // 检查游戏是否已经开始
        this.AddStage("SubgameOnSelfPrepare");
        // 检查本游戏房间内的所有玩家的数量，无论有没有准备
        this.AddStage("GetReadyPlayerCount");

        this.AddStage("GetHostId");
        // 检查是否能够准备，以及是否能够开始游戏
        // this.AddStage("RoomOnSelfPrepare");

        // 玩家更新本地的状态
        this.AddCallback(() =>
        {
            // 若是房主
            if (this.context.hostId == this.context.playerId)
            {
                // 检查准备人数是否足够开启游戏，若不足，弹出提示
                if (this.context.readyPlayerCount < 1)
                {
                    EventManager.Emit("ShowTip", "游戏准备人数不足，无法开始游戏", true);
                    return;
                }
            }
            // 若不是房主
            else
            {
                if (this.context.readyPlayerCount >= 1)
                {
                    EventManager.Emit("ShowTip", "此游戏的人数已满，请等待下一轮", false);
                    return false;
                }
            }
            EventManager.Emit("SetPlayerState", this.context.playerId, PlayerState.Ready);
            return true;
        });

        this.AddCallback(() =>
        {
            // 隐藏准备按钮
            EventManager.Emit("ShowReadyButton", this.context.gameId, false);
            // 更新玩家UI
            EventManager.Emit("UpdatePlayerUIPipeline", this.context.playerId, PlayerRoomState.StayRoom);
            return true;
        });

        // 发送请求
        this.AddCallback(() =>
        {
            NetAPITools.Prepare(this.context.gameId, this.context.hostId);
            return true;
        });
    }

    private CreateContext(gamingPlayerIds: string[]): IntBilStartContext
    {
        if (Validator.IsObjectIllegal(gamingPlayerIds, "gamingPlayerIds")) return null;
        var context = new IntBilStartContext();
        context.playerId = Tools.GetClientPlayerId();
        context.gamingPlayerIds = gamingPlayerIds;
        return context;
    }
}