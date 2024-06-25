import { Tools } from "../../../../Game/Scripts/Common/Tools";
import { Debug } from "../../../../Libraries/Utility/Debug";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { List } from "../../../../Libraries/Utility/List";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { IGameId, IIsClientPlayerGaming, IPlayerId, IPlayerIdList } from "../../Interfaces";
import { PlayerRoomState, PlayerState } from "../../Player/Player";

export class GamingContext extends PipelineContext implements IPlayerId, IGameId, IPlayerIdList, IIsClientPlayerGaming
{
    public gamingPlayerIdArray: string[] = [];
    public playerId: string;
    public gameId: string;
    public playerIdList: List<string>;
    public isClientPlayerGaming: boolean = false;
}

export class GamingPipeline extends Pipeline<GamingContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "GamingPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // PlayerController 获取第一个玩家所在的小游戏的id
        this.AddStage("GetPlayerGameId");

        // ArcadeController 获取相应小游戏内的所有玩家的id列表
        this.AddStage("GetPlayerIdListInSubgame");

        this.AddCallback(() =>
        {
            for (let i = 0; i < this.context.playerIdList.items.length; i++)
            {
                const id = this.context.playerIdList.items[i];
                // 玩家在游戏中
                if (this.context.gamingPlayerIdArray.findIndex(gamingId => gamingId == id) > -1)
                {
                    EventManager.Emit("SetPlayerState", id, PlayerState.Gaming);
                    // 是否为本机玩家
                    if (Tools.IsClientPlayer(id))
                        this.context.isClientPlayerGaming = true;
                    EventManager.Emit("UpdatePlayerUIPipeline", id, PlayerRoomState.StayRoom);
                }
            }
            return true;
        });

        // SubgameController
        this.AddStage("SubgameOnGaming");
    }

    private CreateContext(gamingPlayerIdArray: number[]): GamingContext
    {
        if (Validator.IsObjectIllegal(gamingPlayerIdArray, "playerIdArray")) return null;
        var context = new GamingContext();
        for (let i = 0; i < gamingPlayerIdArray.length; i++)
        {
            const id = gamingPlayerIdArray[i].toString();
            context.gamingPlayerIdArray.push(id);
            if (i == 0)
                context.playerId = id;
        }
        return context;
    }
}