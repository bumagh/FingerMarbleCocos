import { _decorator, Component, SpriteFrame, Graphics, Label, Sprite, Vec3, Camera, EventTouch, game, Color, misc, Vec2, PhysicsSystem2D, ERaycast2DType, Node, Prefab, instantiate } from "cc";
import { PlayerState, Player } from "../../../Framework/PartyTemplate/Player/Player";
import { Algorithm } from "../../../Libraries/Utility/Algorithm";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { List } from "../../../Libraries/Utility/List";
import { Validator } from "../../../Libraries/Utility/Validator";
import { Gender, Team } from "../Common/Enums";
import { NodeReferences } from "../Common/NodeReferences";
import { ReadyButton } from "../Common/ReadyButton";
import { TouchEventProxy } from "../Common/TouchEventProxy";
import { FingerMarbleBall } from "./FingerMarbleBall";
import { InterestingBilliardGamingState, SyncTouchEndData, InterestingBilliardSyncEvent, NoticeType } from "./InterestingBilliardTypes";
import { BoardClock } from "../Common/BoardClock";
import { FingerMarbleCue } from "./FingerMarbleCue";
import { IntBilPlayerSeat } from "./IntBilPlayerSeat";
import { Debug } from "../../../Libraries/Utility/Debug";
import { FingerMarbleTeamBoard } from "./FingerMarbleBoard";

const { ccclass, property, executionOrder } = _decorator;

@ccclass('FingerMarbleUIController')
@executionOrder(-1)
export class FingerMarbleUIController extends Component
{

    private debugTag: string = "FingerMarbleUIController";
    @property(NodeReferences)
    public canvasReferences: NodeReferences;
    public readyButton: ReadyButton;
    @property(BoardClock)
    public boardClock: BoardClock;
    @property(SpriteFrame)
    public emptyHeadIcon: SpriteFrame;
    @property(FingerMarbleCue)
    public cueNode: FingerMarbleCue;//球杆
    public teamBoard: FingerMarbleTeamBoard;
    public mainBall: FingerMarbleBall;//主球
    public subBalls: List<FingerMarbleBall> = new List<FingerMarbleBall>;//子球
    public ballsParent: Node;
    @property(Graphics)
    public graphicsPanel: Graphics;
    @property([Node])
    public walls: Node[] = [];
    @property(Prefab)
    public marbleBall: Prefab;
    private descriptionDlg: Node; //游戏说明
    public settingDlg: Node; //游戏设定
    public mainBallWorldSpacePos = new Vec3(0, 0, 0);//主球世界坐标
    public touchWorldSpacePos = new Vec3(0, 0, 0);//触点世界坐标

    public camera: Camera;
    protected onLoad(): void
    {
        this.GetAllPlaySeat();
        //界面ui
        EventManager.On("onCloseDescriptionDlg", this.onCloseDescriptionDlg, this);
        EventManager.On("onOpenDescriptionDlg", this.onOpenDescriptionDlg, this);
        EventManager.On("onCloseSettingDlg", this.onCloseSettingDlg, this);
        EventManager.On("onOpenSettingDlg", this.onOpenSettingDlg, this);
        this.teamBoard = this.canvasReferences.GetVisual("GameUI/PlayerBoard", FingerMarbleTeamBoard);
        this.readyButton = this.canvasReferences.GetVisual("ReadyButton", ReadyButton);
        this.ballsParent = this.canvasReferences.GetNode("ScreenTable/Balls");
    }

    protected onDestroy(): void
    {
        EventManager.Off("onCloseDescriptionDlg", this.onCloseDescriptionDlg, this);
        EventManager.Off("onOpenDescriptionDlg", this.onOpenDescriptionDlg, this);
        EventManager.Off("onCloseSettingDlg", this.onCloseSettingDlg, this);
        EventManager.Off("onOpenSettingDlg", this.onOpenSettingDlg, this);
    }


