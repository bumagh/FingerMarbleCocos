import { Camera, Color, Component, ERaycast2DType, Graphics, Label, Node, PhysicsSystem2D, Sprite, SpriteFrame, Vec2, Vec3, _decorator, color, misc, tween } from 'cc';
import { Algorithm } from '../../../Libraries/Utility/Algorithm';
import { List } from '../../../Libraries/Utility/List';
import { FingerMarbleBall } from './FingerMarbleBall';
import { EventManager } from '../../../Libraries/Utility/EventManager';
import { Debug } from '../../../Libraries/Utility/Debug';

const { ccclass, property } = _decorator;

@ccclass("FingerMarbleCue")
export class FingerMarbleCue extends Component {
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
    public DrawLine(com: Graphics, start: Vec3, end: Vec3, isBallOverlap: boolean = false, ballRadius:number)
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
            this.DrawCircleInPoint(com, pos, ballRadius);
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
    public DrawDashBall(com: Graphics, start: Vec3, end: Vec3, ballRadius:number, subBalls:List<FingerMarbleBall>): boolean
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
            if (this.IsBallOverlap(new Vec2(pos.x, pos.y),ballRadius,subBalls))
            {
                this.DrawCircleInPoint(com, pos,ballRadius );
                isBallOverlap = true;
                break;
            }
            pos.add(increment);
        }
        return isBallOverlap;
    }    
    private IsBallOverlap(mainBallPos: Vec2, ballRadius:number, subBalls:List<FingerMarbleBall>)
    {
        var isOverlap: boolean = false;
        //获得所有的球的点和半径
        subBalls.ForEach(ball =>
        {
            const ballPoint: Vec3 = ball.GetLocalPos();
            const ballRadius: number = ball.GetBallRadius();
            if (Algorithm.IsCirclesOverlap([mainBallPos.x, mainBallPos.y], ballRadius, [ballPoint.x, ballPoint.y], ballRadius))
                isOverlap = true;
        });
        return isOverlap;
    }
    public DrawCircleInPoint(ctx: Graphics, point: Vec3, ballRadius:number)
    {
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
        // 绘制分割的虚线圆形
        for (let i = 0; i < 360; i += deltaAngle + spaceAngle)
        {
            const sRadian = misc.degreesToRadians(i);
            const eRadian = misc.degreesToRadians(i + deltaAngle);
            ctx.arc(center.x, center.y, ballRadius, sRadian, eRadian, true);
            ctx.stroke();
        }
    }

    public SetCueState(touchPos: Vec2, mainBallPos:Vec3,camera:Camera, mainBallWorldSpacePos:Vec3)
    {
        //设置坐标
        var touchWorldSpacePos:Vec3 = camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
        this.SetCuePos(mainBallPos, mainBallPos, touchWorldSpacePos);
        //换算成角度
        var angle: number = this.GetCueAngle(this.GetThetaFromMainBallToTouchPos(touchPos,camera,mainBallWorldSpacePos), mainBallWorldSpacePos, touchWorldSpacePos);
        this.SetRotationFromEuler(angle);
    }

    public GetThetaFromMainBallToTouchPos(touchPos: Vec2, camera:Camera, mainBallWorldSpacePos:Vec3)
    {
        var touchWorldSpacePos:Vec3 = camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
        var dy: number = Math.abs(mainBallWorldSpacePos.y - touchWorldSpacePos.y);
        var dx: number = Math.abs(mainBallWorldSpacePos.x - touchWorldSpacePos.x);
        return Math.atan2(dy, dx) * 180 / Math.PI;
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
  
  
    
    /**
     * 画出推杆预定球轨迹
     * @param touchPos 触点
     * @returns 
     */
    public DrawCueLine(touchPos: Vec2, mainBallWorldSpacePos:Vec3, camera:Camera, graphicsPanel:Node, ctx:Graphics,subBalls:List<FingerMarbleBall>)
    {
        var touchWorldSpacePos:Vec3 = camera.screenToWorld(new Vec3(touchPos.x, touchPos.y, 0));
        var lengthPos = this.GetPosFromLength(mainBallWorldSpacePos, mainBallWorldSpacePos, touchWorldSpacePos, 3000);
        var outPointMainBall:Vec3 = camera.convertToUINode(mainBallWorldSpacePos, graphicsPanel);
        var outLengthPos:Vec3 = camera.convertToUINode(lengthPos, graphicsPanel);
        const bResult = PhysicsSystem2D.instance.raycast(mainBallWorldSpacePos, lengthPos, ERaycast2DType.Closest);
        if (bResult)
        {
            for (let i = 0; i < bResult.length; i++)
            {
                const result = bResult[i];
                const collider = result.collider;

                if (collider.node.name.startsWith("MainBall-") || collider.node.name.startsWith("Wall") || collider.node.name.startsWith("Hollow"))
                {
                    EventManager.Emit("ClearGraphics");
                    var outPoint:Vec3 = camera.convertToUINode(new Vec3(result.point.x, result.point.y), graphicsPanel, outPoint);
                    var isBallOverlap: boolean = this.DrawDashBall(ctx, outPointMainBall, outPoint, subBalls.items[0].GetBallRadius(),subBalls);
                    var outPoint2:Vec3 =camera.convertToUINode(new Vec3(result.point.x, result.point.y), graphicsPanel, outPoint2);
                    this.DrawLine(ctx, outPointMainBall, outPoint2, isBallOverlap,subBalls.items[0].GetBallRadius());

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
}