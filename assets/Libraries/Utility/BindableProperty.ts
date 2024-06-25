import { EventManager } from "./EventManager";

export class BindableProperty<T>
{
    public constructor(propertyName: string, defaultValue: T)
    {
        this.PropertyName = propertyName;
        this.Value = defaultValue;
    }

    private propertyName: string;
    private value: T;

    public get PropertyName(): string
    {
        return this.propertyName;
    }

    private set PropertyName(propertyName: string)
    {
        this.propertyName = propertyName;
    }

    public get Value(): T
    {
        return this.value;
    }

    public set Value(newValue: T)
    {
        if (this.value == newValue) return;
        this.value = newValue;
        EventManager.Emit(`${this.propertyName}Changed`, newValue);
    }
}