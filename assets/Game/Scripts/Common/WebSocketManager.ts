import { IEntity } from "../../../Framework/PartyTemplate/IEntity";
import { Debug } from "../../../Libraries/Utility/Debug";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { Validator } from "../../../Libraries/Utility/Validator";

export abstract class WebSocketManager implements IEntity
{
    private wssUrl: string = "wss://gameapi.wujinongpi.cn/wss";
    private ws: WebSocket = null;
    private debugTag = "WebSocketManager";

    protected abstract OnWebSocketOpen(event: Event): void;
    protected abstract OnWebSocketMessage(dataObj: any): void;
    protected abstract OnWebSocketClose(event: CloseEvent): void;

    OnEnable(): void
    {
        EventManager.On("InitWebSocket", this.InitWebSocket, this);
        EventManager.On("CloseWebSocket", this.CloseWebSocket, this);
    }

    OnDisable(): void
    {
        EventManager.Off("InitWebSocket", this.InitWebSocket, this);
        EventManager.Off("CloseWebSocket", this.CloseWebSocket, this);
    }

    public InitWebSocket(): void
    {
        if (this.ws != null) return;
        var ws = new WebSocket(this.wssUrl);
        this.ws = ws;
        ws.onopen = (event: Event) =>
        {
            Debug.Log("WebSocket连接成功", this.debugTag);
            this.OnWebSocketOpen(event);
        };
        ws.onmessage = (event: MessageEvent) =>
        {
            var dataObj = JSON.parse(event.data);
            Debug.Log("WebSocket响应消息", this.debugTag);
            Debug.Log(dataObj, this.debugTag);
            this.OnWebSocketMessage(dataObj);
        };
        ws.onclose = (event: CloseEvent) =>
        {
            Debug.Log("WebSocket连接关闭", this.debugTag);
            this.OnWebSocketClose(event);
        };
    }

    public SendMsg(msg: string): void
    {
        if (Validator.IsStringIllegal(msg, "msg")) return;
        if (this.ws == null) return;
        this.ws.send(msg);
    }

    public CloseWebSocket(): void
    {
        if (this.ws == null) return;
        this.ws.close();
        this.ws = null;
    }
}