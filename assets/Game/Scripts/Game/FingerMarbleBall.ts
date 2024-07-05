import { CCBoolean, CircleCollider2D, Collider2D, Color, Component, Label, Node, Quat, RigidBody2D, Sprite, UITransform, Vec2, Vec3, _decorator } from 'cc';
import { Gender } from '../Common/Enums';
import { PlayerState } from '../../../Framework/PartyTemplate/Player/Player';
import { Algorithm } from '../../../Libraries/Utility/Algorithm';
import { NodeReferences } from '../Common/NodeReferences';
const { ccclass, property } = _decorator;

@ccclass("FingerMarbleBall")
export class FingerMarbleBall extends NodeReferences
{
    @property(Sprite)
    public avatarSprite: Sprite;
    @property(CCBoolean)
    public isMainBall: boolean = false;
    @property(Node)
    public outLineMaskNode: Node;
    @property(Sprite)
    public avatarOutlineSprite: Sprite;
    @property(UITransform)
    public iconUITransform: UITransform;

    @property(Node)
    public lightNode: Node;
    public playerId: string = null;
    public gender: Gender = Gender.Male;
    public resetPos: Vec3 = new Vec3();
    public resetLocalPos: Vec3 = new Vec3();
    public multi: number = 4;
    private defaultLinearDamping: number = 0.4;
    private defaultFriction: number = 0.4;
    private defaultRestitution: number = 0.6;
    private defaultSpriteColor: Color;

    public stateLabel: Label;
    public isFall: boolean = false;
    protected onLoad(): void
    {
        this.stateLabel = this.GetVisual("Label",Label);
    }

    protected start(): void
    {
        this.resetPos = this.node.worldPosition.clone();
        this.resetLocalPos = this.node.getPosition().clone();
        if (this.playerId == null && this.isMainBall == false)
            this.outLineMaskNode.active = false;
        if (this.isMainBall) return;
        this.defaultSpriteColor = this.avatarSprite.color;
    }
    public SetBigDamp()
    {
        this.node.getComponent<RigidBody2D>(RigidBody2D).linearDamping = 5;
        this.node.getComponent<Collider2D>(Collider2D).friction = 2;
        this.node.getComponent<Collider2D>(Collider2D).restitution = 0.1;
    }
    protected lateUpdate(dt: number): void
    {
        if (!this.isMainBall)
        {
            this.lightNode.setWorldRotationFromEuler(0, 0, -this.node.getWorldPosition().z);
        }
    }
    protected update(dt: number): void
    {

        if (this.IsStatic())
        {
            this.ResetEnergy();
        }
    }
    public ResetPosition()
    {
        this.node.setWorldPosition(this.resetPos);
    }

    public ResetEnergy()
    {
        this.node.getComponent<RigidBody2D>(RigidBody2D).linearVelocity = new Vec2(0, 0);
        this.node.getComponent<RigidBody2D>(RigidBody2D).angularVelocity = 0;
    }
    public ResetRotation()
    {
        this.node.setRotationFromEuler(new Vec3());
    }
    public BallFall()
    {

    }
    //获得球名称号
    public getBallNameNo(): string
    {
        return this.node.name.substring(10, 12);
    }
    //设置推力
    public SetForce(force: Vec2)
    {
        this.node.getComponent<RigidBody2D>(RigidBody2D).applyLinearImpulseToCenter(new Vec2(force.x * this.multi, force.y * this.multi), true)
    }

    protected onDestroy(): void
    {
    }
    public IsStatic()
    {
        return this.node.getComponent<RigidBody2D>(RigidBody2D).linearVelocity.length() <= 2;
    }

    public ResetLinearDamping()
    {
        this.node.getComponent<RigidBody2D>(RigidBody2D).linearDamping = this.defaultLinearDamping;
        this.node.getComponent<Collider2D>(Collider2D).friction = this.defaultFriction;
        this.node.getComponent<Collider2D>(Collider2D).restitution = this.defaultRestitution;
    }
    public ResetLabel()
    {
        this.stateLabel.string = "";
    }
    public ChangePlayerState(playerState: PlayerState, isHost: boolean = false)
    {
        switch (playerState)
        {
            case PlayerState.Gaming:
                this.stateLabel.string = "游戏中";
                break;
            case PlayerState.Idle:
                this.stateLabel.string = isHost ? "未开始" : "未准备";
                break;
            case PlayerState.Ready:
                this.stateLabel.string = "已准备";
                break;
            default:
                this.ResetLabel();
                break;
        }
    }
    public SetOutLineColorByGender(gender: Gender)
    {
        this.gender = gender;
        if (gender == Gender.Female || gender == Gender.Male)
        {
            this.avatarOutlineSprite.color = gender == Gender.Male ? Color.BLUE : Color.RED;
            this.outLineMaskNode.active = true;
            this.avatarSprite.color = Color.WHITE;
        }
        else
        {
            //白色空头像的球
            this.outLineMaskNode.active = false;
            this.avatarOutlineSprite.color = Color.WHITE;
            this.avatarSprite.color = Color.RED;
        }
    }

    public GetLocalPos()
    {
        return this.node.position;
    }
    public GetBallRadius()
    {
        return this.getComponent<CircleCollider2D>(CircleCollider2D).radius;
    }
    public SetRandPos()
    {
        this.node.setPosition(new Vec3(-536+ Algorithm.GetRandomNumber(1000,0),1200-Algorithm.GetRandomNumber(2400,0),0))       
    }
}