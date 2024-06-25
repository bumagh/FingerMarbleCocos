import { Component, Vec3, _decorator } from "cc";

const { ccclass, property } = _decorator;

@ccclass("IntBilLight")
export class IntBilLight extends Component {
    public Follow(wpos:Vec3){
        this.node.setWorldPosition(wpos);
    }
}