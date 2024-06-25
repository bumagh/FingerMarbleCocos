import { Player, PlayerOrder } from "../../../Framework/PartyTemplate/Player/Player";
import { List } from "../../../Libraries/Utility/List";

export interface IPartialPlayerList
{
    partialPlayerList: List<Player>;
}

export interface ITeamNumDif
{
    teamNumDif: number;
}

export interface IIsClientPlayerHost
{
    isClientPlayerHost: boolean;
}

export interface ITempData<T>
{
    tempData: T;
}

export interface IPlayerOrders
{
    orders: PlayerOrder[];
}

export interface IGaming
{
    gaming: boolean;
}