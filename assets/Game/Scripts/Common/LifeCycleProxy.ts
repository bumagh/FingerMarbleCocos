import { _decorator, CCString, Component } from 'cc';
import { EventManager } from '../../../Libraries/Utility/EventManager';
import { LifeCycle } from './Enums';
const { ccclass, property, executionOrder } = _decorator;

@ccclass('LifeCycleProxy')
@executionOrder(999)
export class LifeCycleProxy extends Component
{
    @property(CCString)
    public objectName: string;

    @property({ type: LifeCycle })
    public lifeCycle: LifeCycle = LifeCycle.None;

    protected onLoad(): void
    {
        if (this.lifeCycle == LifeCycle.OnLoad)
            EventManager.Emit(`On${this.objectName}Load`);
    }

    protected onEnable(): void
    {
        if (this.lifeCycle == LifeCycle.OnEnable)
            EventManager.Emit(`On${this.objectName}Enable`);
    }

    protected start(): void
    {
        if (this.lifeCycle == LifeCycle.Start)
            EventManager.Emit(`On${this.objectName}Start`);

    }

    protected update(dt: number): void
    {
        if (this.lifeCycle == LifeCycle.Update)
            EventManager.Emit(`On${this.objectName}Update`, dt);

    }

    protected lateUpdate(dt: number): void
    {
        if (this.lifeCycle == LifeCycle.LateUpdate)
            EventManager.Emit(`On${this.objectName}LateUpdate`, dt);
    }

    protected onDisable(): void
    {
        if (this.lifeCycle == LifeCycle.OnDisable)
            EventManager.Emit(`On${this.objectName}Disable`);
    }

    protected onDestroy(): void
    {
        if (this.lifeCycle == LifeCycle.OnDestroy)
            EventManager.Emit(`On${this.objectName}Destroy`);
    }
}