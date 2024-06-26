import { _decorator, Button, CCBoolean, Component, director, EventTouch, sys, Node, find } from 'cc';
import { EventManager } from '../../../Libraries/Utility/EventManager';
import { Architecture } from '../Architecture';
import { LoginUIController } from './LoginUIController';
import { CommonEventType } from '../Common/CommonEventType';
import { Tools } from '../Common/Tools';
import { Debug } from '../../../Libraries/Utility/Debug';
import { Validator } from '../../../Libraries/Utility/Validator';

import { TouchEventProxy } from '../Common/TouchEventProxy';
import { WXTools } from '../Common/Platform/WXTools';
const { ccclass, property, executionOrder } = _decorator;

export enum LoginOpenState
{
    None = "0",                   // 不是从大厅返回的登录场景
    Normal = "1",                 // 是从大厅返回的登录场景
}

@ccclass('LoginController')
@executionOrder(1)
export class LoginController extends Component
{
    private static self: LoginController;

    @property(CCBoolean)
    private tempSkipRoomPanel: boolean = false;     // temp

    private loginUIController: LoginUIController;
    private debugTag: string = "LoginController";
    private inputArcadeId: string[] = [];
    private isEntering: boolean = false;
    private hasEnterQuery: boolean = false;
    private loginOpenState: LoginOpenState = LoginOpenState.None;

    protected onLoad(): void
    {
        LoginController.self = this;

        EventManager.On("OnLoginSceneStart", this.OnLoginSceneStart, this);
        EventManager.On("WXOnHide", this.WXOnHide, this);
        EventManager.On("WXOnShow", this.WXOnShow, this);
        EventManager.On("ReturnToLoginScene", this.ReturnToLoginScene, this);
        EventManager.On("ShowChooseGenderPanel", this.ShowChooseGenderPanel, this);
        EventManager.On("OnLoginAPISuccess", this.OnLoginAPISuccess, this);
        EventManager.On("ShowRequestRespondedError", this.ShowRequestRespondedError, this);
        EventManager.On("OnUserInfoButtonTapped", this.OnUserInfoButtonTapped, this);
        EventManager.On("OnUserInfoButtonTapSuccess", this.OnUserInfoButtonTapSuccess, this);
        EventManager.On("CloseCreateArcadeSuccessDlg", this.CloseCreateArcadeSuccessDlg, this);
        EventManager.On("CloseEnterArcadeDlg", this.CloseEnterArcadeDlg, this);
        EventManager.On("OnCreateArcadeButtonTouched", this.OnCreateArcadeButtonTouched, this);
        EventManager.On("OnEnterArcadeButtonTouched", this.OnEnterArcadeButtonTouched, this);
        EventManager.On("OnInviteFriendsButtonTouched", this.OnInviteFriendsButtonTouched, this);
        EventManager.On("EnterArcadeInCreatedSuccessButton", this.EnterArcadeInCreatedSuccessButton, this);
        EventManager.On("OnArcadeIdInputButtonTouched", this.OnArcadeIdInputButtonTouched, this);
    }

    protected onDestroy(): void
    {
        EventManager.Off("OnLoginSceneStart", this.OnLoginSceneStart, this);
        EventManager.Off("WXOnHide", this.WXOnHide, this);
        EventManager.Off("WXOnShow", this.WXOnShow, this);
        EventManager.Off("ReturnToLoginScene", this.ReturnToLoginScene, this);
        EventManager.Off("ShowChooseGenderPanel", this.ShowChooseGenderPanel, this);
        EventManager.Off("OnLoginAPISuccess", this.OnLoginAPISuccess, this);
        EventManager.Off("ShowRequestRespondedError", this.ShowRequestRespondedError, this);
        EventManager.Off("OnUserInfoButtonTapped", this.OnUserInfoButtonTapped, this);
        EventManager.Off("OnUserInfoButtonTapSuccess", this.OnUserInfoButtonTapSuccess, this);
        EventManager.Off("CloseCreateArcadeSuccessDlg", this.CloseCreateArcadeSuccessDlg, this);
        EventManager.Off("CloseEnterArcadeDlg", this.CloseEnterArcadeDlg, this);
        EventManager.Off("OnCreateArcadeButtonTouched", this.OnCreateArcadeButtonTouched, this);
        EventManager.Off("OnEnterArcadeButtonTouched", this.OnEnterArcadeButtonTouched, this);
        EventManager.Off("OnInviteFriendsButtonTouched", this.OnInviteFriendsButtonTouched, this);
        EventManager.Off("EnterArcadeInCreatedSuccessButton", this.EnterArcadeInCreatedSuccessButton, this);
        EventManager.Off("OnArcadeIdInputButtonTouched", this.OnArcadeIdInputButtonTouched, this);
    }

