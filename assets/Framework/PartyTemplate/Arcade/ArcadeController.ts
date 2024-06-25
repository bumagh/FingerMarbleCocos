import { Component, _decorator, director, sys, Node, EventTouch } from "cc";
import { Debug } from "../../../Libraries/Utility/Debug";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { Validator } from "../../../Libraries/Utility/Validator";
import { Player, PlayerState } from "../Player/Player";
import { PlayerController } from "../Player/PlayerController";
import { Arcade } from "./Arcade";
import { OnSelfEnterRoomContext } from "../Room/Pipelines/OnSelfEnterRoomPipeline";
import { PlayersOfflineContext } from "../Player/Pipelines/PlayersOfflinePipeline";
import { PipelineContext } from "../../../Libraries/Utility/PipelineContext";
import { IGameId, IReadyPlayerCount, ITotalPlayerCount, IClonePlayers, IGamingPlayerCount, IPlayerIdList } from "../Interfaces";
import { List } from "../../../Libraries/Utility/List";
import { CommonEventType } from "../../../Game/Scripts/Common/CommonEventType";
import { Tools } from "../../../Game/Scripts/Common/Tools";
import { TouchEventProxy } from "../../../Game/Scripts/Common/TouchEventProxy";
import { LoginOpenState } from "../../../Game/Scripts/Login/LoginController";
const { ccclass, property } = _decorator;

@ccclass('ArcadeController')
export class ArcadeController extends Component
{
    arcade: Arcade;

    private debugTag: string = "ArcadeController";

    protected onLoad(): void
    {
        EventManager.On("OnBackToLoginButtonTouched", this.OnBackToLoginButtonTouched, this);
        EventManager.On("ReturnToLoginScene", this.ReturnToLoginScene, this);
        EventManager.On("ArcadeSetClientPlayerId", this.ArcadeSetClientPlayerId, this);
        EventManager.On("UpdatePlayerList", this.UpdatePlayerList, this);
        EventManager.On("RemoveOfflinePlayerControllers", this.RemoveOfflinePlayerControllers, this);
        EventManager.On("ArcadeOnSelfEnterRoom", this.ArcadeOnSelfEnterRoom, this);
        EventManager.On("GetTotalPlayerCount", this.GetTotalPlayerCount, this);
        EventManager.On("GetReadyPlayerCount", this.GetReadyPlayerCount, this);
        EventManager.On("GetGamingPlayerCount", this.GetGamingPlayerCount, this);
        EventManager.On("GetPlayerCloneListInSubgame", this.GetPlayerCloneListInSubgame, this);
        EventManager.On("GetPlayerIdListInSubgame", this.GetPlayerIdListInSubgame, this);
        EventManager.On("UpdateSeatIndexes", this.UpdateSeatIndexes, this);

        this.Init();
    }

    protected onDestroy(): void
    {
        EventManager.Off("OnBackToLoginButtonTouched", this.OnBackToLoginButtonTouched, this);
        EventManager.Off("ReturnToLoginScene", this.ReturnToLoginScene, this);
        EventManager.Off("ArcadeSetClientPlayerId", this.ArcadeSetClientPlayerId, this);
        EventManager.Off("UpdatePlayerList", this.UpdatePlayerList, this);
        EventManager.Off("RemoveOfflinePlayerControllers", this.RemoveOfflinePlayerControllers, this);
        EventManager.Off("ArcadeOnSelfEnterRoom", this.ArcadeOnSelfEnterRoom, this);
        EventManager.Off("GetTotalPlayerCount", this.GetTotalPlayerCount, this);
        EventManager.Off("GetReadyPlayerCount", this.GetReadyPlayerCount, this);
        EventManager.Off("GetGamingPlayerCount", this.GetGamingPlayerCount, this);
        EventManager.Off("GetPlayerCloneListInSubgame", this.GetPlayerCloneListInSubgame, this);
        EventManager.Off("GetPlayerIdListInSubgame", this.GetPlayerIdListInSubgame, this);
        EventManager.Off("UpdateSeatIndexes", this.UpdateSeatIndexes, this);
    }

    protected Init(): void
    {
        this.arcade = new Arcade();
        this.arcade.id = sys.localStorage.getItem("ArcadeId");
    }

