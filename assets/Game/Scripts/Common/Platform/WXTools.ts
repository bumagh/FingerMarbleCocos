import 'minigame-api-typings';
import { sys, view } from 'cc';
import { Debug } from '../../../../Libraries/Utility/Debug';
import { Validator } from '../../../../Libraries/Utility/Validator';

export class WXTools
{
    /**
     * 获取菜单按钮（右上角胶囊按钮）的布局位置信息。坐标信息以屏幕左上角为原点。
     */
    public static GetWXTopOffset(): number
    {
        let systemInfo = wx.getSystemInfoSync();
        let windowHeight = systemInfo.windowHeight;
        let gameSize = view.getVisibleSize();
        let gameHeight = gameSize.height;
        let ratio = gameHeight / windowHeight;
        let rect = wx.getMenuButtonBoundingClientRect();
        rect.width *= ratio;
        rect.height *= ratio;
        rect.left *= ratio;
        rect.top *= ratio;
        rect.bottom = gameSize.height - rect.bottom * ratio;
        rect.right = gameSize.width - rect.right * ratio;
        return rect.top;
    }

    /**
     * 获取冷、热启动项进行对比，若大厅号不同，则需要返回登录场景，并进入新的大厅
     */
    public static IsEnterOtherArcade(): boolean
    {
        var lastNumbers = sys.localStorage.getItem("ArcadeNumbers");
        var enterQuery = wx.getEnterOptionsSync().query;
        var enterNumbers = enterQuery["numbers"];
        var result: boolean = false;
        if (!Validator.IsStringEmpty(lastNumbers) && !Validator.IsStringEmpty(enterNumbers))
        {
            result = enterNumbers != lastNumbers;
            if (result)
                Debug.Log(`上一次的房间号与启动项里的房间号不同。lastNumbers: ${lastNumbers}, enterNumbers: ${enterNumbers}`);
        }

        return result;
    }
}