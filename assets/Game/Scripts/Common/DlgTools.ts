import { Sprite, Label } from "cc";
import { Player } from "../../../Framework/PartyTemplate/Player/Player";
import { Debug } from "../../../Libraries/Utility/Debug";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { Validator } from "../../../Libraries/Utility/Validator";
import { NodeReferences } from "./NodeReferences";
import { Algorithm } from "../../../Libraries/Utility/Algorithm";
import { PipelineContext } from "../../../Libraries/Utility/PipelineContext";
import { IGameId, IHostId, IPlayerId, IReadyPlayerCount, ITotalPlayerCount } from "../../../Framework/PartyTemplate/Interfaces";
import { CommonEventType } from "./CommonEventType";
import { NetAPITools } from "./NetAPITools";
import { Tools } from "./Tools";

export class DlgTools
{
    /**
     * 显示通用样式的结算界面
     */
    public static ShowCommonEndDlg(players: Player[], playerAvatars: NodeReferences[], getFailedTip: (player: Player) => string): void
    {
        if (Validator.IsObjectIllegal(players, "players")) return;
        if (Validator.IsObjectIllegal(playerAvatars, "playerAvatars")) return;

        for (let i = 0; i < players.length; i++)
        {
            const player = players[i];
            if (i >= playerAvatars.length)
            {
                Debug.Error(`players的索引${i}超出playerAvatars的长度`);
                break;
            }
            var playerAvatar = playerAvatars[i];
            var iconSprite = playerAvatar.GetVisual<Sprite>("Mask/Icon", Sprite);
            var accountNameLabel = playerAvatar.GetVisual<Label>("AccountName", Label);
            var failedTipLabel = playerAvatar.GetVisual<Label>("FailedTip", Label);
            if (!Validator.IsObjectEmpty(iconSprite))
                EventManager.Emit("SetRemoteSpriteFrame", "PlayerAvatar", player.id, iconSprite, player.avatarUrl);
            if (!Validator.IsObjectEmpty(accountNameLabel))
                accountNameLabel.string = Algorithm.TruncateString(player.acountName);
            if (!Validator.IsObjectEmpty(failedTipLabel))
                failedTipLabel.string = getFailedTip(player);
            playerAvatar.node.active = true;
            player.sign = 0;
        }
    }

    /**
     * 显示未准备玩家数量的提示
     */
    public static ShowUnreadyCountTip(
        context: PipelineContext & IPlayerId & IGameId & IHostId & ITotalPlayerCount & IReadyPlayerCount): void
    {
        if (Validator.IsObjectIllegal(context, "ShowUnreadyCountTip context")) return;
        var delta = context.totalPlayerCount - context.readyPlayerCount;
        if (context.playerId == context.hostId && delta > 0)
        {
            var tip = `还有${delta}人未准备，是否开始游戏？`;
            var onConfirmEvent = "RequestAPI";
            var onConfirmArgs = [
                "/v1/gameprepare",
                {
                    clientid: Tools.GetClientId(),
                    roomid: Tools.GetArcadeId(),
                    gameid: context.gameId,
                    hostid: context.hostId
                }
            ];
            var onCancelEvent = "ShowReadyButton";
            var onCancelArgs = [context.gameId, true];
            EventManager.Emit(CommonEventType.ShowConfirm, tip, onConfirmEvent, onCancelEvent, onConfirmArgs, onCancelArgs);
        }
        else
            NetAPITools.Prepare(context.gameId, context.hostId);
    }
}