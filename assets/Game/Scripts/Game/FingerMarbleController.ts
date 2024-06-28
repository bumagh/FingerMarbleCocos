import { EventTouch, _decorator, Vec2, Vec3, RigidBody2D, Collider2D, game, ConeCollider, sys } from "cc";
import { IGameId, IIsClientPlayerGaming, IClonePlayers, ISubgameState } from "../../../Framework/PartyTemplate/Interfaces";
import { PlayerState } from "../../../Framework/PartyTemplate/Player/Player";
import { OnFinishEnterRoomContext } from "../../../Framework/PartyTemplate/Room/Pipelines/OnFinishEnterRoomPipeline";
import { OnSelfEnterRoomContext } from "../../../Framework/PartyTemplate/Room/Pipelines/OnSelfEnterRoomPipeline";
import { LeaveRoomContext } from "../../../Framework/PartyTemplate/Room/Pipelines/OnSelfLeaveRoomPipeline";
import { UpdateRoomHostContext } from "../../../Framework/PartyTemplate/Room/Pipelines/UpdateRoomHostPipeline";
import { GameEndContext } from "../../../Framework/PartyTemplate/Subgame/Pipelines/GameEndPipeline";
import { UpdatePlayerUIContext } from "../../../Framework/PartyTemplate/Subgame/Pipelines/UpdatePlayerUIPipeline";
import { SubgameState } from "../../../Framework/PartyTemplate/Subgame/Subgame";
import { SubgameController } from "../../../Framework/PartyTemplate/Subgame/SubgameController";
import { Debug } from "../../../Libraries/Utility/Debug";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { PipelineContext } from "../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../Libraries/Utility/Validator";
import { NoticeType } from "../Common/Enums";
import { TouchEventProxy } from "../Common/TouchEventProxy";
import { FingerMarbleBall } from "./FingerMarbleBall";
import { FingerMarbleGame } from "./FingerMarbleGame";
import { SettlementConfirmType, SyncSettlementData, InterestingBilliardGamingState, SyncTouchPosData, InterestingBilliardSyncEvent, BilliardAudioState, SyncSubBallFallData, SettlementType, SyncSettlementTipData, SettlementTipType, SettlementTipEnum, IntBilEvents, IntBilEndData, SyncTouchEndData, IntBilTempData } from "./InterestingBilliardTypes";
import { Tools } from "../Common/Tools";
import { NetAPITools } from "../Common/NetAPITools";
import { NetCountDownRespData } from "../Common/NetAPITypes";
import { CommonEventType } from "../Common/CommonEventType";
import { ReadyButton } from "../Common/ReadyButton";
import { FingerMarbleUIController } from "./FingerMarbleUIController";
const { ccclass, property } = _decorator;

@ccclass('FingerMarbleController')
export class FingerMarbleController extends SubgameController
{
    @property(FingerMarbleUIController)
    public gameUIController: FingerMarbleUIController;
    public override subgame: FingerMarbleGame;
    private debugTag: string = "FingerMarbleController";
    private moveTimeCounter: number = 0;//触控计时器
    private moveCounter: number = 0;
    private lastMoveTimeCounter: number = 0;
    private countDownTimerId: number = 0;//倒计时的计时器id
    private subBallFallPos: Vec3 = new Vec3();
    private MOVE_SYNC_RATE: number = 2;//触控同步频率
    private MAXTIMER = 65;
    protected onLoad(): void
    {
        super.onLoad();
        // this.gameUIController.readyButton.customOnTouchEvent = "OnIntBilReadyButtonTouch";
        EventManager.On("OnIntBilReadyButtonTouch", this.OnIntBilReadyButtonTouch, this);
        EventManager.On("OnTouchAreaTouched", this.OnTouchAreaTouched, this);
        EventManager.On("OnTouchAreaTouchEnd", this.OnTouchAreaTouchEnd, this);
        EventManager.On("OnTouchAreaTouchMove", this.OnTouchAreaTouchMove, this);
        //球与球和墙 碰撞逻辑
        EventManager.On("onContactCallBack", this.onContactCallBack, this);
        EventManager.On("onBallContactCallBack", this.onBallContactCallBack, this);
        //计时结束回调
        EventManager.On("GameCountDown", this.OnGameCountDown, this);
        EventManager.On("GameStartDown", this.OnGameStartDown, this);
        EventManager.On("GameStopDown", this.OnGameStopDown, this);
        EventManager.On("SyncSettlement", this.OnSyncSettlement, this);
        EventManager.On("SyncSettlementTip", this.SyncSettlementTip, this);
        EventManager.On("IntBilSyncTouchPos", this.IntBilSyncTouchPos, this);
        EventManager.On("IntBilSyncTouchEnd", this.IntBilSyncTouchEnd, this);
        EventManager.On("IntBilGamingStateChange", this.IntBilGamingStateChange, this);
        EventManager.On("IntBilCloseConfirmTip", this.IntBilCloseConfirmTip, this);
        EventManager.On("IntBilSetAudioCurTime", this.IntBilSetAudioCurTime, this);

        EventManager.On("IntBilUpdateUI", this.IntBilUpdateUI, this);
        EventManager.On("IntBilUpdatePartialPlayerList", this.IntBilUpdatePartialPlayerList, this);
        // EventManager.On("IntBilGamingSetCurRoundPlayerIds", this.IntBilGamingSetCurRoundPlayerIds, this);
        EventManager.On("IntBilEndGameConfirm", this.IntBilEndGameConfirm, this);
        EventManager.On("IntBilPlayerReconnected", this.IntBilPlayerReconnected, this);
        //固定低帧率，为了适配低配机型
        game.frameRate = 30;
    }

