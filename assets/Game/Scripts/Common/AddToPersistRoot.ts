import { _decorator, Component, director, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('AddToPersistRoot')
export class AddToPersistRoot extends Component
{
    protected onLoad(): void
    {
        director.addPersistRootNode(this.node);
    }
}