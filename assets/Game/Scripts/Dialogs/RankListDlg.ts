import { _decorator, CCInteger, Component, Label, Node, Sprite, Tween, tween, Vec3 } from 'cc';
import { Validator } from '../../../Libraries/Utility/Validator';
import { NodeReferences } from '../Common/NodeReferences';
import { Tools } from '../Common/Tools';
import { EventManager } from '../../../Libraries/Utility/EventManager';
import { Debug } from '../../../Libraries/Utility/Debug';
import { TweenAnimator } from '../Common/TweenAnimator';
import { IGameId } from '../../../Framework/PartyTemplate/Interfaces';
import { Team } from '../Common/Enums';
const { ccclass, property } = _decorator;

export class Rank
{
    public playerId: string = null;
    public sign: string = "";              // 玩家标识（成绩）
    public rank: number = -1;              // 玩家排名
    public acountName: string;             // 账号昵称
    public avatarUrl: string;              // 头像url
}

@ccclass('RankListDlg')
export class RankListDlg extends Component implements IGameId
{
    @property(Node)
    private blockNode: Node;

    @property(Node)
    private viewNode: Node;

    @property(Node)
    private punishPlayerList: Node;

    @property(Node)
    private rankListContent: Node;

    @property(CCInteger)
    private punishPlayerCount: number;

    @property(Node)
    private punishTip: Node;

    @property(Node)
    private line: Node;
    public gameId: string = null;
    private showAnimation: Tween<Node>;
    private closeAnimation: Tween<Node>;
    private punishRefsArray: NodeReferences[] = [];
    private rankRefsArray: NodeReferences[] = [];

    private closeCallBackEventName: string = null;

    private signFontSize: number = 55;
    private showPunishList: boolean = true;
    protected onLoad(): void
    {
        this.GetAllPunishRefs();
        this.GetAllRankRefs();
    }

    private GetAllPunishRefs(): void
    {
        var punishPlayerNodes = this.punishPlayerList.children;
        for (let i = 0; i < punishPlayerNodes.length; i++)
        {
            const punishNode = punishPlayerNodes[i];
            var refs = punishNode.getComponent(NodeReferences);
            if (Validator.IsObjectIllegal(refs, "refs")) return;
            this.punishRefsArray.push(refs);
        }
    }

    private GetAllRankRefs(): void
    {
        var rankNodes = this.rankListContent.children;
        for (let i = 0; i < rankNodes.length; i++)
        {
            const rankNode = rankNodes[i];
            var refs = rankNode.getComponent(NodeReferences);
            if (Validator.IsObjectIllegal(refs, "refs")) return;
            this.rankRefsArray.push(refs);
        }
    }

    protected onEnable(): void
    {
        EventManager.On("SetRankListDlgGameId", this.SetRankListDlgGameId, this);
        EventManager.On("ShowRankListDlg", this.ShowRankListDlg, this);
        EventManager.On("OnRankListDlgPopOut", this.OnRankListDlgPopOut, this);
        EventManager.On("CloseRankListDlg", this.CloseRankListDlg, this);
    }

    protected onDisable(): void
    {
        EventManager.Off("SetRankListDlgGameId", this.SetRankListDlgGameId, this);
        EventManager.Off("ShowRankListDlg", this.ShowRankListDlg, this);
        EventManager.Off("OnRankListDlgPopOut", this.OnRankListDlgPopOut, this);
        EventManager.Off("CloseRankListDlg", this.CloseRankListDlg, this);
    }

    protected onDestroy(): void
    {
        if (!Validator.IsObjectEmpty(this.showAnimation))
        {
            this.showAnimation.stop();
            this.showAnimation = null;
        }
        if (!Validator.IsObjectEmpty(this.closeAnimation))
        {
            this.closeAnimation.stop();
            this.closeAnimation = null;
        }
    }

    private SetRankListDlgGameId(gameId: string): void
    {
        this.gameId = gameId;
    }

