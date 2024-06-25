import { sys } from "cc";
import { Tools } from "../../../../Game/Scripts/Common/Tools";
import { EventManager } from "../../../../Libraries/Utility/EventManager";
import { PipelineContext, Pipeline } from "../../../../Libraries/Utility/PipelineContext";
import { Validator } from "../../../../Libraries/Utility/Validator";

export class SendNoticeContext extends PipelineContext
{
    public gameId: string = null;
    public type: number = 0;
    public data: any = null;
}

export class SendNoticePipeline extends Pipeline<SendNoticeContext>
{
    protected SetPipelineName(): void
    {
        this.pipelineName = "SendNoticePipeline";
    }

    protected SetCreateContext(): void
    {
        this.createContext = this.CreateContext;
    }

    protected SetStages(): void
    {
        // 发送请求
        this.AddCallback(() =>
        {
            var data = {
                clientid: Tools.GetClientId,
                roomid: sys.localStorage.getItem("ArcadeId"),
                gameid: this.context.gameId,
                type: this.context.type,
                data: this.context.data
            };
            EventManager.Emit("RequestAPI", "/v1/sendnotice", data);
            return true;
        });
        
        //更新数据
    }

    private CreateContext(gameId: string, data: string, type: number): SendNoticeContext
    {
        if (Validator.IsStringIllegal(gameId, "gameId")) return null;
        if (Validator.IsStringIllegal(data, "data")) return null;
        var context = new SendNoticeContext();
        context.gameId = gameId;
        context.data = data;
        context.type = type;
        return context;
    }
}