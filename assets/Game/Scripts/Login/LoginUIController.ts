import { _decorator, Component, Label, Node, Sprite } from 'cc';
import { Tools } from '../Common/Tools';
import { EventManager } from '../../../Libraries/Utility/EventManager';
import { Validator } from '../../../Libraries/Utility/Validator';
const { ccclass, property } = _decorator;

@ccclass('LoginUIController')
export class LoginUIController extends Component
{
    @property(Sprite)
    public logoSprite: Sprite;

    @property(Label)
    public arcadeNameLabel: Label;

    @property(Node)
    public bgNode: Node;

    @property(Node)
    public logoPanel: Node;

    @property(Node)
    public choseGenderPanel: Node;

    protected start(): void
    {
        // var defaultLogoUrl = `${Tools.GetOSSUrl()}/images/logo.png`;
        // EventManager.Emit("SetRemoteSpriteFrame", "Login", "logo", this.logoSprite, defaultLogoUrl);
    }

    public ShowArcadeName(name: string): void
    {
        if (Validator.IsStringIllegal(name, "name")) return;
        this.arcadeNameLabel.string = name;
    }
}