    /**
    * 设置击球玩家的头像和账号
    */
    public SetGamingPlayerInfo(players: Player[], gamingPlayerId: string)
    {
        players.sort((a, b) => a.seatIndex - b.seatIndex);
        // for (let index = 0; index < players.length; index++)
        // {
        //     const player = players[index];
        //     if (index == 0)
        //     {
        //         this.gamingPlayerNameLabel.string = player.acountName;
        //         EventManager.Emit("SetRemoteSpriteFrame", "PlayerAvatar", player.id, this.gamingPlayerHeadIcon, player.avatarUrl);
        //         this.gamingIconGlow1.enabled = player.id == gamingPlayerId;
        //     } else
        //     {
        //         this.gamingPlayerNameLabel2.string = player.acountName;
        //         EventManager.Emit("SetRemoteSpriteFrame", "PlayerAvatar", player.id, this.gamingPlayerHeadIcon2, player.avatarUrl);
        //         this.gamingIconGlow2.enabled = player.id == gamingPlayerId;
        //     }
        // }

    }


    protected start(): void
    {
        Validator.IsObjectIllegal(this.canvasReferences, "canvasReferences");

        // this.descriptionDlg = this.canvasReferences.GetNode("GameDescriptionDlg");
        this.settingDlg = this.canvasReferences.GetNode("GameSettingDlg");
        // this.boardClock = this.canvasReferences.GetVisual<BoardClock>("BoardClock", BoardClock);
        this.camera = this.canvasReferences.GetVisual<Camera>("Camera", Camera);
        var ballNodes: Node[] = this.canvasReferences.GetNode("ScreenTable/Balls").children;
        for (let index = 0; index < ballNodes.length; index++)
        {
            this.subBalls.Add(ballNodes[index].getComponent<FingerMarbleBall>(FingerMarbleBall));
        }
        this.mainBall = this.subBalls.items[0];
        // this.disableAllSubBallLabel();

        // this.gamingPlayerTip.active = false;
    }
    public ShowSelfRoundTip(show: boolean, duration: number = 1)
    {
        if (show)
            EventManager.Emit("ShowSelfRoundDlg", duration);
        else
            EventManager.Emit("CloseSelfRoundDlg");

    }
    private onOpenDescriptionDlg(proxy: TouchEventProxy, event: EventTouch): void
    {
        this.descriptionDlg.active = true;
        EventManager.Emit("AudioUITouched");

    }
    private onCloseDescriptionDlg(proxy: TouchEventProxy, event: EventTouch): void
    {
        this.descriptionDlg.active = false;
        EventManager.Emit("AudioUIClosed");

    }
    private onOpenSettingDlg(proxy: TouchEventProxy, event: EventTouch): void
    {
        this.settingDlg.active = true;
        game.frameRate = 30;
        EventManager.Emit("AudioUITouched");

    }
    private onCloseSettingDlg(proxy: TouchEventProxy, event: EventTouch): void
    {
        this.settingDlg.active = false;
        EventManager.Emit("AudioUIClosed");

    }
    //辅助线
    public SetLineNodeEnable(enable: boolean)
    {
        this.graphicsPanel.clear();
    }

    //设置子球UI
    public setSubBallLabel(index: number, text: string)
    {
        this.subBalls.items[index].getComponentInChildren<Label>(Label).string = text;
    }
    public disableSubBallLabel(index: number)
    {
        this.subBalls.items[index].getComponentInChildren<Label>(Label).string = "";
    }

