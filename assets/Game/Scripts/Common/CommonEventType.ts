
export enum CommonEventType
{
    /**
     * 显示提示
     * @param tip 提示的内容
     * @param confirm 是否有确认按钮
     * @param onConfirmEvent 确认后的回调事件
     */
    ShowTip = "ShowTip",

    /**
     * 显示确认框
     * @param tip 提示内容
     * @param onConfirmEvent 确认回调
     * @param onCancelEvent 取消回调
     * @param onConfirmArgs 确认回调参数，若有多个，必须写成数组
     * @param onCancelArgs 取消回调参数，若有多个，必须写成数组
     * @returns void
     */
    ShowConfirm = "ShowConfirm",

    /**
     * 刷新确认框的提示文本
     * @param tipData IRefreshConfirmTip 接口
     */
    RefreshConfirmTip = "RefreshConfirmTip",

    /**
     * 显示提示
     * @param tip 提示的内容
     * @param confirm 是否有确认按钮
     * @param onConfirmEvent 确认后的回调事件
     * @param onConfirmArgs 确认后的回调事件的参数
     */
    ShowTipWithArgs = "ShowTipWithArgs",

    /**
     * 显示提示
     * @param tip 提示的内容
     * @param confirm 是否有确认按钮
     * @param duration 提示框的持续时间
     * @param onConfirmEvent 确认后的回调事件
     * @param beforeDuration 打开提示框的延时
     */
    ShowTipDuration = "ShowTipDuration",

    /**
     * 旋转提示框
     * @param canvasAngle canvas的旋转角度
     */
    RotateTipDlg = "RotateTipDlg",

    /**
     * 显示简单提示
     * @param tip 提示的内容
     */
    ShowSimpleTip = "ShowSimpleTip",

    /**
     * 旋转掉线提示框
     * @param canvasAngle canvas的旋转角度
     */
    RotateOfflineTipDlg = "RotateOfflineTipDlg",

    /**
     * 显示普通消息
     * @param msg 消息的内容
     */
    ShowMessage = "ShowMessage",

    /**
     * 显示玩家相关的消息，消息中带有玩家头像和玩家账号
     * @param playerId 玩家id
     * @param acountName 玩家昵称
     * @param avatarUrl 玩家头像的url
     * @param leftMsg 玩家昵称左边的文字
     * @param rightMsg 玩家昵称右边的文字
     */
    ShowPlayerMessage = "ShowPlayerMessage",

    /**
     * 显示玩家加入队伍的消息
     * @param playerId 玩家id
     * @param acountName 玩家昵称
     * @param avatarUrl 玩家头像的url
     * @param team 队伍
     */
    ShowJoinTeamMessage = "ShowJoinTeamMessage",

    /**
     * 旋转消息对话框，并设置新的消息位置
     * @param canvasAngle canvas的旋转角度
     * @param startPos 消息的起始位置
     * @param centerPos 消息的中心位置
     * @param endPos 消息的结束位置
     */
    RotateMessageDlg = "RotateMessageDlg",

    /**
     * 用远程图片设置Sprite
     * @param tag 标签
     * @param id 编号
     * @param sprite 图片的组件
     * @param avatarUrl 图片的url
     */
    SetRemoteSpriteFrame = "SetRemoteSpriteFrame",

    /**
     * 发送时间同步的通知
     * @param gameId 游戏id
     * @param triggerEvent 需要同步响应的事件
     * @param triggerEventArgs 需要同步响应的事件的参数，参数无需用数组包装
     */
    SendSyncNotice = "SendSyncNotice",

    /**
     * 发送时间同步的通知
     * @param gameId 游戏id
     * @param triggerDelay 同步响应的延迟，单位ms
     * @param triggerEvent 需要同步响应的事件
     * @param triggerEventArgs 需要同步响应的事件的参数，参数无需用数组包装
     */
    SendSyncNoticeWithDelay = "SendSyncNoticeWithDelay",

    /**
     * 向服务器发送请求
     * @param url API的地址
     * @param data 请求的数据
     * @param onSuccess 请求成功的回调，参数为 response: any，无返回值
     * @param method 请求的方式：GET/POST
     */
    RequestAPI = "RequestAPI",

    /**
     * 显示等待部分玩家一起开始游戏的提示
     * @param players 玩家列表
     */
    ShowWaittingPlayersStartTip = "ShowWaittingPlayersStartTip",

    /**
     * 开启/关闭艺术字的自动倒计时
     * @param show 开启/关闭
     * @param countdown 倒计时
     */
    ShowAutoSpriteClock = "ShowAutoSpriteClock",

    /**
     * 开启/关闭艺术字的手动倒计时
     * @param show 开启/关闭
     * @param time 时间
     * @returns 
     */
    ShowManualSpriteClock = "ShowManualSpriteClock",
    /**
    * 显示排行榜
    * @param gameId 游戏id
    * @param ranks 排行数组
    * @param signFontSize 成绩文字大小默认55
    * @param showPunishList 是否显示惩罚 默认true
    * @param sortInc 是否递增排列 默认false
    * @returns 
    */
    ShowRankListDlg = "ShowRankListDlg",

    /**
     * 启用/禁用异常帧检测器
     * @param enable 
     */
    EnableExceptionalFrameDetector = "EnableExceptionalFrameDetector",

    /**
     *  播放正在预播放的BGM，并预播放下一个音频
     * @param gameId 游戏id
     * @param playIndex 当前bgm在播放列表的索引
     * @param position 当前音频的播放位置（单位 s）
     */
    PlayInnerBGM = "PlayInnerBGM",

    /**
     * 校准BGM
     * @param gameId 游戏id
     * @param position 需要校准到的播放位置（单位 s）
     */
    CalibrateInnerBGM = "CalibrateInnerBGM",
}