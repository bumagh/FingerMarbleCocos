import { Sprite, assetManager, ImageAsset, SpriteFrame, Texture2D, director, sys } from "cc";
import { Validator } from "../../../Libraries/Utility/Validator";

export class Tools {
    /**
     * 获取OSS服务器地址
     */
    public static GetOSSUrl(): string {
        return sys.localStorage.getItem("OSSUrl");
    }

    /**
     * 是否在Arcade场景中
     */
    public static IsInArcadeScene(): boolean {
        return director.getScene().name == "Arcade";
    }

    /**
     * 是否在Login场景中
     */
    public static IsInLoginScene(): boolean {
        return director.getScene().name == "Login";
    }

    /**
     * 是否为本机玩家
     */
    public static IsClientPlayer(playerId: string): boolean {
        if (Validator.IsStringIllegal(playerId, "playerId")) return false;
        return playerId == Tools.GetClientPlayerId();
    }

    /**
     * 获取本机玩家的id
     */
    public static GetClientPlayerId(): string {
        return sys.localStorage.getItem("ClientPlayerId");
    }

    /**
     * 获取WebSocket的客户端id
     */
    public static GetClientId(): string {
        return sys.localStorage.getItem("ClientId");
    }

    /**
     * 获取商户id
     */
    public static GetMerchantId(): string {
        return sys.localStorage.getItem("MerchantId");
    }

    /**
     * 获取大厅的Id
     */
    public static GetArcadeId(): string {
        return sys.localStorage.getItem("ArcadeId");
    }

    public static SetCurrentGameId(gameId: string): void {
        if (Validator.IsStringIllegal(gameId, "gameId")) return;
        sys.localStorage.setItem("CurrentGameId", gameId);
    }

    public static GetCurrentGameId(): string {
        return sys.localStorage.getItem("CurrentGameId");
    }

    public static IsLocalMode(): boolean {
        return sys.platform == sys.Platform.EDITOR_PAGE || sys.platform == sys.Platform.MOBILE_BROWSER || sys.platform==sys.Platform.DESKTOP_BROWSER;
    }
}