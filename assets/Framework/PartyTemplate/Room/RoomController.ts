import { Room } from "./Room";
import { IEntity } from "../IEntity";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { Validator } from "../../../Libraries/Utility/Validator";
import { OnSelfEnterRoomContext } from "./Pipelines/OnSelfEnterRoomPipeline";
import { Debug } from "../../../Libraries/Utility/Debug";
import { SelfPrepareContext } from "../Player/Pipelines/SelfPreparePipeline";
import { UpdateRoomHostContext } from "./Pipelines/UpdateRoomHostPipeline";
import { PipelineContext } from "../../../Libraries/Utility/PipelineContext";
import { IGameId, IHostId, ITotalPlayerCount } from "../Interfaces";

export class RoomController implements IEntity
{
    constructor(roomId: string, gameId: string)
    {
        this.room = new Room();
        this.room.id = roomId;
        this.room.gameId = gameId;
    }

    room: Room;

    OnEnable(): void
    {
        EventManager.On("RoomOnSelfEnterGame", this.RoomOnSelfEnterGame, this);
        EventManager.On("RoomOnSelfPrepare", this.RoomOnSelfPrepare, this);
        EventManager.On("RoomOnUpdateHost", this.RoomOnUpdateHost, this);
        EventManager.On("GetHostId", this.GetHostId, this);
        EventManager.On("RoomOnStartGameInNoReadyMode", this.RoomOnStartGameInNoReadyMode, this);
    }

    OnDisable(): void
    {
        EventManager.Off("RoomOnSelfEnterGame", this.RoomOnSelfEnterGame, this);
        EventManager.Off("RoomOnSelfPrepare", this.RoomOnSelfPrepare, this);
        EventManager.Off("RoomOnUpdateHost", this.RoomOnUpdateHost, this);
        EventManager.Off("GetHostId", this.GetHostId, this);
        EventManager.Off("RoomOnStartGameInNoReadyMode", this.RoomOnStartGameInNoReadyMode, this);
    }

    private RoomOnSelfEnterGame(context: OnSelfEnterRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "OnEnterRoomContext")) return;
        if (Validator.IsObjectIllegal(context.response, "response")) return;
        var gameRoom = context.response["gameroom"];
        if (Validator.IsObjectIllegal(gameRoom, "gameRoom")) return;
        if (this.room.gameId != gameRoom["gameid"]) return;
        this.room.hostId = gameRoom["hostid"];   
        this.room.maxPlayerCount = gameRoom["maxpeonum"];
        this.room.minPlayerCount = gameRoom["minpeonum"];
        context.StageComplete();
    }

    private RoomOnSelfPrepare(context: SelfPrepareContext): void
    {
        if (Validator.IsObjectIllegal(context, "SelfPrepareContext")) return;
        context.hostId = this.room.hostId;
        // 若是房主
        if (this.room.hostId == context.playerId)
        {
            // 检查准备人数是否足够开启游戏，若不足，弹出提示
            if (this.room.minPlayerCount > context.readyPlayerCount)
            {
                EventManager.Emit("ShowTip", "游戏准备人数不足，无法开始游戏", true);
                return;
            }
        }
        // 若不是房主
        else
        {
            if (this.room.maxPlayerCount < context.readyPlayerCount)
            {
                EventManager.Emit("ShowTip", "此游戏的人数已满，请等待下一轮", true);
                return;
            }
        }
        context.StageComplete();
    }

    private RoomOnUpdateHost(context: UpdateRoomHostContext): void
    {
        if (Validator.IsObjectIllegal(context, "UpdateRoomHostContext")) return;
        if (this.room.gameId == context.gameId)
            this.room.hostId = context.hostId;
        context.StageComplete();
    }

    private GetHostId(context: PipelineContext & IGameId & IHostId): void
    {
        if (Validator.IsObjectIllegal(context, "PipelineContext & IHostId")) return;
        if (this.room.gameId == context.gameId)
            context.hostId = this.room.hostId;
        context.StageComplete();
    }

    /**
     * 在不需要准备的游戏里开始游戏，检查游戏房间内的人数是否足够
     */
    private RoomOnStartGameInNoReadyMode(context: PipelineContext & IGameId & ITotalPlayerCount): void
    {
        if (Validator.IsObjectIllegal(context, "PipelineContext & IGameId & IRoom")) return;
        if (this.room.gameId != context.gameId) return;

        if (this.room.minPlayerCount > context.totalPlayerCount)
        {
            EventManager.Emit("ShowTip", "游戏人数不足，无法开始游戏", true);
            return;
        }
        else if (this.room.maxPlayerCount < context.totalPlayerCount)
        {
            EventManager.Emit("ShowTip", "此游戏的人数已超出允许的最大值，无法开始游戏", true);
            return;
        }
        context.StageComplete();
    }
}