    private OnLoginSceneStart(): void
    {
        try
        {
            this.loginUIController = find("Canvas/UIController").getComponent(LoginUIController);
        }
        catch (error)
        {
            Debug.Error(error);
        }

        this.Init();
    }

    private Init(): void
    {
        if (!Tools.IsInLoginScene()) return;

        var enterOptions = wx.getEnterOptionsSync();
        var merchantId = enterOptions.query["merid"];
        var numbers = enterOptions.query["numbers"];
        this.loginUIController.logoPanel.active = false;
        this.loginUIController.choseGenderPanel.active = false;

        switch (this.loginOpenState)
        {
            case LoginOpenState.None:
                if (!Validator.IsStringEmpty(merchantId) && !Validator.IsStringEmpty(numbers))
                {
                    Debug.Log(`被邀请成功，房间为：${numbers}`, this.debugTag);
                    this.hasEnterQuery = true;
                    sys.localStorage.setItem("MerchantId", merchantId);
                    sys.localStorage.setItem("ArcadeNumbers", numbers);
                    EventManager.Emit("StartLogin");
                }
                else
                {
                    this.loginUIController.logoPanel.active = true;
                    this.scheduleOnce(() => EventManager.Emit("StartLogin"), 0.2);
                }
                break;

            case LoginOpenState.Normal:
                EventManager.Emit("StartLogin");
                break;

            default:
                break;
        }
    }

    private WXOnHide(): void
    {
        if (!Tools.IsInLoginScene()) return;
    }

    private WXOnShow(): void
    {
        if (!Tools.IsInLoginScene()) return;
        if (WXTools.IsEnterOtherArcade())
        {
            this.loginOpenState = LoginOpenState.None;
            this.Init();
        }
    }

    private ReturnToLoginScene(state: LoginOpenState): void
    {
        this.loginOpenState = state;
    }

    private ShowChooseGenderPanel(): void
    {
        this.loginUIController.logoPanel.active = false;
        this.loginUIController.choseGenderPanel.active = true;
        this.loginUIController.bgNode.active = true;
    }

    private OnLoginAPISuccess(): void
    {
        if (!Tools.IsInLoginScene()) return;
        if (this.hasEnterQuery)
        {
            this.RequestEnterRoomAPI(sys.localStorage.getItem("ArcadeNumbers"));
        }
        else
        {
            this.loginUIController.logoPanel.active = false;
            this.loginUIController.choseGenderPanel.active = false;
            this.loginUIController.bgNode.active = true;

            if (this.tempSkipRoomPanel)
            {
                // temp
                var arcadeId = Tools.GetArcadeId();
                if (!Validator.IsStringEmpty(arcadeId))
                    this.TryLoadArcadeScene();
                else
                {
                    this.loginUIController.ShowArcadeName(sys.localStorage.getItem("ArcadeName"));
                }
            }
            else
            {
                this.loginUIController.ShowArcadeName(sys.localStorage.getItem("ArcadeName"));
            }
        }
    }

    /**
     * 新建房间按钮
     */
    private OnCreateArcadeButtonTouched(proxy: TouchEventProxy, event: EventTouch): void
    {

        var data = { merid: Tools.GetMerchantId() };
        EventManager.Emit(CommonEventType.RequestAPI, "/v1/newroom", data, res =>
        {
            LoginController.self.SaveArcadeData(res);
        });
        EventManager.Emit("PlayButtonAudio");
    }

    private SaveArcadeData(res: any): void
    {
        sys.localStorage.setItem("ArcadeNumbers", res["numbers"]);          // 用于UI的大厅编号
        sys.localStorage.setItem("ArcadeId", res["roomid"]);                // 大厅id
        sys.localStorage.setItem("FullArcadeNumber", res["roomnumber"]);    // 大厅完整的编号
    }

