import { Vec2, Vec3 } from "cc"

export type NetPollStrikeRespData = {
    nextuserid: string
}

export type SyncSettlementTipData = {
    settlementTip: SettlementTipType,
    fallPlayerIds: string[],
    nextPlayerId: string
}
export enum SettlementTipType
{
    NoBallFall,
    OtherMainBallFall,
    EmptyBallFall,
    SelfSubBallFall,
    CloseTip
}

export type SyncSettlementData = {
    gamingPlayerId: string,
    mainBallPos: Vec3,
    subBallPos: Vec2[],
    withCloseTip: boolean
}
export type SyncSubBallFallData = {
    subBallPos: Vec3
}
export type SyncTouchPosData = {
    touchPos: Vec2
}
export type SyncTouchEndData = {
    mainBallForce: Vec2
}
export enum PoolStrikeState
{
    Success = 0,
    Failure = 1
}
export enum InterestingBilliardGamingState
{
    Idle = 0,
    CueSetting = 1,//球杆设置
    CuePushing = 2,
    BallRunning = 3,
    BallEnd = 5,
    Settlement = 4,//游戏结算状态（处理球归位，玩家罚酒，等逻辑）
    Waiting = 6//等待对方重连

}
export enum InterestingBilliardSyncEvent
{
    SyncSettlement = "SyncSettlement",
    IntBilSyncTouchPos = "IntBilSyncTouchPos",
    SyncSubBallFall = "SyncSubBallFall",
    IntBilSyncTouchEnd = "IntBilSyncTouchEnd",
    SyncSettlementTip = "SyncSettlementTip"
}
export enum SettlementConfirmType
{
    OnConfirmSelfMainBallFall = "OnConfirmSelfMainBallFall",
    OnConfirmOtherMainBallFall = "OnConfirmOtherMainBallFall",
    OnConfirmSelfSubBallFall = "OnConfirmSelfSubBallFall",
    OnConfirmOtherSubBallFall = "OnConfirmOtherSubBallFall",
    OnConfirmNoBallFall = "OnConfirmNoBallFall",
    OnConfirmEmptyBallFall = "OnConfirmEmptyBallFall",
    CloseTip = "CloseTip",
    OnConfirmPlayerLeave = "OnConfirmPlayerLeave"
}

export enum SettlementType
{
    MainBallFall = "MainBallFall",
    SelfSubBallFall = "SelfSubBallFall",
    OtherSubBallFall = "OtherSubBallFall",
    NoBallFall = "NoBallFall",
    EmptyBallFall = "EmptyBallFall"
}
export enum NoticeType
{
    All = 0,
    Others = 1
}
export enum SettlementTipEnum
{
    SelfBallFall = "您的球进洞，罚酒一杯，点击确认后下一位",
    OtherBallFall = "的球进洞，请监督其罚酒完",
    OtherNoBallFall = "该玩家无进球",
    EmptyBallFall = "击球进洞，继续击球"
};

export enum BilliardAudioState
{
    StartBgm,
    StopBgm,
    CuePush,
    BallHitNew,
    WallHitNew,
    BallFall,
    Applaud,
    ClockStart,
    ClockEnd,
    BgmPrepare
}

export type SyncIntBilScoreData = {
    playerId: string,
    score: number
}
export type IntBilEndResult = { id: string, sort: number, sign: string, acountName: string, avatarUrl: string }

export type IntBilEndData =
    {
        gameresult: IntBilEndResult[],
        showPunish: boolean,
        victoryName: string
    }
export enum IntBilEvents{
    
    /**
     * 显示桌球失败对话框
     * @param player 要显示的玩家信息
     * @param failedTip 失败提示
     * @param closeEventName 关闭回调事件名
     * @param closeEventArgs 关闭回调参数
     * @param alpha 默认的遮罩透明度
     */
    ShowIntBilFailedDlg="ShowIntBilFailedDlg"
}

export type IntBilTempData={
    gamingPlayerId: string,
    gamingPlayerIds: string[],
    gaming:boolean,
    mainBallPos: Vec3,
    subBallPos: Vec2[],
}