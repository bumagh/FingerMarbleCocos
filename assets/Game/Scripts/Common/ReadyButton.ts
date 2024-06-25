import { _decorator, Button, CCString, Component, EventTouch, Input, Label } from 'cc';
import { EventManager } from '../../../Libraries/Utility/EventManager';
import { Debug } from '../../../Libraries/Utility/Debug';
import { Validator } from '../../../Libraries/Utility/Validator';
import { IGameId } from '../../../Framework/PartyTemplate/Interfaces';
const { ccclass, property } = _decorator;

@ccclass('ReadyButton')
export class ReadyButton extends Component implements IGameId
{
    @property(Button)
    public button: Button;

    @property(Label)
    public label: Label;

    @property(CCString)
    public customShowReadyButton: string = "";

    @property(CCString)
    public customSwitchReadyButton: string = "";

    @property(CCString)
    public customOnTouchEvent: string = "";

    public gameId: string = null;
    public normalTip: string = "准备";
    public hostTip: string = "开始";

    protected onEnable(): void
    {
        EventManager.On("SetReadyButtonGameId", this.SetReadyButtonGameId, this);
        EventManager.On("ShowReadyButton", this.ShowReadyButton, this);
        EventManager.On("SwitchReadyButtonLabel", this.SwitchReadyButtonLabel, this);
        this.button.node.on(Input.EventType.TOUCH_END, this.OnTouchEvent, this);
    }

    protected onDisable(): void
    {
        EventManager.Off("SetReadyButtonGameId", this.SetReadyButtonGameId, this);
        EventManager.Off("ShowReadyButton", this.ShowReadyButton, this);
        EventManager.Off("SwitchReadyButtonLabel", this.SwitchReadyButtonLabel, this);
        this.button.node.off(Input.EventType.TOUCH_END, this.OnTouchEvent, this);
    }

    public SetReadyButtonGameId(gameId: string): void
    {
        this.gameId = gameId;
    }

    public ShowReadyButton(gameId: string, show: boolean): void
    {
        if (this.IsGameIdIncorrect(gameId)) return;
        if (Validator.IsStringEmpty(this.customShowReadyButton))
            this.button.node.active = show;
        else
            EventManager.Emit(this.customShowReadyButton, this, show);
    }

    public SwitchReadyButtonLabel(gameId: string, isHost: boolean): void
    {
        if (this.IsGameIdIncorrect(gameId)) return;
        if (Validator.IsStringEmpty(this.customSwitchReadyButton))
            this.label.string = isHost ? this.hostTip : this.normalTip;
        else
            EventManager.Emit(this.customSwitchReadyButton, this, isHost);
    }

    public OnTouchEvent(event: EventTouch): void
    {
        Debug.Log("点击了准备按钮");
        EventManager.Emit("OnReadyButtonTouched", this);
        if (Validator.IsStringEmpty(this.customOnTouchEvent))
            EventManager.Emit("SelfPreparePipeline");
        else
            EventManager.Emit(this.customOnTouchEvent, this);
    }

    /**
     * gameId不正确
     */
    private IsGameIdIncorrect(gameId: string): boolean
    {
        if (Validator.IsStringIllegal(this.gameId, "this.gameId")) return true;
        if (Validator.IsStringIllegal(gameId, "gameId")) return true;
        return this.gameId != gameId;
    }
}