    /**
     * 进入房间按钮
     */
    private OnEnterArcadeButtonTouched(proxy: TouchEventProxy, event: EventTouch): void
    {
        EventManager.Emit("PlayButtonAudio");
    }

    /**
     * 邀请好友按钮
     */
    private OnInviteFriendsButtonTouched(proxy: TouchEventProxy, event: EventTouch): void
    {
        var merchantId = Tools.GetMerchantId();
        var numbers = sys.localStorage.getItem("ArcadeNumbers");
        // 主动拉起转发，进入选择通讯录界面
        wx.shareAppMessage({
            // 转发标题, 没有则默认使用小游戏的昵称
            title: `酒桌嗨起来，房间${numbers}`,
            query: `merid=${merchantId}&numbers=${numbers}`
        });
        EventManager.Emit("PlayButtonAudio");
    }

    /**
     * 房间创建成功里的“进入游戏”按钮
     */
    private EnterArcadeInCreatedSuccessButton(proxy: TouchEventProxy, event: EventTouch): void
    {
        try
        {
            var node = event.target as Node;
            node.getComponent(Button).interactable = false;
        }
        catch (error)
        {
            Debug.Error(error);
        }
        this.TryLoadArcadeScene();
        EventManager.Emit("PlayButtonAudio");
    }

    /**
     * 输入房间号的键盘
     */
    private OnArcadeIdInputButtonTouched(proxy: TouchEventProxy, event: EventTouch): void
    {
        if (Validator.IsObjectIllegal(proxy, "proxy")) return;
        if (Validator.IsStringIllegal(proxy.eventArg, "proxy.eventArg")) return;
        if (this.isEntering) return;
        var data = proxy.eventArg;
        if (data == "delete")
            this.inputArcadeId.pop();
        else
        {
            if (this.inputArcadeId.length == 3) return;
            this.inputArcadeId.push(data);
            if (this.inputArcadeId.length == 3)
            {
                var numbers = this.inputArcadeId.reduce((accumulator, current) => `${accumulator}${current}`, '');
                this.RequestEnterRoomAPI(numbers);
            }
        }
        EventManager.Emit("PlayButtonAudio");
    }

    private RequestEnterRoomAPI(numbers: string): void
    {
        Validator.IsStringIllegal(numbers, "numbers");
        this.isEntering = true;
        var data = {
            merid: Tools.GetMerchantId(),
            numbers: numbers
        };
        EventManager.Emit(CommonEventType.RequestAPI, "/v1/entroom", data, res =>
        {
            LoginController.self.SaveArcadeData(res);
            LoginController.self.TryLoadArcadeScene();
        });
    }

    /**
     * 输入大厅号，进入房间失败
     */
    private ShowRequestRespondedError(url: string, error: number, message: string): void
    {
        Validator.IsStringIllegal(url, "url");
        Validator.IsStringIllegal(message, "message");
        if (url != "/v1/entroom") return;
        EventManager.Emit(CommonEventType.ShowTip, message);
        this.isEntering = false;
        this.inputArcadeId.length = 0;
    }

    private TryLoadArcadeScene(): void
    {
        this.scheduleOnce(() =>
        {
            var bundlesLoaded = Architecture.instance.AreBundlesLoaded();
            var prefabCreated = Architecture.instance.ArePrefabCreated();
            var arcadeScenePreloaded = Architecture.instance.IsArcadeScenePreloaded();
            var logoSpriteLoaded = this.loginUIController.logoSprite.spriteFrame != null;

            var loadArcade = bundlesLoaded && prefabCreated && arcadeScenePreloaded && logoSpriteLoaded;
            if (loadArcade)
                director.loadScene("Arcade", (err, scene) =>
                {
                    LoginController.self.inputArcadeId.length = 0;
                    LoginController.self.isEntering = false;
                    LoginController.self.hasEnterQuery = false;
                });
            else
                this.TryLoadArcadeScene();
        }, 0.2);
    }

    private OnUserInfoButtonTapped(): void
    {
        EventManager.Emit("PlayButtonAudio");
    }

    private OnUserInfoButtonTapSuccess(): void
    {
        this.loginUIController.choseGenderPanel.active = false;
    }

    private CloseCreateArcadeSuccessDlg(): void
    {
    }

    private CloseEnterArcadeDlg(): void
    {
    }
}