    /**
     * 
     * @param gameId 游戏id
     * @param ranks 排行数组
     * @param signFontSize 成绩文字大小默认55
     * @param showPunishList 是否显示惩罚 默认true
     * @param sortInc 是否递增排列 默认false
     * @returns 
     */
    private ShowRankListDlg(gameId: string, ranks: Rank[], signFontSize: number = 55, showPunishList: boolean = true, sortInc: boolean = false): void
    {
        if (this.IsGameIdIncorrect(gameId)) return;
        if (Validator.IsObjectIllegal(ranks, "ranks")) return;
        if (Tools.IsInArcadeScene()) return;
        this.signFontSize = signFontSize;
        this.showPunishList = showPunishList;
        Debug.Log("显示排行榜");
        this.blockNode.active = true;
        this.viewNode.active = true;
        if (sortInc)
        {
            ranks.sort((a, b) => a.rank - b.rank);
            for (let i = ranks.length - 1; i >= 0; i--)
            {
                if (i <= ranks.length - 1 - this.punishPlayerCount) break;
                // 成绩的索引超过惩罚玩家节点的数量
                if (i >= this.punishRefsArray.length) break;
                this.SetPunishRefs(i, ranks);
            }
        }
        else
        {
            ranks.sort((a, b) => b.rank - a.rank);
            for (let i = 0; i < ranks.length; i++)
            {
                if (i >= this.punishPlayerCount) break;
                // 成绩的索引超过惩罚玩家节点的数量
                if (i >= this.punishRefsArray.length) break;
                this.SetPunishRefs(i, ranks);
            }
        }


        for (let i = 0; i < ranks.length; i++)
        {
            // 成绩的索引超过排行节点的数量
            if (i >= this.rankRefsArray.length) break;
            this.SetRankRefs(i, ranks, sortInc);
        }
        if (!this.showPunishList)
        {
            this.line.active = false;
            this.punishPlayerList.active = false;
            this.punishTip.active = false;
        }
        this.PlayShowAnimation();
        EventManager.Emit("OnRankListDlgShowed");

    }

    private SetPunishRefs(index: number, ranks: Rank[]): void
    {
        var rank = ranks[index];
        var refs = this.punishRefsArray[index];
        // 设置头像、账号名称
        var avatarSprite = refs.GetVisual<Sprite>("Mask/Icon", Sprite);
        if (!Validator.IsObjectEmpty(avatarSprite))
            EventManager.Emit("SetRemoteSpriteFrame", "PlayerAvatar", rank.playerId, avatarSprite, rank.avatarUrl);
        var nameLabel = refs.GetVisual<Label>("AcountName", Label);
        if (!Validator.IsObjectEmpty(nameLabel))
            nameLabel.string = rank.acountName;
        refs.node.active = true;
    }

    private SetRankRefs(index: number, ranks: Rank[], sortInc: boolean = false): void
    {
        var rank = ranks[index];
        var refs = this.rankRefsArray[index];
        // 设置头像、账号名称、成绩
        var avatarSprite = refs.GetVisual<Sprite>("PlayerAvatar/Mask/Icon", Sprite);
        if (!Validator.IsObjectEmpty(avatarSprite))
            EventManager.Emit("SetRemoteSpriteFrame", "PlayerAvatar", rank.playerId, avatarSprite, rank.avatarUrl);
        var nameLabel = refs.GetVisual<Label>("PlayerAvatar/AcountName", Label);
        if (!Validator.IsObjectEmpty(nameLabel))
            nameLabel.string = rank.acountName;
        var signLabel = refs.GetVisual<Label>("Sign", Label);
        signLabel.fontSize = this.signFontSize;
        if (!Validator.IsObjectEmpty(signLabel))
            signLabel.string = rank.sign;
        var rankLabel = refs.GetVisual<Label>("Rank", Label);
        if (!Validator.IsObjectEmpty(rankLabel))
        {
            if (sortInc)
                rankLabel.string = (index + 1).toString();
            else
                rankLabel.string = (ranks.length - index).toString();
        }
        refs.node.active = true;
    }

    private PlayShowAnimation(): void
    {
        this.showAnimation = TweenAnimator.PlayPopInEffect(this.viewNode, 0.3, Vec3.ONE);
    }

    private CloseRankListDlg(): void
    {
        if (!Validator.IsObjectEmpty(this.showAnimation))
        {
            this.showAnimation.stop();
            this.showAnimation = null;
        }
        if (!Validator.IsObjectEmpty(this.closeAnimation)) return;
        EventManager.Emit("AudioUIClosed");

        this.closeAnimation = TweenAnimator
            .PlayPopOutEffect(this.viewNode, 0.3, new Vec3(0.5, 0.5, 1), "OnRankListDlgPopOut");
    }

    private OnRankListDlgPopOut(): void
    {
        this.blockNode.active = false;
        this.viewNode.active = false;
        this.punishRefsArray.forEach(refs => refs.node.active = false);
        this.rankRefsArray.forEach(refs => refs.node.active = false);
        this.closeAnimation = null;
        if (!Validator.IsStringEmpty(this.closeCallBackEventName))
            EventManager.Emit(this.closeCallBackEventName);
    }

    /**
     * gameId不正确
     */
    private IsGameIdIncorrect(gameId: string): boolean
    {
        if (Validator.IsStringIllegal(this.gameId, "this.gameId")) return true;
        if (Validator.IsStringIllegal(gameId, "gameId")) return true;
        return this.gameId != gameId;
    }
}