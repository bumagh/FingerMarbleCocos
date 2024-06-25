import { IEntity } from "../../Framework/PartyTemplate/IEntity";
import { EventManager } from "./EventManager";
import { Validator } from "./Validator";

export class PipelineContext
{
    private stageComplete: boolean;

    public StageComplete(): void
    {
        this.stageComplete = true;
    }

    public get NextStage(): boolean
    {
        if (!this.stageComplete) return false;
        this.stageComplete = false;
        return true;
    }
}

abstract class BasePipeline<TContext extends PipelineContext> implements IEntity
{
    constructor()
    {
        this.SetPipelineName();
        this.SetCreateContext();
        this.SetStages();
    }

    protected pipelineName: string;
    protected createContext: (...any: any[]) => TContext;
    protected context: TContext;
    protected stages = new Array<any>();

    public OnEnable(): void
    {
        EventManager.On(this.pipelineName, this.Run, this);
    }

    public OnDisable(): void
    {
        EventManager.Off(this.pipelineName, this.Run, this);
    }

    protected abstract Run(...any: any[]): void;
    protected abstract SetPipelineName(): void;
    protected abstract SetCreateContext(): void;
    protected abstract SetStages(): void;
}

export abstract class Pipeline<TContext extends PipelineContext> extends BasePipeline<TContext>
{
    protected AddStage(type: string): Pipeline<TContext>
    {
        this.stages.push(() =>
        {
            EventManager.Emit(type, this.context);
            return this.context.NextStage;
        });
        return this;
    }

    protected AddCallback<TFunction extends () => boolean>(callback: TFunction): Pipeline<TContext>
    {
        this.stages.push(() => callback.apply(this, this.context));
        return this;
    }

    protected Run(...any: any[]): void
    {
        this.context = this.createContext.apply(this, any);
        if (Validator.IsObjectIllegal(this.context, `${this.pipelineName}'s context`))
            return;
        for (const stage of this.stages)
        {
            if (!stage.apply(this, this.context))
                break;
        }
    }
}

export class PipelineScheduleFunction
{
    public static scheduleOnce: (callback: any, delay: number) => void = null;
}

export abstract class SchedulePipeline<TContext extends PipelineContext> extends BasePipeline<TContext>
{
    protected AddStage(type: string, delay: number = 0): SchedulePipeline<TContext>
    {
        this.stages.push([() =>
        {
            EventManager.Emit(type, this.context);
            return this.context.NextStage;
        }, delay]);
        return this;
    }

    protected AddCallback<TFunction extends () => boolean>(callback: TFunction, delay: number = 0): SchedulePipeline<TContext>
    {
        this.stages.push([() => callback.apply(this, this.context), delay]);
        return this;
    }

    protected Run(...any: any[]): void
    {
        this.context = this.createContext.apply(this, any);
        if (Validator.IsObjectIllegal(this.context, `${this.pipelineName}'s context`))
            return;
        if (Validator.IsObjectIllegal(PipelineScheduleFunction.scheduleOnce, "PipelineScheduleFunction.scheduleOnce"))
            return;

        var nextStage: boolean = true;
        var totalDelay: number = 0;
        for (const stage of this.stages)
        {
            totalDelay += stage[1];
            PipelineScheduleFunction.scheduleOnce.apply(this, [() =>
            {
                if (nextStage)
                    nextStage = stage[0].apply(this, this.context);
            }, totalDelay]);
        }
    }
}