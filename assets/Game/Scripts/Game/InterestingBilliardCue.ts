import { Color, Component, Graphics, Label, Sprite, SpriteFrame, Vec2, Vec3, _decorator, color, tween } from 'cc';

const { ccclass, property } = _decorator;

@ccclass("InterestingBilliardCue")
export class InterestingBilliardCue extends Component {
    @property(Sprite)
    public avatarSprite: Sprite;
    public resetPos: Vec3 = new Vec3();
    public resetRotation: number = 0;
    private tweenDuration: number = 0.1;
    protected onLoad(): void {
        this.resetPos = this.node.worldPosition.clone();
    }

    protected onDestroy(): void {
    }

    /**
     * 获得转换后的球杆角度
     * @param theta 主球和触摸点弧度
     * @param mainBallWorldSpacePos 主球世界坐标
     * @param touchWorldSpacePos 触摸点世界坐标
     * @returns 球杆的角度
     */
    public GetCueAngle(theta: number, mainBallWorldSpacePos: Vec3, touchWorldSpacePos: Vec3): number {
        var angle: number = 1;
        if (mainBallWorldSpacePos.x < touchWorldSpacePos.x && mainBallWorldSpacePos.y < touchWorldSpacePos.y)
            angle = theta;
        else if (mainBallWorldSpacePos.x > touchWorldSpacePos.x && mainBallWorldSpacePos.y < touchWorldSpacePos.y)
            angle = 180 - theta;
        else if (mainBallWorldSpacePos.x > touchWorldSpacePos.x && mainBallWorldSpacePos.y > touchWorldSpacePos.y)
            angle = theta + 180;
        else if (mainBallWorldSpacePos.x < touchWorldSpacePos.x && mainBallWorldSpacePos.y > touchWorldSpacePos.y)
            angle = 360 - theta;
        return angle;
    }
    /**
     * 获得转换后的球杆位置
     * @param srcPos 主球位置
     * @param mainBallWorldSpacePos 主球世界坐标
     * @param touchWorldSpacePos 触摸点世界坐标
     * @returns 球杆的位置
     */
    public GetCuePos(srcPos: Vec3, mainBallWorldSpacePos: Vec3, touchWorldSpacePos: Vec3): Vec3 {
        var dy: number = Math.abs(mainBallWorldSpacePos.y - touchWorldSpacePos.y);
        var dx: number = Math.abs(mainBallWorldSpacePos.x - touchWorldSpacePos.x);
        var gap: number = 2;
        if (dx > 100 || dy > 100)
            gap = 3;
        var newPos: Vec3 = Vec3.ZERO;
        if (mainBallWorldSpacePos.x < touchWorldSpacePos.x && mainBallWorldSpacePos.y < touchWorldSpacePos.y)
            newPos = new Vec3(srcPos.x + dx / gap, srcPos.y + dy / gap, 0);
        else if (mainBallWorldSpacePos.x > touchWorldSpacePos.x && mainBallWorldSpacePos.y < touchWorldSpacePos.y)
            newPos = new Vec3(srcPos.x - dx / gap, srcPos.y + dy / gap, 0);
        else if (mainBallWorldSpacePos.x > touchWorldSpacePos.x && mainBallWorldSpacePos.y > touchWorldSpacePos.y)
            newPos = new Vec3(srcPos.x - dx / gap, srcPos.y - dy / gap, 0);
        else if (mainBallWorldSpacePos.x < touchWorldSpacePos.x && mainBallWorldSpacePos.y > touchWorldSpacePos.y)
            newPos = new Vec3(srcPos.x + dx / gap, srcPos.y - dy / gap, 0);
        return newPos;
    }


    /**
     * 设置球杆位置
     * @param srcPos 
     * @param mainBallWorldSpacePos 
     * @param touchWorldSpacePos 
     */
    public SetCuePos(srcPos: Vec3, mainBallWorldSpacePos: Vec3, touchWorldSpacePos: Vec3) {
        this.node.setWorldPosition(this.GetCuePos(srcPos, mainBallWorldSpacePos, touchWorldSpacePos));
    }
    /**
     * 设置球杆角度
     * @param angle 
     */
    public SetRotationFromEuler(angle: number) {
        this.node.setRotationFromEuler(new Vec3(0, 0, angle + 225));
    }

    public RoundStart() {
        this.node.active = true;
        this.node.setWorldPosition(this.resetPos);
        this.node.setWorldRotationFromEuler(0, 0, 0);
    }
    public SetActive(active:boolean){
        this.node.active = active;
    }
    public PlayPushAnimation(mainBallWorldSpacePos: Vec3, endCallBack: Function) {
        var srcPos: Vec3 = this.node.worldPosition;
        tween(this.node.worldPosition)
            .to(this.tweenDuration, mainBallWorldSpacePos, {
                easing: "quadIn",
                onUpdate: (target: Vec3, ratio: number) => {
                    this.node.worldPosition = target;
                }
            }).to(this.tweenDuration, srcPos, {
                onUpdate: (target: Vec3, ratio: number) => {
                    this.node.worldPosition = target;
                },
                onComplete: () => {
                    this.node.active = false;
                    endCallBack();
                }
            })
            .start();
    }

}