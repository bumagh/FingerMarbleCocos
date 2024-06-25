import { _decorator, Label, Node, Sprite, SpriteFrame } from 'cc';
import { NodeReferences } from '../Common/NodeReferences';
import { PlayerState } from '../../../Framework/PartyTemplate/Player/Player';

const { ccclass, property } = _decorator;

@ccclass('IntBilPlayerSeat')
export class IntBilPlayerSeat extends NodeReferences
{
    @property(Sprite)
    public headIcon: Sprite;

    @property(Label)
    public accountNameLabel: Label;

    @property(Node)
    public readyIconNode: Node;

    @property(SpriteFrame)
    public defaultAvatar: SpriteFrame;

    public state: PlayerState = PlayerState.Idle;

}