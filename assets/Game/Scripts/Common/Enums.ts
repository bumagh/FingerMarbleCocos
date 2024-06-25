import { Enum } from "cc";

export enum LifeCycle
{
    None,
    OnLoad,
    OnEnable,
    Start,
    Update,
    LateUpdate,
    OnDisable,
    OnDestroy,
}

export enum NoticeType {
    All,
    Others
}
export enum Team{
    UnKnown=0,
    Red=1,
    Blue=2
}
export enum Gender{
    Male="1",
    Female="2",
    UnKnown="3"
}
Enum(LifeCycle);
Enum(NoticeType);
Enum(Team);
Enum(Gender);