    private OnBackToLoginButtonTouched(proxy: TouchEventProxy, event: EventTouch): void
    {
        EventManager.Emit("ReturnToLoginScene", proxy.eventArg);
    }

    protected ReturnToLoginScene(state: LoginOpenState): void
    {
        for (let i = 0; i < this.arcade.playerControllers.Count; i++)
        {
            const controller = this.arcade.playerControllers.items[i];
            controller.OnDisable();
        }
        this.arcade.playerControllers.Clear();
        EventManager.Emit(CommonEventType.RequestAPI, "/v1/endroom", { clientid: Tools.GetClientId() });
        EventManager.Emit("CloseWebSocket");
        // 延迟1帧，等待需要销毁的常驻节点销毁完毕
        this.scheduleOnce(() =>
        {
            director.loadScene("Login", (error, scene) =>
            {
                if (error)
                    Debug.Error(error);
            });
        })
    }

    private ArcadeSetClientPlayerId(): void
    {
        this.arcade.clientPlayerId = sys.localStorage.getItem("ClientPlayerId");
    }

    private UpdatePlayerList(playerInfoArray: any[]): void
    {
        if (Validator.IsObjectIllegal(playerInfoArray, "playerInfoArray")) return;
        var tempArray = Array.from(this.arcade.playerControllers.items);
        // 将所有不在info里的玩家控制器销毁
        for (let i = 0; i < tempArray.length; i++)
        {
            const controller = tempArray[i];
            const playerInfo = playerInfoArray.find(p => p["id"] == controller.player.id);
            // 玩家不在列表中，移除
            if (Validator.IsObjectEmpty(playerInfo)) 
            {
                controller.OnDisable();
                this.arcade.playerControllers.Remove(controller);
            }
            // 玩家在列表中，更新数据
            else
            {
                controller.player.arcadeId = playerInfo["roomid"];
                controller.player.gameId = playerInfo["gameid"];
            }
        }
        // 生成所有尚未创建的玩家控制器对象
        for (let i = 0; i < playerInfoArray.length; i++)
        {
            const playerInfo = playerInfoArray[i];
            const controller = this.arcade.playerControllers.Find(p => p.player.id == playerInfo["id"]);
            if (Validator.IsObjectEmpty(controller)) 
            {
                var playerController = new PlayerController();
                var player = new Player();
                player.id = playerInfo["id"];
                player.acountName = playerInfo["wxnickname"];
                player.avatarUrl = playerInfo["wxavatarurl"];
                player.gender = playerInfo["wxgender"];
                player.arcadeId = playerInfo["roomid"];
                player.gameId = playerInfo["gameid"];
                playerController.player = player;
                playerController.OnEnable();
                this.arcade.playerControllers.Add(playerController);
            }
        }
    }

    private RemoveOfflinePlayerControllers(context: PlayersOfflineContext): void
    {
        if (Validator.IsObjectIllegal(context, "OtherOfflineContext")) return;
        if (Validator.IsObjectIllegal(context.playerIds, "playerIds")) return;
        var tempArray = Array.from(this.arcade.playerControllers.items);
        // 将所有不在info里的玩家控制器销毁
        for (let i = 0; i < tempArray.length; i++)
        {
            const controller = tempArray[i];
            const index = context.playerIds.findIndex(id => id.toString() == controller.player.id);
            // 玩家在列表中，移除
            if (index > -1) 
            {
                controller.OnDisable();
                this.arcade.playerControllers.Remove(controller);
                // 移除缓存里的头像文件
                EventManager.Emit("RemoveRemoteSpriteFrame", "PlayerAvatar", controller.player.id);
            }
        }
        context.StageComplete();
    }

