import { _decorator, CCInteger, Component, Node } from 'cc';
import { NodeReferences } from '../Common/NodeReferences';
const { ccclass, property } = _decorator;

@ccclass('SubgameUISelector')
export class SubgameUISelector extends NodeReferences
{
    @property(CCInteger)
    public recommended: number = 0;

    public type: string;
}