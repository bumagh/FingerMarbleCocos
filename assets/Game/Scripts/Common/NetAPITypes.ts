export type NetCountDownRespData = {
    gameid: number,
    requestuid: number,
    roomid: number,
    time: number,
    timerid: number,
    type: string
}


export type NetStartDownQueryData = {
    clientid: string,
    roomid: string,
    gameid: string,
    time: number
}

export type NetEndGameQueryData = {
    clientid: string,
    roomid: string,
    gameid: string
}

export type NetEndGameRespData = {
    requestuid: number,
    useridlist: number[],
    gameresult: {
        id: string,
        sort: number,
        sign: number
    }[],
    type: string
}
export type NetStopDownQueryData = {
    clientid: string,
    roomid: string,
    gameid: string,
    timerid: number
}

export type NetUpTeamIntegralQueryData = {
    clientid: string,
    roomid: string,
    gameid: string,
    integral: number,
    teamid: number
}
export type NetUpTeamIntegralRespData = {
    gameid: string,
    integrallist: {
        integral: number,//队伍总积分
        teamid: number,
        teamuser: {
            integral: number,
            id: number
        }[]
    }[],
    requestuid: number,
    type: string
}

export type NetEnterGameRespData = {
    gameroom: NetEnterGameGameRoom,
    gameuser: NetEnterGameGameUser[],
    requestuid: number,
    type: string
}

export type NetEnterGameGameRoom = {
    defaultsetup: string,
    gameauto: boolean,
    gamegroup: boolean,
    gameid: number,
    gamenum: number,
    gamestate: number,
    gametime: number,
    hostid: number,
    maxpeonum: number,
    minpeonum: number,
    upsetup: string,
}
export type NetEnterGameGameUser = {
    gameid: number,
    index: number,
    integral: number,
    sign: number,
    state: number,
    teamid: number,
    id: number,
    xaxis: number,
    yaxis: number,
}

export type NetUpHostQueryData = {
    clientid: string,
    roomid: string,
    gameid: string,
    hostid: number
}

export type NetUpHostRespData = {
    gameid: string,
    newhostid: string,
    requestuid: string,
    type: string
}