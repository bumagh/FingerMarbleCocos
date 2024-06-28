import { CCBoolean, Label, SpriteFrame, UITransform, _decorator, Node, Vec3 } from 'cc';
import { PlayerState, Player } from '../../../Framework/PartyTemplate/Player/Player';
import { EventManager } from '../../../Libraries/Utility/EventManager';
import { Validator } from '../../../Libraries/Utility/Validator';
import { NodeReferences } from '../Common/NodeReferences';
import { FingerMarbleHorizPlayer } from './FingerMarbleHorizPlayer';
import { FingerMarbleScoreLabel } from './FingerMarbleScoreLabel';
import { Debug } from '../../../Libraries/Utility/Debug';

const { ccclass, property } = _decorator;

@ccclass('FingerMarbleTeamBoard')
export class FingerMarbleTeamBoard extends NodeReferences
{
    @property([FingerMarbleHorizPlayer])
    public horizPlayers: FingerMarbleHorizPlayer[] = [];
    @property(CCBoolean)
    public teamRed: boolean = true;
    @property(SpriteFrame)
    public emptyHead: SpriteFrame;

    protected onLoad(): void
    {
    }
    protected onEnable(): void
    {

    }
    protected start(): void
    {
    }

    public ResetByWidth(width: number)
    {
        this.node.getComponent<UITransform>(UITransform).width = (width - 100 - 200) / 2;
    }
    public ExistPlayerIdInPlayers(playerId: string)
    {
        return this.horizPlayers.find(p => p.playerId == playerId) != undefined;
    }

    public GetActivePlayerCount()
    {
        return this.horizPlayers.filter(hp => hp.playerId != null).length;
    }
    public ResetAll()
    {
        for (let index = 0; index < this.horizPlayers.length; index++)
        {
            const horizPlayer = this.horizPlayers[index];
            horizPlayer.SetActive(false);
        }
    }

    /**
     * 隐藏所有玩家的状态标签
     */
    public HideAllStateLabel()
    {
        for (let index = 0; index < this.horizPlayers.length; index++)
        {
            const horizPlayer = this.horizPlayers[index];
            horizPlayer.ChangePlayerState(0 as PlayerState, false);
        }
    }
    public ResetAllScore()
    {
        for (let index = 0; index < this.horizPlayers.length; index++)
        {
            const horizPlayer = this.horizPlayers[index];
            horizPlayer.score.InitScore();
        }
    }
    public ResetAllHorizPlayer()
    {
        for (let index = 0; index < this.horizPlayers.length; index++)
        {
            const horizPlayer = this.horizPlayers[index];
            horizPlayer.accountName.string = "";
            horizPlayer.playerId = null;
            horizPlayer.score.InitScore();
            horizPlayer.iconSprite.spriteFrame = this.emptyHead;
            horizPlayer.avatarUrl = null;
            horizPlayer.SetActive(false);
        }
    }

    public SetHorizPlayer(player: Player, seatIndex: number, isHost:boolean)
    {
        if (Validator.IsObjectIllegal(player, "TeamBoard SetHorizPlayer player")) return;
        var horizPlayer = this.horizPlayers[seatIndex];
        horizPlayer.accountName.string = player.acountName;
        horizPlayer.playerId = player.id;
        horizPlayer.avatarUrl = player.avatarUrl;
        horizPlayer.score.InitScore();
        horizPlayer.ChangePlayerState(player.state, isHost);
        // EventManager.Emit("SetRemoteSpriteFrame", "PlayerAvatar", player.id, horizPlayer.iconSprite, player.avatarUrl);
        horizPlayer.SetActive(true);
        Debug.Log("SetHorizPlayer after")
    }

}