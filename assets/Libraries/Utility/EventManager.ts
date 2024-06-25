import { Debug } from "./Debug";
import { List } from "./List";

export class Event
{
    constructor(type: string, callback: (...any: any[]) => void, target?: unknown)
    {
        this.type = type;
        this.callback = callback;
        this.target = target;
    }

    public type: string;
    public callback: (...any: any[]) => void;
    public target: unknown;
}

export class EventManager
{
    private static events = new Map<string, List<Event>>();
    public static onCallbackApply: (type: string, ...any: any[]) => void = null;

    public static On<TFunction extends (...any: any[]) => void>(type: string, callback: TFunction, target?: unknown)
    {
        var list: List<Event>;
        if (!EventManager.events.has(type))
        {
            list = new List<Event>();
            EventManager.events.set(type, list);
        }
        list = EventManager.events.get(type);
        list.Add(new Event(type, callback, target));
    }

    public static Off<TFunction extends (...any: any[]) => void>(type: string, callback: TFunction, target?: unknown)
    {
        if (!EventManager.events.has(type))
        {
            Debug.Error(`注销事件时，未找到事件${type}`);
            return;
        }
        var list: List<Event> = EventManager.events.get(type);
        var event: Event = list.Find(item => item.callback === callback && item.target === target);
        if (event != undefined)
            list.Remove(event);
        else
            Debug.Error(`注销事件时，未找到事件${type}，目标为${target}`);
    }

    public static Apply(onApply: boolean, type: string, ...any: any[]): void
    {
        if (!EventManager.events.has(type))
        {
            Debug.Warn(`发送事件时，未找到事件${type}`);
            return;
        }
        var list: List<Event> = EventManager.events.get(type);
        // 将事件数组写入新的临时数组，防止事件在执行时改变原本的数组
        var tempEventArray = list.items.filter(item => item != null);
        for (var event of tempEventArray)
        {
            event.callback.apply(event.target, any);
            if (onApply)
                EventManager.onCallbackApply(type, ...any);
        }
    }

    public static Emit(type: string, ...any: any[]): void
    {
        EventManager.Apply(false, type, ...any);
    }

    public static Broadcast(type: string, ...any: any[]): void
    {
        EventManager.Apply(true, type, ...any);
    }
}