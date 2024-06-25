
export class List<T>
{
    public items: T[] = [];

    /**
     * 添加元素到集合末尾
     */
    public Add(item: T): void
    {
        this.items.push(item);
    }

    /**
     * 移除集合中的元素
     */
    public Remove(item: T): boolean
    {
        const index = this.items.indexOf(item);
        if (index !== -1)
        {
            this.items.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * 获取集合大小 
     */
    public get Count(): number
    {
        return this.items.length;
    }

    public AllCount<TFunction extends (item: T) => boolean>(predicate: TFunction): number
    {
        var count = 0;
        for (var i = 0; i < this.items.length; i++)
        {
            if (predicate(this.items[i]))
                count++;
        }
        return count;
    }

    /**
     * 根据索引获取元素
     */
    public ItemAt(index: number): T
    {
        return this.items[index];
    }

    /**
     * 查找符合条件的元素
     */
    public Find<TFunction extends (item: T) => boolean>(predicate: TFunction): T
    {
        return this.items.find(predicate);
    }

    /**
     * 查找所有符合条件的元素
     */
    public FindAll<TFunction extends (item: T) => boolean>(predicate: TFunction): T[]
    {
        return this.items.filter(predicate);
    }

    /**
     * 是否包含传入的元素
     */
    public Has(item: T): boolean
    {
        return this.Exists(i => i == item);
    }

    /**
     * 是否存在符合条件的元素
     */
    public Exists<TFunction extends (item: T) => boolean>(predicate: TFunction): boolean
    {
        for (var i = 0; i < this.items.length; i++)
        {
            if (predicate(this.items[i]))
                return true;
        }
        return false;
    }

    public ForEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void
    {
        this.items.forEach(callbackfn, thisArg);
    }

    /**
     * 清空集合
     */
    public Clear(): void
    {
        this.items.length = 0;
    }
}