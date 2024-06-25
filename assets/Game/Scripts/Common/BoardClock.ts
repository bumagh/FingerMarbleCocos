import { _decorator, Component, Label, Node } from 'cc';
import { EventManager } from '../../../Libraries/Utility/EventManager';
import { Validator } from '../../../Libraries/Utility/Validator';
const { ccclass, property } = _decorator;

@ccclass('BoardClock')
export class BoardClock extends Component
{
    @property(Label)
    public timeLeft: Label;
    private runTimer: number = 30;
    private clockState: boolean = false;
    private onEndClock: string;

    protected onLoad(): void
    {
        EventManager.On("ShowBoardClock", this.ShowBoardClock, this);
    }

    protected onDestroy(): void
    {
        EventManager.Off("ShowBoardClock", this.ShowBoardClock, this);
    }

    private ShowBoardClock(timeLeft: number, onEndClock: string = null): void
    {
        if (timeLeft > 30 || timeLeft <= 0) return;
        this.clockState = true;
        this.runTimer = 30;
        this.timeLeft.string = Math.round(this.runTimer).toString();
        this.onEndClock = onEndClock;
        if (!Validator.IsStringEmpty(this.onEndClock))
            EventManager.Emit(this.onEndClock);
    }

    public GetClockState()
    {
        return this.clockState;
    }

    public SetClockState(state: boolean, timeLeft: number = 30)
    {
        this.timeLeft.string = timeLeft.toString();
        this.clockState = state;
        this.node.active = state;
    }
}