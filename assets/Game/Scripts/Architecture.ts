import { _decorator, AssetManager, assetManager, CCBoolean, CCString, Component, director, instantiate, JsonAsset, Prefab, sys, Node } from 'cc';
import { Debug } from '../../Libraries/Utility/Debug';
import { EventManager } from '../../Libraries/Utility/EventManager';
import { PipelineScheduleFunction } from '../../Libraries/Utility/PipelineContext';
import { Validator } from '../../Libraries/Utility/Validator';
import { OnSelfEnterRoomPipeline } from '../../Framework/PartyTemplate/Room/Pipelines/OnSelfEnterRoomPipeline';
import { UpdatePlayerUIPipeline } from '../../Framework/PartyTemplate/Subgame/Pipelines/UpdatePlayerUIPipeline';
import { UpdateSubgameUIPipeline } from '../../Framework/PartyTemplate/Subgame/Pipelines/UpdateSubgameUIPipeline';

const { ccclass, property, executionOrder } = _decorator;

@ccclass('Architecture')
@executionOrder(-999)
export class Architecture extends Component
{
    public static instance: Architecture;

    @property(CCString)
    private OSSUrl: string = "";

    @property(JsonAsset)
    private subgameId: JsonAsset;

    @property([CCString])
    private consoleIgnores: string[] = [];

    @property([CCString])
    private bundleNames: string[] = []


    @property(CCBoolean)
    private enableTestAccount: boolean = false;

    private bundles = new Map<string, AssetManager.Bundle>();
    private prefabsCreated: boolean = false;
    private arcadeScenePreloaded: boolean = false;

    public subgameIdMap = new Map<string, string>();
    public subgameNameCNMap = new Map<string, string>();

    protected onLoad(): void
    {
        Architecture.instance = this;
        EventManager.On("CreatePrefabFromBundle", this.CreatePrefabFromBundle, this);
        EventManager.On("LoadSceneFromBundle", this.LoadSceneFromBundle, this);

        sys.localStorage.setItem("OSSUrl", this.OSSUrl);
        Debug.SetIgnores(this.consoleIgnores);
        this.SetSubgameMap();

        this.InitEventManager();
        // this.InitWebSocketManager();
        // this.InitNetworkAPIManager();
        // this.InitRemoteImageManager();
        // this.DecodeUrlScheme();
        this.InitPipelines();
        this.LoadBundles();
    }

    protected onDestroy(): void
    {
        EventManager.Off("CreatePrefabFromBundle", this.CreatePrefabFromBundle, this);
        EventManager.Off("LoadSceneFromBundle", this.LoadSceneFromBundle, this);
    }

    private SetSubgameMap(): void
    {
        var jsonObject = this.subgameId.json;
        for (let key in jsonObject)
        {
            if (jsonObject.hasOwnProperty(key))
            {
                if (jsonObject[key].hasOwnProperty("id"))
                    this.subgameIdMap.set(key, jsonObject[key]["id"]);
                if (jsonObject[key].hasOwnProperty("nameCN"))
                    this.subgameNameCNMap.set(key, jsonObject[key]["nameCN"]);
            }
            else
                Debug.Error(`属性${key}或id缺失`);
        }
    }

    private InitEventManager(): void
    {
    }

    private InitWebSocketManager(): void
    {
        // var webSocketManager = new GameWebSocketManager();
        // webSocketManager.OnEnable();
    }

    private InitNetworkAPIManager(): void
    {
        // var networkAPIManager = new NetworkAPIManager();
        // networkAPIManager.OnEnable();
        // networkAPIManager.enableTestAccount = this.enableTestAccount;
    }

    private InitRemoteImageManager(): void
    {
        // var remoteImageManager = new RemoteImageManager();
        // remoteImageManager.OnEnable();
        // remoteImageManager.SetTags("PlayerAvatar", "Login", "SubgameIcon");
    }

    private DecodeUrlScheme(): void
    {
        // 在首次启动时通过 wx.getLaunchOptionsSync 接口获取
        // const { query } = wx.getLaunchOptionsSync();
        // const scene = decodeURIComponent(query.scene);
        // sys.localStorage.setItem("MerchantId", scene);

        // test
    }

    private InitPipelines(): void
    {
        new OnSelfEnterRoomPipeline().OnEnable();

        
        new UpdatePlayerUIPipeline().OnEnable();

        new UpdateSubgameUIPipeline().OnEnable();
        // new IntBilStartPipeline().OnEnable();
        // new IntBilGamingPipeline().OnEnable();
        // new IntBilEndPipeline().OnEnable();
        PipelineScheduleFunction.scheduleOnce = (callback: any, delay?: number) => this.scheduleOnce(callback, delay);
    }

    private LoadBundles(): void
    {
        // for (let i = 0; i < this.bundleNames.length; i++)
        // {
        //     const bundleName = this.bundleNames[i];
        //     assetManager.loadBundle(bundleName, (err, bundle) =>
        //     {
        //         Architecture.instance.bundles.set(bundleName, bundle);
        //         if (Architecture.instance.AreBundlesLoaded())
        //         {
        //             Architecture.instance.CreatePrefabs();
        //             this.PreloadArcadeScene();
        //         }
        //     });
        // }
        this.PreloadArcadeScene();
    }

    private PreloadArcadeScene(): void
    {
        director.preloadScene("Arcade", (error, scene) =>
        {
            if (error)
                Debug.Error(error);
            else
                Debug.Log("Arcade 场景预加载完成");
            Architecture.instance.arcadeScenePreloaded = true;
        });
    }

    /**
     * 大厅场景加载时，加载budle里的预制体
     */
    private CreatePrefabs(): void
    {
        this.prefabsCreated = true;
    }

    /**
     * 从bundle中加载prefab，并生成节点
     */
    private CreatePrefabFromBundle(bundleName: string, prefabPath: string, parentNode: Node = null): void
    {
        if (Validator.IsStringIllegal(bundleName, "bundleName")) return;
        if (Validator.IsStringIllegal(prefabPath, "prefabPath")) return;
        var bundle = this.bundles.get(bundleName);
        if (Validator.IsObjectIllegal(bundle, "bundle")) return;
        bundle.load(prefabPath, Prefab, function (err, prefab)
        {
            let newNode = instantiate(prefab);
            if (parentNode == null)
                parentNode = director.getScene();
            parentNode.addChild(newNode);
        });
    }

    private LoadSceneFromBundle(sceneName: string): void
    {
        // if (Validator.IsStringIllegal(sceneName, "sceneName")) return;
        // if (Validator.IsStringIllegal(this.sceneBundle, "this.sceneBundle")) return;
        // if (!Architecture.instance.bundles.has(this.sceneBundle))
        // {
        //     Debug.Error(`未找到bundle: ${this.sceneBundle}`);
        //     return;
        // }
        // var bundle = Architecture.instance.bundles.get(this.sceneBundle);
        // bundle.loadScene(sceneName, (err, data) =>
        // {
        //     director.runScene(data);
        // });
    }

    public AreBundlesLoaded(): boolean
    {
        return this.bundleNames.length == this.bundles.size;
    }

    public ArePrefabCreated(): boolean
    {
        return this.prefabsCreated;
    }

    public IsArcadeScenePreloaded(): boolean
    {
        return this.arcadeScenePreloaded;
    }

}