    protected onDestroy(): void
    {
        super.onDestroy();
        EventManager.Off("OnIntBilReadyButtonTouch", this.OnIntBilReadyButtonTouch, this);

        EventManager.Off("OnTouchAreaTouched", this.OnTouchAreaTouched, this);
        EventManager.Off("OnTouchAreaTouchEnd", this.OnTouchAreaTouchEnd, this);
        EventManager.Off("OnTouchAreaTouchMove", this.OnTouchAreaTouchMove, this);

        EventManager.Off("onContactCallBack", this.onContactCallBack, this);
        EventManager.Off("onBallContactCallBack", this.onBallContactCallBack, this);

        EventManager.Off("GameCountDown", this.OnGameCountDown, this);
        EventManager.Off("GameStartDown", this.OnGameStartDown, this);
        EventManager.Off("GameStopDown", this.OnGameStopDown, this);

        EventManager.Off("SyncSettlementTip", this.SyncSettlementTip, this);
        EventManager.Off("IntBilSyncTouchPos", this.IntBilSyncTouchPos, this);
        EventManager.Off("IntBilSyncTouchEnd", this.IntBilSyncTouchEnd, this);

        //击球结果(从服务器拿下一个玩家id)
        EventManager.Off("IntBilCloseConfirmTip", this.IntBilCloseConfirmTip, this);
        EventManager.Off("IntBilGamingStateChange", this.IntBilGamingStateChange, this);

        EventManager.Off("IntBilSetAudioCurTime", this.IntBilSetAudioCurTime, this);
        EventManager.Off("IntBilUpdateUI", this.IntBilUpdateUI, this);
        EventManager.Off("IntBilUpdatePartialPlayerList", this.IntBilUpdatePartialPlayerList, this);
        // EventManager.Off("IntBilGamingSetCurRoundPlayerIds", this.IntBilGamingSetCurRoundPlayerIds, this);
        EventManager.Off("IntBilEndGameConfirm", this.IntBilEndGameConfirm, this);
        EventManager.Off("IntBilPlayerReconnected", this.IntBilPlayerReconnected, this);
        EventManager.Off("SyncSettlement", this.OnSyncSettlement, this);

    }

    protected start(): void
    {
        super.start();
        // this.gameUIController.boardClock.SetClockState(false);
        //模拟机器人进入房间
        //界面更新
    }


    private IntBilCloseConfirmTip(data: { nextPlayerId: string, confirmType: SettlementConfirmType })
    {
        if (this.ShouldGameEnd())
        {
            this.gameUIController.ResetAllBalls();
            var syncSettlementData: SyncSettlementData = {
                gamingPlayerId: data.nextPlayerId,
                mainBallPos: new Vec3(),
                subBallPos: [],
                withCloseTip: false,
            };
            // this.GameEnd();
            this.ForceGameEnd();
            // NetAPITools.SendNotice(this.subgameId, InterestingBilliardSyncEvent.SyncSettlement, syncSettlementData, NoticeType.Others);
            return;
        }
        switch (data.confirmType)
        {
            case SettlementConfirmType.CloseTip:
                this.SyncPollStrikeRespDataToOther(data.nextPlayerId, true);
                break;
            case SettlementConfirmType.OnConfirmSelfMainBallFall:
                this.SyncPollStrikeRespDataToOther(data.nextPlayerId, true);
                break;
            case SettlementConfirmType.OnConfirmNoBallFall:
                this.SyncPollStrikeRespDataToOther(data.nextPlayerId, false);
                break;
            case SettlementConfirmType.OnConfirmOtherMainBallFall:
                break;
            case SettlementConfirmType.OnConfirmOtherSubBallFall:
                break;
            case SettlementConfirmType.OnConfirmEmptyBallFall:
                break;
            case SettlementConfirmType.OnConfirmSelfSubBallFall:

                break;
            default:
                break;
        }
    }


