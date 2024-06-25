import { Rank } from "../../Game/Scripts/Dialogs/RankListDlg";
import { List } from "../../Libraries/Utility/List";
import { PipelineContext } from "../../Libraries/Utility/PipelineContext";
import { Player, PlayerState } from "./Player/Player";
import { SubgameState } from "./Subgame/Subgame";

//#region PipelineContext 管线上下文对象的接口

export interface IPlayerId
{
    playerId: string;
}

export interface IClientPlayerId
{
    clientPlayerId: string;
}

export interface IGameId
{
    gameId: string;
}

export interface IHostId
{
    hostId: string;
}

export interface ITotalPlayerCount
{
    totalPlayerCount: number;
}

export interface IReadyPlayerCount
{
    readyPlayerCount: number;
}

export interface IGamingPlayerCount
{
    gamingPlayerCount: number;
}

export interface IPlayerState
{
    playerState: PlayerState;
}

export interface IClonePlayers
{
    clonePlayers: List<Player>;
}

export interface IPlayerIdList
{
    playerIdList: List<string>;
}

export interface IIsClientPlayerGaming
{
    isClientPlayerGaming: boolean;
}

export interface ISubgameState
{
    subgameState: SubgameState;
}

export interface IEventArgs
{
    eventArgs: any;
}

export interface INextPipeline
{
    nextPipeline: string;
}

export interface IRankArray
{
    rankArray: Rank[];
}

/**
 * 是否在大厅场景中
 */
export interface IIsInArcade
{
    isInArcade: boolean;
}

export interface IAccountName
{
    accountName: string;
}

export interface IAvatarUrl
{
    avatarUrl: string;
}

export interface IIsTargetExists
{
    isTargetExists: boolean;
}

//#endregion