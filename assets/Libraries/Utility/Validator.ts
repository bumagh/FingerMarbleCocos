import { Debug } from "./Debug";

export class Validator
{
  public static IsObjectIllegal(target: any, targetName: string, debugTag: string = "Validator"): boolean
  {
    var illegal = target == null || target == undefined;
    if (illegal) Debug.Error(`对象${targetName}为空`, debugTag);
    return illegal;
  }

  public static IsObjectEmpty(target: any): boolean
  {
    return target == null || target == undefined;
  }

  public static IsStringIllegal(target: string, targetName: string, debugTag: string = "Validator"): boolean
  {
    var illegal = target == null || target == "" || target == undefined;
    if (illegal) Debug.Error(`字符串${targetName}为空`, debugTag);
    return illegal;
  }

  public static IsStringEmpty(target: string): boolean
  {
    return target == null || target == "" || target == undefined;
  }

  public static IsNumberIllegal(target: number, targetName: string): boolean
  {
    var illegal = Number.isNaN(target) || target == null || target == undefined || target <= 0;
    if (illegal) Debug.Error(`数字${targetName}为空或小于等于0`);
    return illegal;
  }

  public static IsNumberIllegalNoStrict(target: number, targetName: string): boolean
  {
    var illegal = Number.isNaN(target) || target == null || target == undefined;
    if (illegal) Debug.Error(`数字${targetName}为空`);
    return illegal;
  }

  public static IsArrayOutOfIndex<T>(array: T[], index: number): boolean
  {
    if (Validator.IsNumberIllegalNoStrict(index, "index") || index < 0 || index >= array.length)
    {
      Debug.Error(`数组${array}的索引${index}越界`);
      return true;
    }
    return false;
  }
}
