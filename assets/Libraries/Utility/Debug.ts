
export class Debug
{
    private static ignores: string[] = [];

    public static SetIgnores(ignores: string[]): void
    {
        Debug.ignores = ignores;
    }

    public static Log(msg: any, tag: string = "Default"): void
    {
        if (Debug.ignores.indexOf(tag) == -1)
        {
            var data = Debug.AddTag(msg, tag);
            console.log(...data);
        }
    }

    public static Error(msg: any, tag: string = "Default"): void
    {
        if (Debug.ignores.indexOf(tag) == -1)
        {
            var data = Debug.AddTag(msg, tag);
            console.error(...data);
        }
    }

    public static Warn(msg: any, tag: string = "Default"): void
    {
        if (Debug.ignores.indexOf(tag) == -1)
        {
            var data = Debug.AddTag(msg, tag);
            console.warn(...data);
        }
    }

    private static AddTag(msg: any, tag: string): any[]
    {
        var data: any[] = [];
        if (typeof msg == "string")
            data.push(`[${tag}]  ${msg}`);
        else
        {
            data.push(`[${tag}]`);
            data.push(msg);
        }
        return data;
    }
}