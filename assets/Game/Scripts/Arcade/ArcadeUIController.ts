import { _decorator, Component, Label } from "cc";
import { Debug } from "../../../Libraries/Utility/Debug";
import { EventManager } from "../../../Libraries/Utility/EventManager";
import { Validator } from "../../../Libraries/Utility/Validator";
import { INodeReferencesListener, NodeReferences } from "../Common/NodeReferences";

const { ccclass, property, executionOrder } = _decorator;

@ccclass('ArcadeUIController')
@executionOrder(-1)
export class ArcadeUIController extends Component implements INodeReferencesListener
{

    @property(NodeReferences)
    public canvasReferences: NodeReferences;


    public openSubgame: (sceneName: string, roomId: string) => void = null;

    private playerCountLabel: Label;

    protected onLoad(): void
    {
        this.playerCountLabel = this.canvasReferences.GetVisual<Label>("PlayerCountLabel", Label);
        EventManager.On("NodeReferencesOnLoad", this.NodeReferencesOnLoad, this);
        EventManager.On("NodeReferencesOnEnable", this.NodeReferencesOnEnable, this);
        EventManager.On("NodeReferencesOnDisable", this.NodeReferencesOnDisable, this);
        EventManager.On("NodeReferencesOnDestroy", this.NodeReferencesOnDestroy, this);
    }

    protected onDestroy(): void
    {
        EventManager.Off("NodeReferencesOnLoad", this.NodeReferencesOnLoad, this);
        EventManager.Off("NodeReferencesOnEnable", this.NodeReferencesOnEnable, this);
        EventManager.Off("NodeReferencesOnDisable", this.NodeReferencesOnDisable, this);
        EventManager.Off("NodeReferencesOnDestroy", this.NodeReferencesOnDestroy, this);
    }

    public NodeReferencesOnLoad(references: NodeReferences): void
    {
        if (Validator.IsObjectIllegal(references, "references")) return;
        if (Validator.IsStringIllegal(references.type, "references.type")) return;
        switch (references.type)
        {
            case "Player":
               
                break;
            case "Subgame":
                // var subgameUI = references as SubgameUISelector;
                // if (!this.subgameList.Has(subgameUI))
                //     this.subgameList.Add(subgameUI);
                // references.GetNode("Icon").on(Input.EventType.TOUCH_END, this.OnSubgameTouched, this);
                break;

            default:
                // Debug.Log(`switch中没有${references.type}的case`);
                break;
        }
    }

    public NodeReferencesOnEnable(references: NodeReferences): void
    {
        // 暂时不做任何事
    }

    public NodeReferencesOnDisable(references: NodeReferences): void
    {
        // 暂时不做任何事
    }
     public NodeReferencesOnDestroy(references: NodeReferences): void
    {
        
    }

    /**
     * 设置玩家数量的标签
     */
    public SetPlayerCountLabel(cuont: number): void
    {
        this.playerCountLabel.string = `全部玩家 ${cuont}`;
    }

}