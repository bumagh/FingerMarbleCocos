import { EventTouch, _decorator, director, error, find, game, sys } from "cc";
import { ArcadeController } from "../../../Framework/PartyTemplate/Arcade/ArcadeController";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { Validator } from "../../../Libraries/Utility/Validator";
import { ArcadeUIController } from "./ArcadeUIController";
import { Debug } from "../../../Libraries/Utility/Debug";
import { Tools } from "../Common/Tools";
import { TouchEventProxy } from "../Common/TouchEventProxy";
import { LoginOpenState } from "../Login/LoginController";
const { ccclass, property } = _decorator;

/**
 * 大厅场景打开的方式
 */
enum ArcadeOpenState
{
    FromLoginScene,         // 从登录场景打开
    FromArcadeScene,        // 从大厅场景中掉线重连
    FromSubgameScene,       // 从小游戏场景打开
}

@ccclass("GameArcadeController")
export class GameArcadeController extends ArcadeController
{
    private static self: GameArcadeController;

    @property(ArcadeUIController)
    public arcadeUIController: ArcadeUIController;

    private openState: ArcadeOpenState = ArcadeOpenState.FromLoginScene;
    private selfDebugTag: string = "GameArcadeController";

    protected onLoad(): void
    {
        GameArcadeController.self = this;
        game.frameRate = 60;

        super.onLoad();

        EventManager.On("OnArcadeSceneStart", this.OnArcadeSceneStart, this);
        EventManager.On("ArcadeLoadGameList", this.ArcadeLoadGameList, this);
        EventManager.On("UpdatePlayerAvatarList", this.UpdatePlayerAvatarList, this);
        EventManager.On("OpenSubgame", this.OpenSubgame, this);
        EventManager.On("CloseSubgame", this.CloseSubgame, this);
        EventManager.On("ReloginOnArcadeScene", this.ReloginOnArcadeScene, this);
        EventManager.On("OnStartGameTouchEnd", this.OnStartGameTouchEnd, this);
    }

    private OnStartGameTouchEnd(touch: TouchEventProxy, event: EventTouch)
    {
        director.loadScene("Game", (err, scene) =>
        {
            this.OnEnterGame({
                requestuid: "1",
                roomuser: [{
                    id: "1",
                    roomid: "1",
                    gameid: "1",
                    nickname: "1",
                    avatarurl: "1",
                    gender: "1",
                }],
                gameroom: {
                    gameid: "1",
                    hostid: "1",
                    maxpeonum: 100,
                    minpeonum: 1,
                    
                }
            });
        });
    }
    protected onDestroy(): void
    {
        super.onDestroy();

        EventManager.Off("OnArcadeSceneStart", this.OnArcadeSceneStart, this);
        EventManager.Off("ArcadeLoadGameList", this.ArcadeLoadGameList, this);
        EventManager.Off("UpdatePlayerAvatarList", this.UpdatePlayerAvatarList, this);
        EventManager.Off("OpenSubgame", this.OpenSubgame, this);
        EventManager.Off("CloseSubgame", this.CloseSubgame, this);
        EventManager.Off("ReloginOnArcadeScene", this.ReloginOnArcadeScene, this);
        EventManager.Off("OnStartGameTouchEnd", this.OnStartGameTouchEnd, this);

    }

    protected ReturnToLoginScene(state: LoginOpenState): void
    {
        super.ReturnToLoginScene(state);

        this.openState = ArcadeOpenState.FromLoginScene;
    }

