import { _decorator, Component, Label, Sprite } from 'cc';
import { FingerMarbleScoreLabel } from './FingerMarbleScoreLabel';
import { PlayerState } from '../../../Framework/PartyTemplate/Player/Player';
import { NodeReferences } from '../Common/NodeReferences';
import { Debug } from '../../../Libraries/Utility/Debug';
const { ccclass, property } = _decorator;

@ccclass('FingerMarbleHorizPlayer')
export class FingerMarbleHorizPlayer extends NodeReferences
{
    public iconSprite: Sprite;
    public readySprite: Sprite;
    public accountName: Label;
    public score: FingerMarbleScoreLabel;
    public playerStateLabel: Label;
    public playerId: string = null;
    public avatarUrl: string = null;
    protected onLoad(): void
    {
        super.onLoad();
        this.iconSprite = this.GetVisual<Sprite>("Mask/HeadIcon",Sprite);
        this.readySprite = this.GetVisual<Sprite>("Mask/ReadySprite",Sprite);
        this.accountName = this.GetVisual<Label>("Name",Label);
        this.score = this.GetVisual<FingerMarbleScoreLabel>("ScoreSingle",FingerMarbleScoreLabel);
        this.playerStateLabel = this.GetVisual<Label>("Mask/PlayerStateLabel",Label);
    }
    public SetActive(active: boolean)
    {
        this.iconSprite.node.active = active;
        this.accountName.node.active = active;
        this.score.node.active = active;
        this.playerStateLabel.node.active = active;
        if (active == false)
            this.Reset();
    }

    public ChangePlayerState(playerState: PlayerState, isHost: boolean = false)
    {
        switch (playerState)
        {
            case PlayerState.Gaming:
                // this.playerStateLabel.string = "游戏中";
                break;
            case PlayerState.Idle:
                // this.playerStateLabel.string = isHost?"未开始":"未准备";
                break;
            case PlayerState.Ready:
                // this.playerStateLabel.string = "已准备";
                this.readySprite.node.active = true;
                break;
            default:
                this.playerStateLabel.string = "";
                this.readySprite.node.active = false;
                break;
        }
    }
    public Reset()
    {
        this.score.InitScore();
        // this.playerStateLabel.string = "未准备";
        this.playerStateLabel.string = "";
        this.readySprite.node.active = false;
        this.accountName.string = null;
        this.avatarUrl = null;
        this.playerId = null;
    }
}