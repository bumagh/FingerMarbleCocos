
import { Debug } from "../../../Libraries/Utility/Debug";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { Validator } from "../../../Libraries/Utility/Validator";
import { NoticeType } from "./Enums";
import { NetEndGameQueryData, NetStartDownQueryData, NetStopDownQueryData, NetUpHostQueryData, NetUpTeamIntegralQueryData, NetUpTeamIntegralRespData } from "./NetAPITypes";
import { Tools } from "./Tools";

export class NetAPITools
{
    public static NetStartDown(subgameId: string, time: number, callBackEventName: string = null)
    {
        var netStartDownQueryData: NetStartDownQueryData = {
            clientid: Tools.GetClientId(),
            roomid: Tools.GetArcadeId(),
            gameid: subgameId,
            time: time
        }
        EventManager.Emit("RequestAPI", "/v1/startdown", netStartDownQueryData, (res: any) =>
        {
            callBackEventName != null && EventManager.Emit(callBackEventName, res);
        });

    }

    public static NetStopDown(subgameId: string, timerid: number, callBackEventName: string = null)
    {
        // if (Validator.IsNumberIllegal(timerid, "NetStopDown timerid")) return;
        if (timerid == 0) return;
        var netStopDownQueryData: NetStopDownQueryData = {
            clientid: Tools.GetClientId(),
            roomid: Tools.GetArcadeId(),
            gameid: subgameId,
            timerid: timerid
        }
        EventManager.Emit("RequestAPI", "/v1/stopdown", netStopDownQueryData, (res: any) =>
        {
            callBackEventName != null && EventManager.Emit(callBackEventName, res);

        });
    }

    public static NetEndGame(subgameId: string, callBackEventName: string = null)
    {
        var data: NetEndGameQueryData = {
            clientid: Tools.GetClientId(),
            roomid: Tools.GetArcadeId(),
            gameid: subgameId,
        };
        EventManager.Emit("RequestAPI", "/v1/endgame", data, (res: any) =>
        {
            callBackEventName != null && EventManager.Emit(callBackEventName, res);
        });
    }

    /**
     * 发送通知广播
     * @param gameId 游戏ID。不发送到游戏房间，传入一个空值
     * @param eventName 
     * @param eventArgs 
     * @param type NoticeType = NoticeType.All
     * @returns 
     */
    public static SendNotice(gameId: string, eventName: string, eventArgs: any, type: NoticeType = NoticeType.All): void
    {
        if (Validator.IsStringIllegal(eventName, "eventName")) return;
        if (Validator.IsObjectIllegal(eventArgs, "eventArgs")) return;
        var data = {
            clientid: Tools.GetClientId(),
            roomid: Tools.GetArcadeId(),
            type: type,
            data: {
                eventName: eventName,
                eventArgs: eventArgs
            }
        };
        if (!Validator.IsStringEmpty(gameId))
            data["gameid"] = gameId;

        EventManager.Emit("RequestAPI", "/v1/sendnotice", data);
    }

    public static NetUpTeamIntegral(subgameId: string, score: number, teamId: number, callBackEventName: string = null)
    {
        if (teamId == 0)
        {
            Debug.Log("teamId不能为0");
            return;
        }
        var query: NetUpTeamIntegralQueryData = {
            clientid: Tools.GetClientId(),
            roomid: Tools.GetArcadeId(),
            gameid: subgameId,
            integral: score,
            teamid: teamId
        }
        EventManager.Emit("RequestAPI", "/v1/upteamintegral", query, (res: NetUpTeamIntegralRespData) =>
        {
            callBackEventName != null && EventManager.Emit(callBackEventName, res);
        });
    }

    public static NetUpHost(subgameId: string, hostid: number, callBackEventName: string = null)
    {
        var query: NetUpHostQueryData = {
            clientid: Tools.GetClientId(),
            roomid: Tools.GetArcadeId(),
            gameid: subgameId,
            hostid: hostid
        }
        EventManager.Emit("RequestAPI", "/v1/uphost", query, (res: any) =>
        {
            Debug.Log("NetUpHost");
            Debug.Log(res);
            callBackEventName != null && EventManager.Emit(callBackEventName, res);
        });
    }

    public static Prepare(subgameId: string, hostId: string): void
    {
        var data = {
            clientid: Tools.GetClientId(),
            roomid: Tools.GetArcadeId(),
            gameid: subgameId,
            hostid: hostId
        };
        EventManager.Emit("RequestAPI", "/v1/gameprepare", data);
    }

    public static SetGameTempdata(subgameId: string, tempdata: string, callBackEventName: string = null): void
    {
        if (Validator.IsStringIllegal(subgameId, "subgameId")) return;
        if (Validator.IsStringIllegal(tempdata, "tempdata")) return;
        var data = {
            clientid: Tools.GetClientId(),
            roomid: Tools.GetArcadeId(),
            gameid: subgameId,
            tempdata: tempdata
        };
        EventManager.Emit("RequestAPI", "/v1/tempdata", data, (res: any) =>
        {
            if (!Validator.IsStringEmpty(callBackEventName))
                EventManager.Emit(callBackEventName, res);
        });
    }

    public static UpdateSeat(subgameId: string, toIndex: number, onSuccess: (response: any) => void = null): void
    {
        var data = {
            clientid: Tools.GetClientId(),
            roomid: Tools.GetArcadeId(),
            gameid: subgameId,
            toindex: toIndex
        };
        EventManager.Emit("RequestAPI", "/v1/upseat", data, onSuccess);
    }
}