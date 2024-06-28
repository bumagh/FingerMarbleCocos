import { sys } from "cc";
import { Debug } from "../../../../Libraries/Utility/Debug";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { Pipeline, PipelineContext } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";
import { PlayerRoomState, PlayerState } from "../../Player/Player";
import { IClientPlayerId, IGameId, IHostId, ISubgameState, ITotalPlayerCount } from "../../Interfaces";
import { SubgameState } from "../../Subgame/Subgame";

export enum OnSelfEnterRoomStatus
{
    EnableToPlay = 0,
    HasNoSeat = 1,          // 没有座位
    Unpaid = 2,             // 未付费
}

export class OnSelfEnterRoomContext extends PipelineContext
    implements IGameId, IHostId, IClientPlayerId, ITotalPlayerCount, ISubgameState
{
    /**
     * 服务器返回的数据
     */
    public response: any = null;

    public gameId: string = null;
    public hostId: string = null;
    public clientPlayerId: string = null;
    public totalPlayerCount: number = null;
    public subgameNameCN: string = null;
    public subgameState: SubgameState = SubgameState.Idle;

    public status: OnSelfEnterRoomStatus = OnSelfEnterRoomStatus.EnableToPlay;
}

export class OnSelfEnterRoomPipeline extends Pipeline<OnSelfEnterRoomContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "OnSelfEnterRoomPipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // 将服务器返回的数据同步到房间、游戏、玩家列表
        this.AddStage("RoomOnSelfEnterGame");
        this.AddCallback(() =>
            {
              Debug.Log("RoomOnSelfEnterGame af")
                return true;
            });
        this.AddStage("SubgameOnSelfEnterGame");
        this.AddStage("ArcadeOnSelfEnterRoom");
      
        // PlayerController 检查本机玩家是否能够游玩此游戏
        this.AddStage("PlayerOnSelfEnterRoom");

        // 若不能游玩，弹出提示
        this.AddCallback(() =>
        {
            if (this.context.status == OnSelfEnterRoomStatus.EnableToPlay)
                return true;
            var tip = "";
            switch (this.context.status)
            {
                case OnSelfEnterRoomStatus.HasNoSeat:
                    tip = "此游戏的玩家数量已达最大值"
                    break;
                case OnSelfEnterRoomStatus.Unpaid:
                    tip = "免费游玩机会已耗尽，请充值";
                    break;
                default:
                    break;
            }
            EventManager.Emit("ShowTip", tip, true, "CloseSubgame");
            return false;
        });

        this.AddStage("GetTotalPlayerCount");

        this.AddCallback(() =>
        {
            // 本机玩家进入游戏，刷新所有玩家的UI
            var playerInfos = this.context.response["gameuser"] as any[];
            for (let i = 0; i < playerInfos.length; i++)
            {
                const playerInfo = playerInfos[i];
                EventManager.Emit("UpdatePlayerUIPipeline", playerInfo["id"], PlayerRoomState.EnterRoom, false);
            }
            return true;
        });

        this.AddCallback(() =>
        {
            // SubgameController 本机玩家第一次进入游戏，子游戏也响应房主的变更，以此来更新UI，或者执行其他逻辑
            EventManager.Emit("UpdateRoomHostPipeline", this.context.gameId, this.context.hostId);
            return true;
        });

        this.AddCallback(() =>
        {
            EventManager.Emit("OnFinishEnterRoomPipeline", this.context.gameId, this.context.clientPlayerId);
            return true;
        });
    }

    private CreateContext(response: any): OnSelfEnterRoomContext
    {
        if (Validator.IsObjectIllegal(response, "response")) return null;
        var context = new OnSelfEnterRoomContext();
        context.response = response;
        context.gameId = response["gameroom"]["gameid"];
        context.hostId = response["gameroom"]["hostid"];
        context.clientPlayerId = sys.localStorage.getItem("ClientPlayerId");
        return context;
    }
}