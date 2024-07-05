import { _decorator, Component, SpriteFrame, Graphics, Label, Sprite, Vec3, Camera, EventTouch, game, Color, misc, Vec2, PhysicsSystem2D, ERaycast2DType, Node, Prefab, instantiate } from "cc";
import { PlayerState, Player } from "../../../Framework/PartyTemplate/Player/Player";
import { Algorithm } from "../../../Libraries/Utility/Algorithm";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { List } from "../../../Libraries/Utility/List";
import { Validator } from "../../../Libraries/Utility/Validator";
import { Gender, Team } from "../Common/Enums";
import { NodeReferences } from "../Common/NodeReferences";
import { ReadyButton } from "../Common/ReadyButton";
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
    @property(BoardClock)
    public boardClock: BoardClock;
    @property(SpriteFrame)
    public emptyHeadIcon: SpriteFrame;
    @property(FingerMarbleCue)
    public cueNode: FingerMarbleCue;//球杆
    @property(Graphics)
    public graphicsPanel: Graphics;
    @property([Node])
    public walls: Node[] = [];
    @property(Prefab)
    public marbleBall: Prefab;
    public readyButton: ReadyButton;
    public teamBoard: FingerMarbleTeamBoard;
    public mainBall: FingerMarbleBall;//主球
    public subBalls: List<FingerMarbleBall> = new List<FingerMarbleBall>;//子球
    public ballsParent: Node;
    private descriptionDlg: Node; //游戏说明
    public settingDlg: Node; //游戏设定

    public camera: Camera;
    protected onLoad(): void
    {
        this.GetAllPlaySeat();
        //界面ui
        this.teamBoard = this.canvasReferences.GetVisual("GameUI/PlayerBoard", FingerMarbleTeamBoard);
        this.readyButton = this.canvasReferences.GetVisual("ReadyButton", ReadyButton);
        this.ballsParent = this.canvasReferences.GetNode("ScreenTable/Balls");
        EventManager.On("ClearGraphics", this.ClearGraphics, this);
    }

    protected onDestroy(): void
    {
        EventManager.Off("ClearGraphics", this.ClearGraphics, this);
    }

    private ClearGraphics()
    {
        this.graphicsPanel.clear();
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
        if (this.subBalls.Count == 1)
            this.mainBall = this.subBalls.items[0];
    }
    public ShowSelfRoundTip(show: boolean, duration: number = 1)
    {
        if (show)
            EventManager.Emit("ShowSelfRoundDlg", duration);
        else
            EventManager.Emit("CloseSelfRoundDlg");

    }

    //辅助线
    public SetLineNodeEnable(enable: boolean)
    {
        this.graphicsPanel.clear();
    }



    public SetAllBallBigDamp()
    {
        this.scheduleOnce(() =>
        {
            this.subBalls.items.forEach(subBall =>
            {
                subBall.SetBigDamp();
            })
        }, 3);
    }
    //球杆推球
    public StartPushCue(isGamingPlayer: boolean,touchPos: Vec2, mainBallForce: Vec2 = new Vec2())
    {
        if (this.subBalls.Count == 1)
            this.mainBall = this.subBalls.items[0];
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
            var touchWorldSpacePos:Vec3 = this.camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
            //开始给球动力
            var baseForceY: number = (this.mainBall.node.worldPosition.y - touchWorldSpacePos.y);
            var baseForceX: number = (this.mainBall.node.worldPosition.x - touchWorldSpacePos.x);
            var SyncMainBallForce = new Vec2(baseForceX, baseForceY);
            // var SyncMainBallForce: Vec3 = touchWorldSpacePos.subtract(this.mainBall.node.worldPosition);
            this.scheduleOnce(() =>
            {
                this.SetAllBallBigDamp();
                this.mainBall.SetForce(new Vec2(SyncMainBallForce.x, SyncMainBallForce.y));
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
        this.UpdateSubBalls();

        this.SetLineNodeEnable(false);
        this.cueNode.node.active = true;
        this.cueNode.SetCueState(touchPos, this.subBalls.items[0].node.worldPosition, this.camera, this.subBalls.items[0].node.worldPosition);
        lineActive && this.cueNode.DrawCueLine(touchPos, this.subBalls.items[0].node.worldPosition, this.camera, this.graphicsPanel.node, this.graphicsPanel, this.subBalls);
    }


    public UpdatePlayerBalls(players: Player[], hostId: string, isClientIdle: boolean = false): void
    {
        if (Validator.IsObjectIllegal(players, "players")) return;
        this.UpdateSubBalls();
        for (let i = 0; i < players.length; i++)
        {
            if(this.subBalls.Find(item=>item.playerId == players[i].id) != undefined) continue;
            var newBall: Node = instantiate(this.marbleBall);
            this.ballsParent.addChild(newBall);
            var fingerMarbleBall = newBall.getComponent<FingerMarbleBall>(FingerMarbleBall);
            fingerMarbleBall.name = players[i].acountName;
            fingerMarbleBall.stateLabel.string = players[i].acountName;
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
        // this.ballsParent.removeAllChildren();
        this.subBalls.Clear();
        for (let index = 0; index < ballNodes.length; index++)
        {
            this.subBalls.Add(ballNodes[index].getComponent<FingerMarbleBall>(FingerMarbleBall));
        }
        this.mainBall = this.subBalls.items[0];
    }
}