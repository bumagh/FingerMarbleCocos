import { director, sys } from "cc";
import { EventManager } from "../../Libraries/Utility/EventManager";
import { Validator } from "../../Libraries/Utility/Validator";
import { WebSocketManager } from "./Common/WebSocketManager";
import { Debug } from "../../Libraries/Utility/Debug";
import { PlayerState } from "../../Framework/PartyTemplate/Player/Player";
import { NetUpHostRespData, NetUpTeamIntegralRespData } from "./Common/NetAPITypes";

export class GameWebSocketManager extends WebSocketManager
{
    constructor()
    {
        super();
        this.InitMessageCallbacks();
    }

    private gameDebugTag: string = "GameWebSocketManager";
    private callbacks = new Map<string, (dataObj: any) => void>();

    protected OnWebSocketOpen(event: Event): void { }
    protected OnWebSocketClose(event: CloseEvent): void { }

    private InitMessageCallbacks()
    {
        this.callbacks.set("enterroom", this.OnEnterRoom);
        this.callbacks.set("entergame", this.OnEnterGame);
        this.callbacks.set("leavegame", this.OnLeavegame);
        this.callbacks.set("uphost", this.OnUpdateHost);
        this.callbacks.set("line", this.OnPlayerOffline);
        this.callbacks.set("ping", this.OnPing);
        this.callbacks.set("usergamestate", this.OnPlayerState);
        this.callbacks.set("gameresult", this.OnGameEnd);
        this.callbacks.set("notice", this.OnServerNotice);
        this.callbacks.set("countdown", this.OnCountDown);
        this.callbacks.set("stopdown", this.OnStopDown);
        this.callbacks.set("startdown", this.OnStartDown);
        this.callbacks.set("upgamesetup", this.UpdateGameSetup);
        this.callbacks.set("endgame", this.OnGameEnd);
        this.callbacks.set("bombinitial", this.InitHeartbeatBombs);
        this.callbacks.set("bomblose", this.ThrowOneHeartbeatBomb);
        this.callbacks.set("upintegral", this.UpIntegral);
        this.callbacks.set("tempdata", this.UpdateTempData)
        this.callbacks.set("servertime", this.OnServerTimeCalibrator);
        this.callbacks.set("userindex", this.UpdateSeatIndexes)
    }

    protected OnWebSocketMessage(dataObj: any): void
    {
        if (!Validator.IsStringEmpty(dataObj.clientId))
        {
            sys.localStorage.setItem("ClientId", dataObj.clientId);
            EventManager.Emit("RequestBinduserAPI");
            EventManager.Emit("ArcadeSetClientPlayerId");
        }
        if (Validator.IsStringEmpty(dataObj.type)) return;

        Debug.Log(dataObj, `${this.gameDebugTag}_${dataObj.type}`);

        if (this.callbacks.has(dataObj.type))
            this.callbacks.get(dataObj.type).call(this, dataObj);
        else
            Debug.Log(`GameWebSocketManager未找到${dataObj.type}的回调`, this.gameDebugTag);
    }

    private OnServerNotice(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        EventManager.Emit(dataObj['data']['eventName'], dataObj['data']['eventArgs']);
    }

    private OnEnterRoom(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        Debug.Log(`玩家${dataObj["requestuid"]}进入了大厅`, this.gameDebugTag);
        var playerInfoArray = dataObj["roomuser"] as Array<any>;
        EventManager.Emit("UpdatePlayerList", playerInfoArray);
        if (this.IsInArcadeScene())
        {
            EventManager.Emit("UpdatePlayerAvatarList", playerInfoArray);
            EventManager.Emit("UpdateSubgameViews");
        }
    }

    private OnEnterGame(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        Debug.Log(`玩家${dataObj["requestuid"]}进入了游戏${dataObj["gameroom"]["gameid"]}`, this.gameDebugTag);
        if (dataObj["requestuid"] == sys.localStorage.getItem("ClientPlayerId"))
            EventManager.Emit("OnSelfEnterRoomPipeline", dataObj);
        else
            EventManager.Emit("OnOtherEnterRoomPipeline", dataObj);
    }

    private OnLeavegame(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        Debug.Log(`玩家${dataObj["id"]}离开了游戏`, this.gameDebugTag);
        /**
         * 本机玩家离开游戏的管线，不由WebSocket服务器的消息响应，那样太慢了
         */
        if (this.IsClientPlayer(dataObj["id"])) return;
        EventManager.Emit("OnOtherLeaveRoomPipeline", dataObj["id"]);
    }