    public SetSubBallStateLabel(playerId: string, playerState: PlayerState, isHost: boolean = false)
    {
        if (Validator.IsStringIllegal(playerId, "playerId")) return;
        if (!this.subBalls.Exists(subBall => subBall.playerId == playerId)) return;
        this.subBalls.Find(subBall => subBall.playerId == playerId) != undefined && this.subBalls.Find(subBall => subBall.playerId == playerId)?.ChangePlayerState(playerState, isHost);
    }
    public disableAllSubBallLabel()
    {
        this.subBalls.items.forEach(subBall =>
        {
            subBall.getComponentInChildren<Label>(Label).string = "";
        });
    }
    public GetPosFromLength(srcPos: Vec3, mainBallWorldSpacePos: Vec3, touchWorldSpacePos: Vec3, length: number): Vec3
    {
        var dy: number = Math.abs(mainBallWorldSpacePos.y - touchWorldSpacePos.y);
        var dx: number = Math.abs(mainBallWorldSpacePos.x - touchWorldSpacePos.x);
        var dz: number = Math.sqrt(dx * dx + dy * dy);
        var length_scale: number = dz / length;
        if (length_scale == 0) return new Vec3();
        var newDy = dy * 1 / length_scale;
        var newDx = dx * 1 / length_scale;
        var newPos: Vec3 = Vec3.ZERO;
        if (mainBallWorldSpacePos.x < touchWorldSpacePos.x && mainBallWorldSpacePos.y < touchWorldSpacePos.y)
            newPos = new Vec3(srcPos.x - newDx, srcPos.y - newDy, 0);
        else if (mainBallWorldSpacePos.x > touchWorldSpacePos.x && mainBallWorldSpacePos.y < touchWorldSpacePos.y)
            newPos = new Vec3(srcPos.x + newDx, srcPos.y - newDy, 0);
        else if (mainBallWorldSpacePos.x > touchWorldSpacePos.x && mainBallWorldSpacePos.y > touchWorldSpacePos.y)
            newPos = new Vec3(srcPos.x + newDx, srcPos.y + newDy, 0);
        else if (mainBallWorldSpacePos.x < touchWorldSpacePos.x && mainBallWorldSpacePos.y > touchWorldSpacePos.y)
            newPos = new Vec3(srcPos.x - newDx, srcPos.y + newDy, 0);
        return newPos;
    }
    public DrawCircleInPoint(point: Vec3)
    {
        const ctx = this.graphicsPanel;
        if (!ctx)
        {
            return;
        }
        // 设置虚线的属性
        ctx.lineWidth = 5;
        ctx.strokeColor = Color.WHITE;

        const spaceAngle = 20; //虚线间隔
        const deltaAngle = 30;

        const center = point; //圆心
        const radius = this.mainBall.GetBallRadius();//圆半径
        // 绘制分割的虚线圆形
        for (let i = 0; i < 360; i += deltaAngle + spaceAngle)
        {
            const sRadian = misc.degreesToRadians(i);
            const eRadian = misc.degreesToRadians(i + deltaAngle);
            ctx.arc(center.x, center.y, radius, sRadian, eRadian, true);
            ctx.stroke();
        }
    }
    private IsBallOverlap(mainBallPos: Vec2)
    {
        var isOverlap: boolean = false;
        const mainBallRadius = this.mainBall.GetBallRadius();
        //获得所有的球的点和半径
        this.subBalls.ForEach(ball =>
        {
            const ballPoint: Vec3 = ball.GetLocalPos();
            const ballRadius: number = ball.GetBallRadius();
            if (Algorithm.IsCirclesOverlap([mainBallPos.x, mainBallPos.y], mainBallRadius, [ballPoint.x, ballPoint.y], ballRadius))
                isOverlap = true;
        });
        return isOverlap;
    }
    public DrawLine(com: Graphics, start: Vec3, end: Vec3, isBallOverlap: boolean = false)
    {
        var line = end.subtract(start)
        //获得这个向量的长度 
        var lineLength = line.length();
        //设置虚线中每条线段的长度 
        var length = 20;
        //根据每条线段的长度获得一个增量向量
        var increment = line.normalize().multiplyScalar(length);
        //确定现在是画线还是留空的
        var drawingLine = true;
        //临时变量 
        var pos = start.clone()
        com.strokeColor = Color.WHITE;
        // 只要线段长度还大于每条线段的长度 
        for (; lineLength > length; lineLength -= length)
        {
            //画线
            if (drawingLine)
            {
                com.moveTo(pos.x, pos.y)
                pos.add(increment);
                com.lineTo(pos.x, pos.y);
                com.stroke();
            } //留空 
            else
            {
                pos.add(increment);
            }
            //取反 
            drawingLine = !drawingLine
        }
        if (isBallOverlap == false)
            this.DrawCircleInPoint(pos);
    }
    public DrawSymmetricLine(com: Graphics, start: Vec3, end: Vec3, normal: Vec2)
    {
        var line = start.subtract(end)
        //获得这个向量的长度 
        var lineLength = line.length() / 2;
        //设置虚线中每条线段的长度 
        var length = 20;
        var unitLine = line.normalize();
        var calcLine = Algorithm.CalculateSymmetricVector([normal.x, normal.y, 0], [unitLine.x, unitLine.y, 0]);
        var symLine: Vec3 = new Vec3(calcLine[0], calcLine[1], calcLine[2]);
        //根据每条线段的长度获得一个增量向量
        var increment = symLine.normalize().multiplyScalar(length);
        //确定现在是画线还是留空的
        var drawingLine = true;
        //临时变量 
        var pos = end.clone()
        com.strokeColor = Color.GREEN;
        // 只要线段长度还大于每条线段的长度 
        for (; lineLength > length; lineLength -= length)
        {
            //画线
            if (drawingLine)
            {
                com.moveTo(pos.x, pos.y)
                pos.add(increment);
                com.lineTo(pos.x, pos.y);
                com.stroke();
            } //留空 
            else
            {
                pos.add(increment);
            }
            //取反 
            drawingLine = !drawingLine
        }
    }
    public DrawNormalLine(com: Graphics, start: Vec3, end: Vec3, normal: Vec2)
    {
        var line = start.subtract(end)
        //获得这个向量的长度 
        var lineLength = 100;
        //设置虚线中每条线段的长度 
        var length = 20;
        var unitLine = new Vec3(normal.x, normal.y);
        //根据每条线段的长度获得一个增量向量
        // var increment = line.normalize().multiplyScalar(length);
        var increment = unitLine.normalize().multiplyScalar(length);
        //确定现在是画线还是留空的
        var drawingLine = true;
        //临时变量 
        var pos = end.clone()
        com.strokeColor = Color.RED;
        // 只要线段长度还大于每条线段的长度 
        for (; lineLength > length; lineLength -= length)
        {
            //画线
            if (drawingLine)
            {
                com.moveTo(pos.x, pos.y)
                pos.add(increment);
                com.lineTo(pos.x, pos.y);
                com.stroke();
            } //留空 
            else
            {
                pos.add(increment);
            }
            //取反 
            drawingLine = !drawingLine
        }
    }
    public DrawDashBall(com: Graphics, start: Vec3, end: Vec3): boolean
    {
        var isBallOverlap: boolean = false;
        var line = end.subtract(start)
        //获得这个向量的长度 
        var lineLength = line.length();
        //根据每条线段的长度获得一个增量向量
        var length = 5;
        var increment = line.normalize().multiplyScalar(length);
        //临时变量 
        var pos = start.clone()
        com.strokeColor = Color.WHITE;
        //找到开始相交的点，并画圆
        for (; lineLength > length; lineLength -= length)
        {
            if (this.IsBallOverlap(new Vec2(pos.x, pos.y)))
            {
                this.DrawCircleInPoint(pos);
                isBallOverlap = true;
                break;
            }
            pos.add(increment);
        }
        return isBallOverlap;
    }
    /**
     * 画出推杆预定球轨迹
     * @param touchPos 触点
     * @returns 
     */
    public DrawCueLine(touchPos: Vec2)
    {
        this.mainBallWorldSpacePos = this.mainBall.node.worldPosition;
        this.camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0), this.touchWorldSpacePos);
        var lengthPos = this.GetPosFromLength(this.mainBallWorldSpacePos, this.mainBallWorldSpacePos, this.touchWorldSpacePos, 3000);
        var outPointMainBall = new Vec3();
        this.camera.convertToUINode(this.mainBallWorldSpacePos, this.graphicsPanel.node, outPointMainBall);
        var outLengthPos = new Vec3();
        this.camera.convertToUINode(lengthPos, this.graphicsPanel.node, outLengthPos);
        const bResult = PhysicsSystem2D.instance.raycast(this.mainBallWorldSpacePos, lengthPos, ERaycast2DType.Closest);
        if (bResult)
        {
            for (let i = 0; i < bResult.length; i++)
            {
                const result = bResult[i];
                const collider = result.collider;

                if (collider.node.name.startsWith("MainBall-") || collider.node.name.startsWith("Wall") || collider.node.name.startsWith("Hollow"))
                {
                    this.graphicsPanel.clear();
                    var outPoint = new Vec3();
                    this.camera.convertToUINode(new Vec3(result.point.x, result.point.y), this.graphicsPanel.node, outPoint);
                    var isBallOverlap: boolean = this.DrawDashBall(this.graphicsPanel, outPointMainBall, outPoint);
                    var outPoint2 = new Vec3();
                    this.camera.convertToUINode(new Vec3(result.point.x, result.point.y), this.graphicsPanel.node, outPoint2);
                    this.DrawLine(this.graphicsPanel, outPointMainBall, outPoint2, isBallOverlap);

                    // var outPoint3 = new Vec3();
                    // this.camera.convertToUINode(new Vec3(result.point.x, result.point.y), this.graphicsPanel.node, outPoint3);
                    // if (!isBallOverlap)
                    // this.DrawSymmetricLine(this.graphicsPanel, outPointMainBall, outPoint3, result.normal);

                    // var outPoint4 = new Vec3();
                    // this.camera.convertToUINode(new Vec3(result.point.x, result.point.y), this.graphicsPanel.node, outPoint4);
                    // this.DrawNormalLine(this.graphicsPanel, outPointMainBall, outPoint4, result.normal);
                }

            }
        }
    }
    /**
      * 设定球杆位置和角度
      * @param touchPos vec2 
      */
    public SetCueState(touchPos: Vec2)
    {
        //设置坐标
        this.cueNode.SetCuePos(this.mainBall.node.worldPosition, this.mainBall.node.worldPosition, this.touchWorldSpacePos);
        //换算成角度
        var angle: number = this.cueNode.GetCueAngle(this.GetThetaFromMainBallToTouchPos(touchPos), this.mainBallWorldSpacePos, this.touchWorldSpacePos);
        this.cueNode.SetRotationFromEuler(angle);
        //射线检测

    }
    public GetThetaFromMainBallToTouchPos(touchPos: Vec2)
    {
        this.mainBall.node.getWorldPosition(this.mainBallWorldSpacePos);
        this.camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0), this.touchWorldSpacePos);
        var dy: number = Math.abs(this.mainBallWorldSpacePos.y - this.touchWorldSpacePos.y);
        var dx: number = Math.abs(this.mainBallWorldSpacePos.x - this.touchWorldSpacePos.x);
        return Math.atan2(dy, dx) * 180 / Math.PI;
    }

    public SetAllBallBigDamp()
    {
        this.scheduleOnce(() =>
        {
            this.mainBall.SetBigDamp();
            this.subBalls.items.forEach(subBall =>
            {
                subBall.SetBigDamp();
            })
        }, 3);
    }
    //球杆推球
    public StartPushCue(subgameId: string, isGamingPlayer: boolean, mainBallForce: Vec2 = new Vec2())
    {

        this.subBalls.items.forEach(subBall =>
        {
            subBall.ResetLinearDamping();
        });
        if (!isGamingPlayer)
        {
            this.cueNode.PlayPushAnimation(this.mainBall.node.worldPosition, () =>
            {
                this.scheduleOnce(() =>
                {
                    this.SetAllBallBigDamp();
                    this.mainBall.SetForce(mainBallForce);
                });
            });
            return;
        }

        //推球动画,推完消失
        this.cueNode.PlayPushAnimation(this.mainBall.node.worldPosition, () =>
        {
            //开始给球动力
            var baseForceY: number = (this.mainBallWorldSpacePos.y - this.touchWorldSpacePos.y);
            var baseForceX: number = (this.mainBallWorldSpacePos.x - this.touchWorldSpacePos.x);
            var SyncMainBallForce = new Vec2(baseForceX, baseForceY);
            this.scheduleOnce(() =>
            {
                this.SetAllBallBigDamp();
                this.mainBall.SetForce(SyncMainBallForce);
                EventManager.Emit("IntBilGamingStateChange", InterestingBilliardGamingState.BallRunning);
                this.SetLineNodeEnable(false);
                this.cueNode.node.active = false;
            }, 0.1);
            // var syncTouchEndData: SyncTouchEndData = {
            //     mainBallForce: SyncMainBallForce
            // };
            // NetAPITools.SendNotice(subgameId, InterestingBilliardSyncEvent.IntBilSyncTouchEnd, syncTouchEndData, NoticeType.Others);
        });
    }

    /**
     * 显示球杆和辅助线
     * @param touchPos 
     */
    public ShowCueSetting(touchPos: Vec2, lineActive: boolean = true)
    {
        this.SetLineNodeEnable(false);
        this.cueNode.node.active = true;
        this.SetCueState(touchPos);
        lineActive && this.DrawCueLine(touchPos);
    }

    
    public UpdatePlayerBalls(players: Player[], hostId: string, isClientIdle: boolean = false): void
    {
        if (Validator.IsObjectIllegal(players, "players")) return;
        this.UpdateSubBalls();

        for (let i = 0; i < players.length; i++)
        {
            if (this.subBalls.items[i].playerId == players[i].id) continue;
            var newBall: Node = instantiate(this.marbleBall);
            this.ballsParent.addChild(newBall);
            var fingerMarbleBall = newBall.getComponent<FingerMarbleBall>(FingerMarbleBall);
            fingerMarbleBall.name = players[i].acountName;
            fingerMarbleBall.playerId = players[i].id;
            fingerMarbleBall.SetRandPos();
        }
    }

    private ResetPlayerSeat(playerUI: FingerMarbleBall): void
    {
        if (Validator.IsObjectIllegal(playerUI, "playerUI")) return;
        playerUI.avatarSprite.spriteFrame = this.emptyHeadIcon;
        playerUI.stateLabel.string = "";
        playerUI.playerId = null;
        playerUI.isMainBall = false;
        playerUI.SetOutLineColorByGender(Gender.UnKnown);
        playerUI.ChangePlayerState(0 as PlayerState, false);
    }

    private UpdateSubBallPos(subBallPos: Vec2[])
    {
        for (let index = 0; index < this.subBalls.Count; index++)
        {
            const subBall = this.subBalls.items[index];
            subBall.node.setPosition(new Vec3(subBallPos[index].x, subBallPos[index].y));
        }
    }
    private UpdateMainBallPos(mainBallPos: Vec3)
    {
        this.mainBall.node.setPosition(mainBallPos);
    }

    public UpdateBallPos(subBallPos: Vec2[], mainBallPos: Vec3)
    {
        if (subBallPos.length == 0) return;
        this.UpdateSubBallPos(subBallPos);
        this.UpdateMainBallPos(mainBallPos);
    }

    /**
 * 更新传入玩家的单元格
 */
    public UpdatePlayerSeats(players: Player[]): void
    {
        if (Validator.IsObjectIllegal(players, "players")) return;
        // players.sort((a, b) => a.seatIndex - b.seatIndex);
        // // 重置所有单元格
        // for (let i = 0; i < this.currentPlayerSeatList.items.length; i++)
        // {
        //     const playerUI = this.currentPlayerSeatList.items[i];
        //     if (Validator.IsStringEmpty(playerUI.id)) continue;
        //     this.ResetSeat(playerUI);
        // }
        // // 重新设置所有单元格
        // for (let i = 0; i < players.length; i++)
        // {
        //     if (Validator.IsArrayOutOfIndex(this.currentPlayerSeatList.items, i)) break;
        //     const player = players[i];
        //     const playerUI = this.currentPlayerSeatList.items[i];
        //     this.SetPlayerSeat(playerUI, player);
        // }
    }
    private SetPlayerSeat(playerUI: IntBilPlayerSeat, player: Player): void
    {
        if (Validator.IsObjectIllegal(playerUI, "playerUI")) return;
        if (Validator.IsObjectIllegal(player, "player")) return;
        playerUI.accountNameLabel.string = player.acountName;
        playerUI.accountNameLabel.node.parent.active = true;
        playerUI.readyIconNode.active = player.state == PlayerState.Ready;
        playerUI.id = player.id;
        playerUI.state = player.state;
        EventManager.Emit("SetRemoteSpriteFrame", "PlayerAvatar", playerUI.id, playerUI.headIcon, player.avatarUrl);
        playerUI.node.active = true;
    }
    private GetAllPlaySeat(): void
    {
        // var layouts = this.playerAvatarGridNode.children;
        // for (let i = 0; i < layouts.length; i++)
        // {
        //     const layout = layouts[i];
        //     for (let i = 0; i < layout.children.length; i++)
        //     {
        //         const node = layout.children[i];
        //         this.currentPlayerSeatList.Add(node.getComponent(IntBilPlayerSeat));
        //     }
        // }
    }
    private ResetSeat(playerUI: IntBilPlayerSeat): void
    {
        if (Validator.IsObjectIllegal(playerUI, "playerUI")) return;
        playerUI.headIcon.spriteFrame = playerUI.defaultAvatar;
        playerUI.accountNameLabel.string = "";
        playerUI.accountNameLabel.node.parent.active = false;
        playerUI.id = null;
        playerUI.state = PlayerState.Idle;
        playerUI.node.active = false;
    }
    public SetTeamBoardPlayer(player: Player, seatIndex: number, isHost: boolean)
    {
        if (Validator.IsObjectEmpty(player)) return;
        this.teamBoard.SetHorizPlayer(player, seatIndex, isHost);
    }

    public ResetTeamBoard(playerId: string): void
    {
        this.teamBoard.ExistPlayerIdInPlayers(playerId) && this.teamBoard.ResetAllHorizPlayer();
    }
    public ResetTeamBoardScore()
    {
        this.teamBoard.ResetAllScore();
    }
    public ResetAllTeamBoard()
    {
        this.teamBoard.ResetAll();
    }

    public HideAllStateLabel()
    {
        this.teamBoard.HideAllStateLabel();
    }
    public ResetAllHorizPlayers()
    {
        this.teamBoard.ResetAllHorizPlayer();
    }
    /**
     * 更新面板玩家UI
     * @param players 
     * @param hostId 
     * @returns 
     */
    public UpdateHorizPlayers(players: Player[], hostId: string)
    {
        if (Validator.IsObjectIllegal(players, "players")) return;
        // players.sort((a, b) => a.seatIndex - b.seatIndex);
        this.ResetAllHorizPlayers();
        for (let index = 0; index < players.length; index++)
        {
            const player = players[index];
            if (Validator.IsStringEmpty(player.id)) continue;
            this.SetTeamBoardPlayer(player, index, player.id == hostId);
        }
        this.UpdatePlayerBalls(players, hostId);
    }
    public SetHorizPlayerScore(playerId: string, team: Team, score: number)
    {
        var horizPlayer = this.teamBoard.horizPlayers.find(hp => hp.playerId == playerId);
        if (horizPlayer != undefined)
        {
            horizPlayer?.score.AddScore(score);
        }
    }

    public SetHorizPlayerStateLabel(playerId: string, playerState: PlayerState, isHost: boolean)
    {
        this.teamBoard.horizPlayers.find(hp => hp.playerId == playerId) != undefined && this.teamBoard.horizPlayers.find(hp => hp.playerId == playerId).ChangePlayerState(playerState, isHost);
    }

    public UpdateSubBalls()
    {
        var ballNodes: Node[] = this.canvasReferences.GetNode("ScreenTable/Balls").children;
        this.subBalls.Clear();
        for (let index = 0; index < ballNodes.length; index++)
        {
            this.subBalls.Add(ballNodes[index].getComponent<FingerMarbleBall>(FingerMarbleBall));
        }
        this.mainBall = this.subBalls.items[0];
    }
}