    private ArcadeOnSelfEnterRoom(context: OnSelfEnterRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "OnEnterRoomContext")) return;
        if (Validator.IsObjectIllegal(context.response, "response")) return;
        var playerInfoArray = context.response["gameuser"];
        if (Validator.IsObjectIllegal(playerInfoArray, "playerInfoArray")) return;
        for (let i = 0; i < playerInfoArray.length; i++)
        {
            const playerInfo = playerInfoArray[i];
            const controller = this.arcade.playerControllers.Find(c => c.player.id == playerInfo["userid"]);
            if (Validator.IsObjectEmpty(controller)) continue;
            controller.SetPlayerRuntimeData(playerInfo);
        }
        this.LogPlayerIdList();
        context.StageComplete();
    }

    /**
     * 获取相应小游戏内玩家数据的拷贝
     */
    private GetPlayerCloneListInSubgame(context: PipelineContext & IGameId & IClonePlayers): void
    {
        if (Validator.IsObjectIllegal(context, "GetPlayerCloneListInSubgame context")) return;
        var clonePlayers = new List<Player>();
        for (let i = 0; i < this.arcade.playerControllers.items.length; i++)
        {
            const controller = this.arcade.playerControllers.items[i];
            if (controller.player.gameId == context.gameId)
                clonePlayers.Add(controller.player.Clone());
        }
        context.clonePlayers = clonePlayers;
        context.StageComplete();
    }

    /**
     * 获取相应小游戏内的所有玩家的id列表
     */
    private GetPlayerIdListInSubgame(context: PipelineContext & IGameId & IPlayerIdList): void
    {
        if (Validator.IsObjectIllegal(context, "GetPlayerIdListInSubgame context")) return;
        context.playerIdList = new List<string>();
        for (let i = 0; i < this.arcade.playerControllers.items.length; i++)
        {
            const controller = this.arcade.playerControllers.items[i];
            if (controller.player.gameId == context.gameId)
                context.playerIdList.Add(controller.player.id);
        }
        context.StageComplete();
    }

    /**
     * 获取游戏内的全部玩家
     */
    private GetTotalPlayerCount(context: PipelineContext & IGameId & ITotalPlayerCount): void
    {
        if (Validator.IsObjectIllegal(context, "GetTotalPlayerCount context")) return;
        context.totalPlayerCount = this.arcade.playerControllers.items
            .filter(c => c.player.gameId == context.gameId).length;
        context.StageComplete();
    }

    /**
     * 获取游戏内已准备的玩家的数量
     */
    private GetReadyPlayerCount(context: PipelineContext & IGameId & IReadyPlayerCount): void
    {
        if (Validator.IsObjectIllegal(context, "GetReadyPlayerCount context")) return;
        context.readyPlayerCount = this.GetPlayerCountOfState(PlayerState.Ready, context.gameId);
        context.StageComplete();
    }

    /**
     * 获取游戏内正在游玩的玩家的数量
     */
    private GetGamingPlayerCount(context: PipelineContext & IGameId & IGamingPlayerCount): void
    {
        if (Validator.IsObjectIllegal(context, "GetGamingPlayerCount context")) return;
        context.gamingPlayerCount = this.GetPlayerCountOfState(PlayerState.Gaming, context.gameId);
        context.StageComplete();
    }

    private GetPlayerCountOfState(playerState: PlayerState, gameId: string): number
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return 0;
        return this.arcade.playerControllers.items
            .filter(c => c.player.state == playerState && c.player.gameId == gameId)
            .length;
    }

    private UpdateSeatIndexes(gameId: string, seatArray: [number, number][]): void
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return;
        if (Validator.IsObjectIllegal(seatArray, "seatArray")) return;
        for (let i = 0; i < seatArray.length; i++)
        {
            const seat = seatArray[i];
            const playerId = seat[0].toString();
            const controller = this.arcade.playerControllers.Find(controller => controller.player.id == playerId);
            if (!Validator.IsObjectEmpty(controller))
                controller.player.seatIndex = seat[1];
        }
    }

    /**
     * 打印大厅的玩家id列表
     */
    public LogPlayerIdList(): void
    {
        var playerIds: string;
        var length = this.arcade.playerControllers.Count;
        for (let i = 0; i < length; i++)
        {
            const playerId = this.arcade.playerControllers.items[i].player.id;
            if (playerIds == undefined)
                playerIds = `${playerId}`;
            else
                playerIds += `${playerId}`;
            if (i != length - 1)
                playerIds += ", ";
        }
        if (playerIds == undefined)
            playerIds = "空";
        Debug.Log(`大厅${this.arcade.id}的玩家列表：${playerIds}`, this.debugTag);
    }

    public LogPlayerList(): void
    {
        for (let i = 0; i < this.arcade.playerControllers.items.length; i++)
        {
            const controller = this.arcade.playerControllers.items[i];
            Debug.Log(controller.player, this.debugTag);
        }
    }
}