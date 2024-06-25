import { List } from "../../../Libraries/Utility/List";
import { PlayerController } from "../Player/PlayerController";

export class Arcade
{
    public id: string;          // 大厅（包厢）id

    public name: string;        // 大厅（包厢）名称

    /**
     * 本机玩家的id
     */
    public clientPlayerId: string;

    /**
     * 所有在此大厅内的玩家控制器，包括在房间里的
     */
    public playerControllers = new List<PlayerController>();
}