    /**
        * 开始触控
        * @param node 
        * @param event 
        */
    private OnTouchAreaTouched(proxy: TouchEventProxy, event: EventTouch): void
    {
        if(Tools.IsLocalMode()){
            // this.gameUIController.ShowCueSetting(event.getLocation());
            // this.subgame.touchTimer = 0;
            // this.subgame.touchStarted = true;
            Debug.Log("test");
            return;
        }
        if (this.subgame.state != SubgameState.Gaming) return;
        if (this.subgame.gamingState != InterestingBilliardGamingState.CueSetting) return;
        if (!Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId)) return;
        //当前是本地玩家回合
        this.gameUIController.ShowCueSetting(event.getLocation());
        this.subgame.touchTimer = 0;
        this.subgame.touchStarted = true;
        //同步到其他玩家
        var data: SyncTouchPosData = {
            touchPos: event.getLocation()
        }
        NetAPITools.SendNotice(this.subgameId, InterestingBilliardSyncEvent.IntBilSyncTouchPos, data, NoticeType.Others);
    }
    /**
    * 移动触控
    * @param node 
    * @param event 
    */
    private OnTouchAreaTouchMove(proxy: TouchEventProxy, event: EventTouch): void
    {
        if(Tools.IsLocalMode()){
            this.gameUIController.ShowCueSetting(event.getLocation());
            return;
        }
        if (this.subgame.state != SubgameState.Gaming) return;
        if (this.subgame.gamingState != InterestingBilliardGamingState.CueSetting) return;
        if (!Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId)) return;
        this.gameUIController.ShowCueSetting(event.getLocation());
        //控制同步的频率 房主在设置中设置同步频率
        var roundCounter = Math.round(this.moveTimeCounter);
        if ((roundCounter % this.MOVE_SYNC_RATE == 0 && (roundCounter - this.lastMoveTimeCounter) >= this.MOVE_SYNC_RATE))
            this.lastMoveTimeCounter = roundCounter;
        if (this.moveCounter++ % 20 == 0 || (roundCounter % this.MOVE_SYNC_RATE == 0 && (roundCounter - this.lastMoveTimeCounter) >= this.MOVE_SYNC_RATE))
        {
            var data: SyncTouchPosData = {
                touchPos: event.touch.getLocation()
            }
            NetAPITools.SendNotice(this.subgameId, InterestingBilliardSyncEvent.IntBilSyncTouchPos, data, NoticeType.Others);
        }

    }

    private OnTouchAreaTouchEnd(proxy: TouchEventProxy, event: EventTouch): void
    {
        if(Tools.IsLocalMode()){
            this.subgame.touchStarted = false;
            //同步本地到其他玩家
            this.gameUIController.StartPushCue(this.subgameId, true);
            return;
        }
        if (this.subgame.state != SubgameState.Gaming) return;
        if (this.subgame.gamingState != InterestingBilliardGamingState.CueSetting) return;
        if (!Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId)) return;
        NetAPITools.NetStopDown(this.subgameId, this.countDownTimerId);
        EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.ClockEnd);
        EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.CuePush);
        this.subgame.touchStarted = false;
        //同步本地到其他玩家
        this.gameUIController.StartPushCue(this.subgameId, true);

    }

    //碰撞逻辑
    private onContactCallBack(node: Node, otherCollider: Collider2D): void
    {
        //处理球进洞的逻辑
        //白球复位
        if (otherCollider.node.name == "MainBall")
        {
            EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.BallFall);
            //处理玩家当前轮次结算记录
            //进入结算状态
            if (!this.subgame.curRoundFallBalls.Exists(ball => ball.isMainBall == true))
                this.subgame.curRoundFallBalls.Add(otherCollider.node.getComponent<FingerMarbleBall>(FingerMarbleBall));
            otherCollider.node.getComponent<RigidBody2D>(RigidBody2D).linearVelocity = new Vec2(0, 0);

            this.scheduleOnce(() => otherCollider.node.setPosition(this.gameUIController.resetMainBallWorldSpacePos), 0.4);
            // this.scheduleOnce(() => otherCollider.node.active=false, 0.4);
        }
        //其他球随机位置
        if (otherCollider.node.name.startsWith("MainBall-"))
        {
            EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.BallFall);
            //处理玩家当前轮次结算记录
            if (!this.subgame.curRoundFallBalls.Exists(ball => ball.isMainBall == false))
                this.subgame.curRoundFallBalls.Add(otherCollider.node.getComponent<FingerMarbleBall>(FingerMarbleBall));
            otherCollider.node.getComponent<RigidBody2D>(RigidBody2D).linearVelocity = new Vec2(0, 0);
            var randPosX = -100000;
            var randPosY = -100000;
            if (Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId))
            {
                //处理从服务器同步的随机位置
                //这里发送给服务器位置
                var syncSubBallFallData: SyncSubBallFallData = { subBallPos: new Vec3(randPosX, randPosY) };
                NetAPITools.SendNotice(this.subgameId, InterestingBilliardSyncEvent.SyncSubBallFall, syncSubBallFallData, NoticeType.Others);
            }
            this.scheduleOnce(() => otherCollider.node.setPosition(new Vec3(randPosX, randPosY)), 0.4);
        }
    }
    private onBallContactCallBack(node: Node, otherCollider: Collider2D): void
    {
        //处理球碰撞
        if (otherCollider.node.name.startsWith("MainBall-"))
        {
            EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.BallHitNew);
        } else if (otherCollider.node.name.startsWith("Wall"))
        {
            EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.WallHitNew);
        }
    }
    //服务器给倒计时
    private OnGameCountDown(countDown: NetCountDownRespData)
    {
        this.countDownTimerId = countDown.timerid;
        if ((countDown.time - (this.MAXTIMER - this.subgame.maxCueSettingTime)) == 1)
        {
            //当前倒计时结束，需手动结束
            NetAPITools.NetStopDown(this.subgameId, this.countDownTimerId);
            if (Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId))
                this.SettlementByState(SettlementType.NoBallFall);
            else 
            {
                if (this.subgame.partialPlayerList.Exists(pp => pp.id == this.subgame.tempData.gamingPlayerId && pp.gameId != this.subgameId))
                    Tools.IsClientPlayer(this.subgame.hostId) && EventManager.Emit(CommonEventType.ShowTipDuration, "对方掉线，等待对方重连中......点击确定结束本轮游戏", true, 1, "IntBilEndGameConfirm", 0.5);
            }
            return;
        }
        if ((countDown.time - (this.MAXTIMER - this.subgame.maxCueSettingTime)) == this.subgame.clockTipTime)
            EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.ClockStart);
        this.gameUIController.boardClock.timeLeft.string = (countDown.time - (this.MAXTIMER - this.subgame.maxCueSettingTime)).toString();
    }
    private OnGameStartDown(data: any)
    {
        this.gameUIController.boardClock.SetClockState(true, this.subgame.maxCueSettingTime);
    }
    private OnGameStopDown(data: any)
    {
        this.countDownTimerId = 0;
        this.gameUIController.boardClock.SetClockState(false);
        EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.ClockEnd);
        this.gameUIController.boardClock.timeLeft.string = this.subgame.maxCueSettingTime.toString();
    }
    protected LoadSubgameData(): void
    {
        // if (this.debugMode)
        // {
        //     this.subgameId = "1";
        //     this.subgameNameCN = "来局弹珠";
        // }
        // else
            super.LoadSubgameData();
    }

    //从服务器处理游戏结算提示
    private SyncSettlementTip(syncSettlementTipData: SyncSettlementTipData)
    {
        switch (syncSettlementTipData.settlementTip)
        {
            case SettlementTipType.NoBallFall:
                EventManager.Emit("ShowTip", SettlementTipEnum.OtherNoBallFall, false);
                break;
            case SettlementTipType.CloseTip:
                EventManager.Emit("CloseTip");
                break;
            case SettlementTipType.OtherMainBallFall:
                EventManager.Emit("ShowTip", (this.subgame.partialPlayerList.Find(pp => pp.id == this.subgame.tempData.gamingPlayerId))?.acountName + SettlementTipEnum.OtherBallFall, true);
                break;
            case SettlementTipType.EmptyBallFall:
                EventManager.Emit("ShowTip", this.subgame.partialPlayerList.Find(pp => pp.id == this.subgame.tempData.gamingPlayerId)?.acountName + " " + SettlementTipEnum.EmptyBallFall, false);
                break;
            case SettlementTipType.SelfSubBallFall:
                if (syncSettlementTipData.fallPlayerIds.find(playerId => Tools.IsClientPlayer(playerId)) != undefined)
                {
                    EventManager.Emit(IntBilEvents.ShowIntBilFailedDlg, this.subgame.partialPlayerList.Find(pp => pp.id == Tools.GetClientPlayerId()), "被击进洞", "IntBilCloseConfirmTip", { nextPlayerId: syncSettlementTipData.nextPlayerId, confirmType: SettlementConfirmType.CloseTip });
                }
                else
                {
                    //确定是监督其他人喝
                    EventManager.Emit(CommonEventType.ShowTip, this.subgame.partialPlayerList.Find(pp => pp.id == syncSettlementTipData.fallPlayerIds[0])?.acountName + SettlementTipEnum.OtherBallFall, true);
                }
                break;
            default:
                break;
        }
    }
    private ShouldGameEnd()
    {
        var shouldGameEnd: boolean = false;
        var playerOneBallCount: number = 0;
        var playerTwoBallCount: number = 0;
        var playerOneId: string = "";
        var playerTwoId: string = "";

        if (this.subgame.tempData.gamingPlayerIds.length == 2)
        {
            playerOneId = this.subgame.tempData.gamingPlayerIds[0];
            playerTwoId = this.subgame.tempData.gamingPlayerIds[1];
        }
        playerOneBallCount = this.gameUIController.subBalls.AllCount(ball => ball.playerId == playerOneId && ball.GetLocalPos()?.x < -9000);
        playerTwoBallCount = this.gameUIController.subBalls.AllCount(ball => ball.playerId == playerTwoId && ball.GetLocalPos()?.x < -9000);
        if (playerOneBallCount >= 5 || playerTwoBallCount >= 5)
            shouldGameEnd = true;
        return shouldGameEnd;
    }
    private OnSyncSettlement(syncSettlementData: SyncSettlementData)
    {
        if (this.subgame.gamingState == InterestingBilliardGamingState.CueSetting) return;
        if (this.ShouldGameEnd())
        {
            this.ForceGameEnd();
            return;
        }
        if (syncSettlementData.withCloseTip)
            EventManager.Emit("CloseTip");

        for (let index = 0; index < this.gameUIController.subBalls.Count; index++)
        {
            const subBall = this.gameUIController.subBalls.items[index];
            if (syncSettlementData.subBallPos.length != 0)
                subBall.node.setPosition(new Vec3(syncSettlementData.subBallPos[index].x, syncSettlementData.subBallPos[index].y));
        }
        this.gameUIController.mainBall.node.setPosition(syncSettlementData.mainBallPos);
        this.subgame.tempData.gamingPlayerId = syncSettlementData.gamingPlayerId;
        //同步游戏状态
        if (Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId))
        {
            if (this.countDownTimerId == 0)
                NetAPITools.NetStartDown(this.subgameId, this.MAXTIMER);
            //显示一个轮到击球提示
            this.gameUIController.ShowSelfRoundTip(true, 1.2);
        } else
            EventManager.Emit(CommonEventType.ShowPlayerMessage, this.subgame.tempData.gamingPlayerId, this.subgame.partialPlayerList.Find(pp => pp.id == this.subgame.tempData.gamingPlayerId)?.acountName, this.subgame.partialPlayerList.Find(pp => pp.id == this.subgame.tempData.gamingPlayerId)?.avatarUrl, "轮到玩家", "击球");
        this.UpdateRoundData(Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId));
    }
    //更新回合数据
    private UpdateRoundData(selfNextRound: boolean)
    {
        EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.ClockEnd);
        if (selfNextRound)
        {
            this.subgame.gamingState = InterestingBilliardGamingState.CueSetting;
            this.gameUIController.SetLineNodeEnable(true);
            this.gameUIController.cueNode.RoundStart();
        } else
        {
            this.gameUIController.cueNode.SetActive(false);
            this.gameUIController.SetLineNodeEnable(false);
        }
        this.subgame.curRoundFallBalls.Clear();
        this.subgame.touchStarted = false;
        this.subgame.touchTimer = 0;


        //给球设置头像和UI
        this.gameUIController.boardClock.SetClockState(true, this.subgame.maxCueSettingTime);
        this.gameUIController.SetGamingPlayerInfo(this.subgame.partialPlayerList.FindAll(pp => (this.subgame.tempData.gamingPlayerIds.find(id => id == pp.id) != undefined)), this.subgame.tempData.gamingPlayerId);
        this.gameUIController.gamingPlayerTip.active = true;
    }

    protected SubgameOnGameEnd(context: GameEndContext): void
    {
        if (Validator.IsObjectIllegal(context, "GameEndContext")) return;
        if (this.subgame.id != context.gameId) return;
        if (this.subgame.state != SubgameState.Gaming)
        {
            Debug.Warn("游戏结束前，游戏不在进行中");
            this.ClearGameData();
            return;
        }
        this.subgame.state = SubgameState.End;
        this.GameEnd();
        this.ClientOnGameEnd();
        context.StageComplete();
    }

    private ForceGameEnd()
    {
        //结束倒计时
        NetAPITools.NetStopDown(this.subgameId, this.countDownTimerId);
        NetAPITools.NetEndGame(this.subgameId);
    }

    private GameEnd()
    {
        EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.ClockEnd);
        var endData: IntBilEndData = {
            gameresult: [],
            showPunish: true,
            victoryName: ""
        };
        var playersClone = this.subgame.gamingPlayerList.items;
        playersClone.sort((a, b) => b.score - a.score);
        for (let index = 0; index < playersClone.length; index++)
        {
            const player = playersClone[index];
            endData.gameresult.push({
                id: player.id,
                sort: index,
                sign: "进球" + player.score + "个",
                acountName: player.acountName,
                avatarUrl: player.avatarUrl
            });
            if (player.id == this.subgame.tempData.gamingPlayerId)
                endData.victoryName = player.acountName;
        }

        if (this.subgame.gamingPlayerList.Count == 2)
        {
            if (playersClone[0].score == playersClone[1].score)
                endData.showPunish = false;
        }
        EventManager.Emit("IntBilEndPipeline", this.subgameId, endData);
    }

    //处理游戏结算状态，同步所有客户端
    private IntBilSyncTouchPos(data: SyncTouchPosData)
    {
        //同步其他玩家的数据
        if (this.subgame.state != SubgameState.Gaming) return;
        this.gameUIController.ShowCueSetting(data.touchPos, false);
        this.subgame.touchTimer = 0;
        this.subgame.touchStarted = true;
    }

    //从其他客户端同步touchend
    private IntBilSyncTouchEnd(data: SyncTouchEndData)
    {
        this.subgame.touchStarted = false;
        this.gameUIController.StartPushCue(this.subgameId, false, data.mainBallForce);
        EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.CuePush);
    }

    protected CreateModel(): void
    {
        this.subgame = new FingerMarbleGame();
    }

    protected update(dt: number): void
    {
        if (this.subgame.gamingState == InterestingBilliardGamingState.BallEnd) return;
        if (this.subgame.state != SubgameState.Gaming) return;
        if (this.subgame.tempData.gamingPlayerId == "0") return;
        if (!Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId)) return;
        //更新游戏状态
        if (this.subgame.touchStarted)
        {
            this.subgame.touchTimer += dt;
            this.moveTimeCounter += dt * 1.1;
        }
        //结算判断
        if (this.subgame.gamingState != InterestingBilliardGamingState.BallRunning) return;
        //子球状态
        if (!this.gameUIController.mainBall.IsStatic()) return;
        for (let index = 0; index < this.gameUIController.subBalls.Count; index++)
            if (!this.gameUIController.subBalls.items[index].IsStatic()) return;

        //处理结算
        this.subgame.gamingState = InterestingBilliardGamingState.BallEnd;
        NetAPITools.NetStopDown(this.subgameId, this.countDownTimerId);
        this.DealWithSettlement();
    }

    //根据落球情况处理成不同的结算类型SettlementType
    private DealWithSettlement(): void
    {
        //保存当前数据，给重连玩家
        this.IntBilSetTempDataBallPos();

        if (this.subgame.curRoundFallBalls.Count == 0)
            this.SettlementByState(SettlementType.NoBallFall);
        else if (this.subgame.curRoundFallBalls.Count == 1)
        {
            var fallBall = this.subgame.curRoundFallBalls.items[0];
            if (this.subgame.tempData.gamingPlayerId == "0") { Debug.Log("DealWithSettlement gamingPlayer undefined"); return; }
            if (fallBall.isMainBall || fallBall.playerId == this.subgame.tempData.gamingPlayerId)
            {
                //玩家进了主球
                this.SettlementByState(SettlementType.MainBallFall);
            } else if (fallBall.playerId != this.subgame.tempData.gamingPlayerId && fallBall.isMainBall == false)
            {
                EventManager.Emit("InterestingBilliardAudioPlay", BilliardAudioState.Applaud);
                //击进了别人的球
                this.SettlementByState(SettlementType.OtherSubBallFall)
            }
        } else
        {
            var existOtherSubBall = false;
            var otherSubBallPlayerIds: string[] = [];
            this.gameUIController.subBalls.items.forEach(subBall =>
            {
                if (subBall.playerId !== this.subgame.tempData.gamingPlayerId)
                {
                    if (this.subgame.curRoundFallBalls.Exists(fallBall => fallBall.playerId == subBall.playerId))
                    {
                        otherSubBallPlayerIds.push(subBall.playerId);
                        existOtherSubBall = true;
                    }
                }
            })
            if (this.subgame.curRoundFallBalls.Exists(fallBall => fallBall.isMainBall) || this.subgame.curRoundFallBalls.Exists(fallBall => fallBall.playerId == this.subgame.tempData.gamingPlayerId))
            {
                this.SettlementByState(SettlementType.MainBallFall);
            }
        }
    }

    //从不同的结算类型完成结算
    private SettlementByState(state: SettlementType)
    {
        var fallBallPlayerIds = [];
        this.subgame.curRoundFallBalls.items.forEach(fallBall =>
        {
            fallBallPlayerIds.push(fallBall.playerId);
        });
        switch (state)
        {
            case SettlementType.NoBallFall://没有球进洞结算处理
                var nextPlayerId: string = this.GetNextPlayerId(Tools.GetClientPlayerId());
                EventManager.Emit(CommonEventType.ShowTipWithArgs, "您没有进球", false, "IntBilCloseConfirmTip", { nextPlayerId: nextPlayerId, confirmType: SettlementConfirmType.OnConfirmNoBallFall });
                var syncSettlementTipData: SyncSettlementTipData = {
                    settlementTip: SettlementTipType.NoBallFall,
                    fallPlayerIds: [],
                    nextPlayerId: nextPlayerId
                };
                NetAPITools.SendNotice(this.subgameId, InterestingBilliardSyncEvent.SyncSettlementTip, syncSettlementTipData, NoticeType.Others);
                break;

            case SettlementType.MainBallFall://主球进洞结算处理
                //是自己罚酒
                var nextPlayerId: string = this.GetNextPlayerId(Tools.GetClientPlayerId());
                EventManager.Emit(IntBilEvents.ShowIntBilFailedDlg, this.subgame.partialPlayerList.Find(pp => Tools.IsClientPlayer(pp.id)), "主球进洞", "IntBilCloseConfirmTip", { nextPlayerId: nextPlayerId, confirmType: SettlementConfirmType.OnConfirmSelfMainBallFall })
                var syncSettlementTipData: SyncSettlementTipData = {
                    settlementTip: SettlementTipType.OtherMainBallFall,
                    fallPlayerIds: [],
                    nextPlayerId: nextPlayerId
                };
                NetAPITools.SendNotice(this.subgameId, InterestingBilliardSyncEvent.SyncSettlementTip, syncSettlementTipData, NoticeType.Others);

                break;
            case SettlementType.OtherSubBallFall://进了别人头像的球
                var nextPlayerId: string = Tools.GetClientPlayerId();
                var fallBall = this.subgame.curRoundFallBalls.items[0];
                var fallBallPlayer = this.subgame.partialPlayerList.Find(pc => pc.id == fallBall.playerId);
                EventManager.Emit(CommonEventType.ShowTipDuration, fallBallPlayer?.acountName + SettlementTipEnum.OtherBallFall, true);
                var syncSettlementTipData: SyncSettlementTipData = {
                    settlementTip: SettlementTipType.SelfSubBallFall,
                    fallPlayerIds: [fallBallPlayer.id],
                    nextPlayerId: nextPlayerId
                };
                NetAPITools.SendNotice(this.subgameId, InterestingBilliardSyncEvent.SyncSettlementTip, syncSettlementTipData, NoticeType.Others);

                break;
            default:
                break;
        }
    }


    protected SubgameOnGaming(context: PipelineContext & IGameId & IIsClientPlayerGaming): void
    {
        if (Validator.IsObjectIllegal(context, "SelfGamingContext")) return;
        if (this.subgame.id != context.gameId) return;
        if (this.IsAlreadyGaming()) return;
        this.subgame.state = SubgameState.Gaming;
        //默认房主是第一回合玩家
        this.gameUIController.gamingPlayerTip.active = true;
        this.subgame.tempData.gamingPlayerId = this.roomController.room.hostId;
        this.subgame.tempData.gaming = true;
        EventManager.Emit("IntBilGamingPipeline", this.subgameId);
        if (context.isClientPlayerGaming)
            this.ClientOnGaming();
        this.gameUIController.SetGamingPlayerInfo(this.subgame.partialPlayerList.FindAll(pp => pp.state == PlayerState.Gaming), this.subgame.tempData.gamingPlayerId);
        this.gameUIController.gamingPlayerTip.active = true;
        context.StageComplete();
    }
    protected ClientOnGaming(): void
    {
        this.gameUIController.ShowPlayerSeat(false);
        this.UpdateRoundData(Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId));
        //不显示所有玩家状态了
        this.gameUIController.subBalls.items.forEach(subBall =>
        {
            subBall.ResetLabel();
        });
    }

    private ClearGameData(): void
    {
        this.subgame.tempData.gamingPlayerId = this.roomController.room.hostId;
        this.subgame.tempData.gamingPlayerIds = [];
        this.subgame.state = SubgameState.Idle;
        this.subgame.gamingState = InterestingBilliardGamingState.Idle;
        this.subgame.touchStarted = false;
        this.subgame.touchTimer = 0;
        this.subgame.curRoundFallBalls.Clear();
        this.subgame.gamingPlayerList.Clear();
    }

    protected ClientOnGameEnd(): void
    {
        //游戏回合结束
        this.ClearGameData();
        this.gameUIController.ResetAllBalls();
        this.gameUIController.ShowSelfRoundTip(false);
        this.gameUIController.gamingPlayerTip.active = false;
        this.gameUIController.boardClock.SetClockState(false);
        this.gameUIController.ShowPlayerSeat(true);
        this.gameUIController.cueNode.RoundStart();
        this.gameUIController.cueNode.SetActive(false);
        //设置所有玩家状态
        this.subgame.partialPlayerList.items.forEach(pp =>
        {
            pp.state = PlayerState.Idle;
        })
        this.gameUIController.UpdatePlayerBalls(this.subgame.partialPlayerList.items, this.subgame.hostId, true);
    }
    protected UpdatePlayerUIOnEnterRoom(context: UpdatePlayerUIContext): void
    {
        if (Validator.IsObjectIllegal(context, "UpdatePlayerUIContext")) return;
        if (this.subgameId != context.gameId) return;
        this.AddPlayer(this.subgame, context);
        if (this.subgame.state != SubgameState.Gaming)
            this.gameUIController.UpdateHorizPlayers(this.subgame.partialPlayerList.items, this.subgame.hostId);
        else
            this.gameUIController.UpdatePlayerSeats(this.subgame.partialPlayerList.FindAll(p => p.state == PlayerState.Gaming));
        context.StageComplete();
    }
    protected UpdatePlayerUIOnStayRoom(context: UpdatePlayerUIContext): void
    {
        if (Validator.IsObjectIllegal(context, "UpdatePlayerUIContext")) return;
        if (Validator.IsStringIllegal(context.playerId, "context.playerId")) return;
        if (this.subgame.id != context.gameId) return;
        var player = this.subgame.partialPlayerList.Find(p => p.id == context.playerId);
        if (!Validator.IsObjectEmpty(player))
            player.state = context.playerState;
        if (this.subgame.state != SubgameState.Gaming)
            this.gameUIController.UpdatePlayerGamingBalls(this.subgame.partialPlayerList.FindAll(pp => pp.id == this.subgame.hostId || pp.state == PlayerState.Ready), this.subgame.hostId, true);

        if (this.subgame.state != SubgameState.Gaming)
            this.gameUIController.UpdatePlayerSeats(this.subgame.partialPlayerList.items);
        context.StageComplete();
    }
    protected SubgameOnSelfEnterGame(context: OnSelfEnterRoomContext): void
    {
        super.SubgameOnSelfEnterGame(context);
        context.StageComplete();
    }

    protected SubgameOnSelfLeaveRoom(context: LeaveRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "LeaveRoomContext")) return;
        if (context.gameId != this.subgame.id) return;
        if (context.gamingPlayerCount == 0)
        {
            NetAPITools.NetStopDown(this.subgameId, this.countDownTimerId);
            NetAPITools.NetEndGame(this.subgameId);
        }
        context.StageComplete();
    }
    protected SubgameOnOtherLeaveRoom(context: LeaveRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "SubgameOnOtherLeaveRoom")) return;
        if (this.subgame.id != context.gameId) return;
        if (context.subgameState == SubgameState.Gaming)
        {
            //更新离开房间玩家的状态，用来判断玩家是否掉线
            var player = this.subgame.partialPlayerList.Find(pp => pp.id == context.playerId);
            if (!Validator.IsObjectEmpty(player))
                player.gameId = null;
            if (context.gamingPlayerCount != 0 && context.gamingPlayerCount < this.roomController.room.minPlayerCount)
            {
                if (this.subgame.partialPlayerList.Exists(pp => pp.state == PlayerState.Gaming && Tools.IsClientPlayer(pp.id)))
                {
                    // //如果本机玩家是正在游戏中的玩家，才提示是否结束游戏
                    // NetAPITools.NetStopDown(this.subgameId, this.countDownTimerId);
                    // EventManager.Emit(CommonEventType.ShowConfirm, "对方掉线，点击确定结束本轮游戏，点击取消等待对方回到游戏", "IntBilEndGameConfirm", "IntBilEndGameCancel");
                } else
                {
                    //是正在观战的玩家
                }
            }
        }
        context.StageComplete();
    }
    protected UpdatePlayerUIOnLeaveRoom(context: UpdatePlayerUIContext): void
    {
        if (Validator.IsObjectIllegal(context, "UpdatePlayerUIContext")) return;
        if (Validator.IsStringIllegal(context.playerId, "context.playerId")) return;
        if (this.subgame.id != context.gameId) return;
        if (this.subgame.state != SubgameState.Gaming)
        {
            this.RemovePlayer(this.subgame, context);
            this.gameUIController.UpdatePlayerGamingBalls(this.subgame.partialPlayerList.FindAll(pp => pp.id == this.subgame.hostId || pp.state == PlayerState.Ready), this.subgame.hostId, true);
        }
        if (this.subgame.state != SubgameState.Gaming)
            this.gameUIController.UpdatePlayerSeats(this.subgame.partialPlayerList.items);
        else
            this.gameUIController.UpdatePlayerSeats(this.subgame.partialPlayerList.FindAll(p => p.state == PlayerState.Gaming));
        context.StageComplete();
    }

    private GetNextPlayerId(playerId: string)
    {
        const arrLen = this.subgame.tempData.gamingPlayerIds.length;
        const curPlayerIdIndex = this.subgame.tempData.gamingPlayerIds.indexOf(playerId);
        var nextPlayerId: string = Tools.GetClientPlayerId();
        if (curPlayerIdIndex != -1)
            nextPlayerId = this.subgame.tempData.gamingPlayerIds[(this.subgame.tempData.gamingPlayerIds.indexOf(playerId) + 1) % arrLen];
        return nextPlayerId;
    }
    private IntBilGamingStateChange(gamingState: InterestingBilliardGamingState)
    {
        this.subgame.gamingState = gamingState;
    }


    private OnIntBilReadyButtonTouch(button: ReadyButton): void
    {
        if (Validator.IsObjectIllegal(button, "button")) return;
        if (!button.button.interactable) return;
        var gamingPlayerIds: string[] = [];
        for (let i = 0; i < this.subgame.partialPlayerList.items.length; i++)
        {
            const player = this.subgame.partialPlayerList.items[i];
            gamingPlayerIds.push(player.id);
        }
        this.subgame.curRoundPlayerIds = gamingPlayerIds;
        EventManager.Emit("IntBilStartPipeline", gamingPlayerIds);
    }
    protected SubgameOnHostUpdate(context: UpdateRoomHostContext): void
    {
        if (Validator.IsObjectIllegal(context, "UpdateRoomHostContext")) return;
        if (this.subgame.id != context.gameId) return;
        var isClientPlayerHost = context.clientPlayerId == context.hostId;
        this.subgame.isClientPlayerHost = isClientPlayerHost;
        this.subgame.hostId = context.hostId;
        if (this.subgame.state != SubgameState.Gaming)
            this.gameUIController.UpdatePlayerGamingBalls(this.subgame.partialPlayerList.FindAll(pp => pp.id == this.subgame.hostId || pp.state == PlayerState.Ready), this.subgame.hostId, true);
        context.StageComplete();
    }

    protected ClientOnGameReset(): void
    {
        this.ClientOnGameEnd();
        EventManager.Emit("ShowReadyButton", this.subgameId, true);
    }
    protected SubgameOnFinishEnterRoom(context: OnFinishEnterRoomContext): void
    {
        if (Validator.IsObjectIllegal(context, "SubgameOnFinishEnterRoom OnFinishEnterRoomContext")) return;
        if (context.gameId != this.subgameId) return;
        // if (this.subgame.state != SubgameState.Gaming)
        //     this.gameUIController.UpdatePlayerGamingBalls(this.subgame.partialPlayerList.FindAll(pp => pp.id == this.subgame.hostId || pp.state == PlayerState.Ready), this.subgame.hostId, true);
        this.subgame.tempData.gaming && this.gameUIController.UpdateBallPos(this.subgame.tempData.subBallPos, this.subgame.tempData.mainBallPos);
        if (this.subgame.tempData.gaming && Tools.IsClientPlayer(context.playerId))
        {
            if (this.subgame.tempData.gamingPlayerIds.find(id => id == context.playerId) != undefined)
            {
                EventManager.Emit("ShowReadyButton", this.subgameId, false);
                EventManager.Emit("SetPlayerState", Tools.GetClientPlayerId(), PlayerState.Gaming);
                this.subgame.state = SubgameState.Gaming;
                this.gameUIController.ShowPlayerSeat(false);
                //重连成功
                NetAPITools.SendNotice(this.subgameId, "IntBilPlayerReconnected", context.playerId, NoticeType.Others);
                if (this.subgame.tempData.gamingPlayerId == context.playerId)
                {
                    this.UpdateRoundData(Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId));
                    var player = this.subgame.partialPlayerList.Find(pp => pp.id == context.playerId);
                    if (!Validator.IsObjectEmpty(player))
                        player.state = PlayerState.Gaming;
                    this.gameUIController.UpdatePlayerGamingBalls(this.subgame.partialPlayerList.FindAll(p => p.state == PlayerState.Gaming), this.subgame.hostId, false);
                    //等待一秒
                    this.scheduleOnce(() =>
                    {
                        if (this.countDownTimerId == 0)
                            NetAPITools.NetStartDown(this.subgameId, this.MAXTIMER);
                    }, 1.1);
                    //显示一个轮到击球提示
                    this.gameUIController.ShowSelfRoundTip(true, 1.2);
                }
            }
        }
        if (this.subgame.state == SubgameState.Gaming)
        {
            this.gameUIController.UpdatePlayerGamingBalls(this.subgame.partialPlayerList.FindAll(pp => (this.subgame.tempData.gamingPlayerIds.find(id => id == pp.id) != undefined)), this.subgame.hostId, false);
        }
        context.StageComplete();
    }
    /**
     * 设置播放时间
     * @param time 服务器或者AudioController给的时间
     * @returns 
     */
    private IntBilSetAudioCurTime(time: number)
    {
        if (Validator.IsNumberIllegalNoStrict(time, "IntBilSetAudioCurTime")) return;
        this.subgame.audioCurTime = time;
        //房主同步到其他客户端  
        if (this.subgame.isClientPlayerHost)
            NetAPITools.SendNotice(this.subgameId, "IntBilSetAudioCurTime", this.subgame.audioCurTime, NoticeType.Others);
        else
        {
            Debug.Log("开始同步服务器的播放时间:" + time);
            EventManager.Emit("InterestingBilliardInnerAudioPlay", BilliardAudioState.StartBgm, this.subgame.audioCurTime + 0.06);
        }
    }

    protected ShowGameEndTip(context: GameEndContext): void
    {
        if (Validator.IsObjectIllegal(context, "GameEndContext")) return;
        context.showDefaultGameEndTip = false;
        context.StageComplete();
    }

    private IntBilUpdateUI(context: PipelineContext & IClonePlayers & ISubgameState & IGameId)
    {
        if (Validator.IsObjectIllegal(context, "IntBilUpdateUI context")) return;
        if (context.gameId != this.subgameId) return;
        if (context.subgameState == SubgameState.Gaming)
        {
            this.gameUIController.UpdatePlayerGamingBalls(this.subgame.partialPlayerList.FindAll(pp => pp.state == PlayerState.Gaming), this.subgame.hostId, false);
        }
        context.StageComplete();
    }

    private IntBilUpdatePartialPlayerList(context: PipelineContext & IClonePlayers & ISubgameState & IGameId)
    {
        if (Validator.IsObjectIllegal(context, "IntBilUpdatePartialPlayerList context")) return;
        if (context.gameId != this.subgameId) return;
        this.subgame.partialPlayerList = context.clonePlayers;
        if (context.subgameState == SubgameState.Gaming)
        {
            this.subgame.gamingPlayerList.Clear();
            context.clonePlayers.ForEach((pp =>
            {
                pp.state == PlayerState.Gaming && this.subgame.gamingPlayerList.items.push(JSON.parse(JSON.stringify(pp)));
            }));
        }
        context.StageComplete();
    }
    // private IntBilGamingSetCurRoundPlayerIds(context: IntBilGamingContext)
    // {
    //     if (Validator.IsObjectIllegal(context, "IntBilGamingSetCurRoundPlayerIds IntBilGamingContext")) return;
    //     this.subgame.tempData.gamingPlayerIds = [];
    //     context.clonePlayers.ForEach((cp) =>
    //     {
    //         cp.state == PlayerState.Gaming && this.subgame.tempData.gamingPlayerIds.push(cp.id);
    //     })
    //     NetAPITools.SetGameTempdata(this.subgameId, JSON.stringify(this.subgame.tempData));
    //     context.StageComplete();
    // }


    protected UpdateTempData(gameId: string, tempData: any, onEnterRoom: boolean): void
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return;
        if (Validator.IsObjectIllegal(tempData, "tempData")) return;
        if (this.subgame.id != gameId) return;
        this.subgame.tempData = tempData as IntBilTempData;
    }

    //同步击球结果到其他客户端
    private SyncPollStrikeRespDataToOther(nextPlayerId: string, withCloseTip: boolean, noticeType: NoticeType = NoticeType.All)
    {
        if (Validator.IsStringIllegal(nextPlayerId, "SyncPollStrikeRespDataToOther nextPlayerId")) return;
        this.IntBilSetTempDataBallPos();
        var syncSettlementData: SyncSettlementData = {
            gamingPlayerId: nextPlayerId,
            mainBallPos: this.subgame.tempData.mainBallPos,
            subBallPos: this.subgame.tempData.subBallPos,
            withCloseTip: withCloseTip,
        };

        //处理本地逻辑
        if (this.ShouldGameEnd())
            this.ForceGameEnd();
        else
        {
            this.subgame.tempData.gamingPlayerId = nextPlayerId;
            NetAPITools.SetGameTempdata(this.subgameId, JSON.stringify(this.subgame.tempData));
            if (this.subgame.partialPlayerList.Exists(pp => pp.id == this.subgame.tempData.gamingPlayerId && pp.gameId != this.subgameId))
            {
                //判断该玩家是否掉线
                // this.subgame.gamingState = InterestingBilliardGamingState.Waiting;
                Tools.IsClientPlayer(this.subgame.hostId) && EventManager.Emit(CommonEventType.ShowTipDuration, "对方掉线，等待对方重连中......点击确定结束本轮游戏", true, 1, "IntBilEndGameConfirm", 0.5);
            }
            this.UpdateRoundData(Tools.IsClientPlayer(this.subgame.tempData.gamingPlayerId))
        }
        NetAPITools.SendNotice(this.subgameId, InterestingBilliardSyncEvent.SyncSettlement, syncSettlementData, noticeType);
    }

    /**更新球得位置到临时数据 */
    private IntBilSetTempDataBallPos()
    {
        var subBallPos: Vec2[] = [];
        for (let index = 0; index < this.gameUIController.subBalls.Count; index++)
        {
            const subBall = this.gameUIController.subBalls.items[index];
            subBallPos.push(new Vec2(subBall.node.getPosition().x, subBall.node.getPosition().y));
        }
        this.subgame.tempData.mainBallPos = this.gameUIController.mainBall.node.getPosition();
        this.subgame.tempData.subBallPos = subBallPos;
    }
    private IntBilEndGameConfirm()
    {
        this.ForceGameEnd();
    }

    private IntBilPlayerReconnected(playerId: string)
    {
        if (Validator.IsStringIllegal(playerId, "IntBilPlayerReconnected playerId")) return;
        Debug.Log("玩家" + playerId + "重连成功");
        var player = this.subgame.partialPlayerList.Find(pp => pp.id == playerId);
        if (!Validator.IsObjectEmpty(player))
            player.gameId = this.subgameId;
        EventManager.Emit("SetPlayerState", playerId, PlayerState.Gaming);
        if (!Tools.IsClientPlayer(playerId))
        {
            EventManager.Emit(CommonEventType.ShowMessage, "玩家" + playerId + "重连成功", false);
            EventManager.Emit("CloseTip");
        }
    }
}