    private OnUpdateHost(dataObj: NetUpHostRespData): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        var gameId: string = dataObj.gameid;
        var hostId: string = dataObj['hostid'] ?? dataObj['newhostid'];
        if (Validator.IsObjectIllegal(gameId, "gameId")) return;
        if (Validator.IsObjectIllegal(hostId, "hostId")) return;
        EventManager.Emit("UpdateRoomHostPipeline", gameId.toString(), hostId.toString());
    }

    private OnPlayerOffline(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        Debug.Log(`玩家${dataObj["userlist"]}掉线了`, this.gameDebugTag);
        var userList = dataObj["userlist"] as number[];
        EventManager.Emit("PlayersOfflinePipeline", userList);
    }

    private OnPing(dataObj: any): void
    {
        EventManager.Emit("RequestHeartbeatAPI");
    }

    private OnPlayerState(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;

        var playerState = dataObj["state"] as PlayerState;
        var playerId = dataObj["id"];
        var playerIdArray = dataObj["useridlist"] as number[];

        if (!Validator.IsObjectEmpty(playerId))
            Debug.Log(`玩家${playerId}的状态改为成${playerState}`, this.gameDebugTag);
        if (!Validator.IsObjectEmpty(playerIdArray))
            Debug.Log(`玩家${playerIdArray}的状态改为成${playerState}`, this.gameDebugTag);

        switch (playerState)
        {
            case PlayerState.Idle:
                this.OnPlayerListStateChangedToIdle(playerIdArray);
                break;

            case PlayerState.Ready:
                // 本机玩家的准备状态已经处理，无需在此处理
                if (!this.IsClientPlayer(playerId))
                    EventManager.Emit("OtherPreparePipeline", playerId);
                break;

            case PlayerState.Gaming:
                EventManager.Emit("GamingPipeline", playerIdArray);
                break;

            case PlayerState.GameEnd:
                var sign = dataObj["sign"] as number;
                if (this.IsClientPlayer(playerId))
                    EventManager.Emit("SelfGameEndPipeline", playerId, sign);
                else
                    EventManager.Emit("OtherGameEndPipeline", playerId, sign);
                break;

            default:
                break;
        }
    }

    private OnPlayerListStateChangedToIdle(playerIdArray: number[]): void
    {
        if (Validator.IsObjectEmpty(playerIdArray)) return;
        for (let i = 0; i < playerIdArray.length; i++)
        {
            const id = playerIdArray[i].toString();
            EventManager.Emit("SetPlayerState", id, PlayerState.Idle);
        }
    }

    private OnGameEnd(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        EventManager.Emit("GameEndPipeline", dataObj);
    }

    private IsInArcadeScene(): boolean
    {
        return director.getScene().name == "Arcade";
    }

    private IsClientPlayer(playerId: string): boolean
    {
        if (Validator.IsObjectIllegal(playerId, "playerId")) return false;
        return playerId == sys.localStorage.getItem("ClientPlayerId");
    }

    private OnCountDown(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        EventManager.Emit("GameCountDown", dataObj);
    }

    private OnStartDown(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        EventManager.Emit("GameStartDown", dataObj);
    }

    private OnStopDown(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        EventManager.Emit("GameStopDown", dataObj);
    }

    private UpdateGameSetup(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        EventManager.Emit("UpdateGameSetup", dataObj["gameid"] as string, dataObj["defaultsetup"], dataObj["upsetup"]);
    }

    private InitHeartbeatBombs(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        EventManager.Emit("OnInitHeartbeatBombs", dataObj["bomlist"] as any[]);
    }

    private ThrowOneHeartbeatBomb(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        EventManager.Emit("OnThrowOneHeartbeatBomb", dataObj);
    }

    private UpIntegral(dataObj: NetUpTeamIntegralRespData): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        EventManager.Emit("OnUpIntegral", dataObj);
    }

    private UpdateTempData(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        if (!Validator.IsStringEmpty(dataObj["tempdata"]))
            EventManager.Emit("UpdateTempData", dataObj["gameid"] as string, JSON.parse(dataObj["tempdata"]), false);
    }

    private OnServerTimeCalibrator(dataObj: any): void { }

    private UpdateSeatIndexes(dataObj: any): void
    {
        if (Validator.IsObjectIllegal(dataObj, "dataObj")) return;
        var tempArray = dataObj["indexlist"] as any[];
        var seatArray: [number, number][] = [];
        for (let i = 0; i < tempArray.length; i++)
        {
            const item = tempArray[i];
            seatArray.push([item["id"], item["index"]]);
        }
        EventManager.Emit("UpdateSeatIndexes", dataObj["gameid"], seatArray);
    }
}