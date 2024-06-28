import { _decorator, Component, EventTouch, Input, Label, Node, Vec2, Vec3, Widget } from 'cc';
import { EventManager } from '../../../Libraries/Utility/EventManager';
import { Validator } from '../../../Libraries/Utility/Validator';
import { Tools } from './Tools';
import { WXTools } from './Platform/WXTools';
const { ccclass, property } = _decorator;

@ccclass('ReturnButton')
export class ReturnButton extends Component
{
    @property(Label)
    private subgameNameLabel: Label;

    @property(Widget)
    private rootWidget: Widget;

    protected onLoad(): void
    {
        this.node.on(Input.EventType.TOUCH_END, this.OnTouchEvent, this);
        EventManager.On("ShowSubgameName", this.ShowSubgameName, this);

        if (Tools.IsLocalMode())
            this.rootWidget.top += 100;
        else
            this.rootWidget.top += WXTools.GetWXTopOffset();
    }

    protected onDestroy(): void
    {
        this.node.off(Input.EventType.TOUCH_END, this.OnTouchEvent, this);
        EventManager.Off("ShowSubgameName", this.ShowSubgameName, this);
    }

    private ShowSubgameName(subgameName: string): void
    {
        if (Validator.IsStringIllegal(subgameName, "subgameName")) return;
        this.subgameNameLabel.string = subgameName;
    }

    private OnTouchEvent(event: EventTouch)
    {
        // EventManager.Emit("OnReturnButtonTouched", this);
        EventManager.Emit("OnSelfLeaveRoomPipeline", Tools.GetCurrentGameId());
        EventManager.Emit("CloseSubgame", this.node, event);
    }
}