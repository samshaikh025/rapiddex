import { CommonConfig } from "@/shared/Const/Common.const";
import { SwapProvider } from "@/shared/Enum/Common.enum";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function POST(req: Request, res: NextApiResponse) {
    const request = await req.json();
    let apiResponse;
    request.apiUrl = getAPIUrl(request);
    let reqHeader = {
    };
    //add x-lifi-api-key: YOUR_CUSTOM_KEY to header
    if (request.apiProvider == SwapProvider.LIFI) {
        reqHeader['x-lifi-api-key'] = CommonConfig[request.apiProvider].apiKey;
    }

    if (request.apiType == 'GET') {
        apiResponse = await fetch(request.apiUrl, {
            method: 'GET',
            headers: reqHeader
        });
        if (apiResponse.status == 200) {
            apiResponse = await apiResponse.json();
        } else {
            return NextResponse.json(
                {
                    Data: null
                },
                { status: apiResponse.status }
            );
        }
    }
    else if (request.apiType == 'POST') {
        reqHeader['Content-Type'] = 'application/json';
        reqHeader['Accept'] = 'application/json';
        apiResponse = await fetch(request.apiUrl, {
            method: 'POST',
            headers: reqHeader,
            body: JSON.stringify(request.apiData),
        });
        if (apiResponse.status == 200) {
            apiResponse = await apiResponse.json();
        } else {
            return NextResponse.json(
                {
                    Data: null
                },
                { status: apiResponse.status }
            );
        }
    }
    return NextResponse.json(
        {
            Data: apiResponse
        },
        { status: 200 }
    );
}

function getAPIUrl(request: any) {
    let returnUrl = '';
    if (request.apiProvider == SwapProvider.LIFI
        || request.apiProvider == SwapProvider.OWLTO
        || request.apiProvider == SwapProvider.MOBULA
        || request.apiProvider == SwapProvider.DOTNET
        || request.apiProvider == SwapProvider.RAPIDDEX) {
        let apiConfig = CommonConfig[request.apiProvider];
        returnUrl = apiConfig.apiUrl + request.apiUrl;
    }
    else if (request.apiProvider == SwapProvider.RANGO) {
        let apiConfig = CommonConfig[request.apiProvider];
        returnUrl = apiConfig.apiUrl + request.apiUrl + (request.apiUrl.includes('?') ? '&' : '?') + 'apiKey=' + apiConfig.apiKey;
    }
    return returnUrl;
}