    private OnArcadeSceneStart(): void
    {
        this.arcadeUIController = find("Canvas").getComponent(ArcadeUIController);
        this.arcadeUIController.openSubgame = this.OpenSubgame;

        switch (this.openState)
        {
            case ArcadeOpenState.FromLoginScene:
                sys.localStorage.setItem("ClientPlayerId", "1")
                // EventManager.Emit("RequestSetUserInfo");
                var dataObj = {
                    requestuid: "1",
                    roomuser: [{
                        id: "1",
                        roomid: "1",
                        gameid: "1",
                        nickname: "1",
                        avatarurl: "1",
                        gender: "1",
                    }],
                    gameroom: {
                        gameid: "1",
                        hostid: "1",
                        maxpeonum: 100,
                        minpeonum: 1,
                    }
                };
                this.OnEnterRoom(dataObj);
                break;

            case ArcadeOpenState.FromArcadeScene:
                EventManager.Emit("StartLogin");
                break;

            case ArcadeOpenState.FromSubgameScene:
                // 请求并加载游戏列表
                EventManager.Emit("RequestGameHallAPI");
                // 加载玩家列表
                for (let i = 0; i < this.arcade.playerControllers.Count; i++)
                {
                    const controller = this.arcade.playerControllers.items[i];
                    const showReadyIcon = Number(controller.player.gameId) > 0;
                }
                this.arcadeUIController.SetPlayerCountLabel(this.arcade.playerControllers.Count);
                break;

            default:
                break;
        }
    }
    private OnEnterRoom(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        Debug.Log(`玩家${dataObj["requestuid"]}进入了大厅`, this.selfDebugTag);
        var playerInfoArray = dataObj["roomuser"] as Array<any>;
        EventManager.Emit("UpdatePlayerList", playerInfoArray);
        if (Tools.IsInArcadeScene())
        {
            EventManager.Emit("UpdatePlayerAvatarList", playerInfoArray);
            // EventManager.Emit("UpdateSubgameViews");
        }

    }

    private OnEnterGame(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        Debug.Log(`玩家${dataObj["requestuid"]}进入了游戏${dataObj["gameroom"]["gameid"]}`, this.selfDebugTag);
        if (dataObj["requestuid"] == sys.localStorage.getItem("ClientPlayerId"))
            EventManager.Emit("OnSelfEnterRoomPipeline", dataObj);
        else
            EventManager.Emit("OnOtherEnterRoomPipeline", dataObj);
    }
    /**
     * 大厅加载游戏列表
     */
    private ArcadeLoadGameList(gameList: object[], gameTypeList: object[]): void
    {
        if (!Tools.IsInArcadeScene()) return;
        if (Validator.IsObjectIllegal(gameList, "gameList")) return;
        if (Validator.IsObjectIllegal(gameTypeList, "gameTypeList")) return;

        gameList.sort((a, b) => Number(b["looknum"]) - Number(a["looknum"]));
        for (let i = 0; i < gameList.length; i++)
        {
            const game = gameList[i];
            var type = game["gametype"];
            var id = game["id"];
            var isHot = game["ishot"];
            var lookNum = game["looknum"];
            // this.arcadeUIController.CreateSubgameCell(id, type, isHot, lookNum);
        }
    }

    private UpdatePlayerAvatarList(playerInfoArray: any[]): void
    {
        if (!Tools.IsInArcadeScene()) return;
        if (Validator.IsObjectIllegal(playerInfoArray, "playerInfoArray")) return;
        this.arcadeUIController.SetPlayerCountLabel(playerInfoArray.length);
    }


    private GetGamePlayerCount(): Map<string, number>
    {
        var gamePlayerCount = new Map<string, number>();
        for (let i = 0; i < this.arcade.playerControllers.Count; i++)
        {
            const controller = this.arcade.playerControllers.items[i];
            var roomId = controller.player.gameId;
            if (Validator.IsStringEmpty(roomId)) continue;
            if (gamePlayerCount.has(roomId))
                gamePlayerCount.set(roomId, gamePlayerCount.get(roomId) + 1);
            else
                gamePlayerCount.set(roomId, 1);
        }
        return gamePlayerCount;
    }


    /***
     * 打开小游戏
     */
    private OpenSubgame(sceneName: string, roomId: string): void
    {
        if (!Tools.IsInArcadeScene()) return;
        if (Validator.IsStringIllegal(sceneName, "sceneName")) return;
        Tools.SetCurrentGameId(roomId);
        EventManager.Emit("LoadSceneFromBundle", sceneName);
    }

    /**
     * 关闭小游戏
     */
    private CloseSubgame(proxy: TouchEventProxy, event: EventTouch): void
    {
        this.openState = ArcadeOpenState.FromSubgameScene;
        director.loadScene("Arcade", (error, scene) =>
        {
            if (error) return;
            game.frameRate = 60;
            Debug.Log("从小游戏中回到大厅", this.selfDebugTag);
        });
    }

    /**
     * 在大厅场景中重新登录，并刷新大厅
     */
    private ReloginOnArcadeScene(): void
    {
        Debug.Log("在大厅场景中重新登录，并刷新大厅", this.selfDebugTag);
        this.openState = ArcadeOpenState.FromArcadeScene;
        this.OnArcadeSceneStart();
    }
}