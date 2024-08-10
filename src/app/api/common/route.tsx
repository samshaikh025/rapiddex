import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

export async function POST(req: Request , res: NextApiResponse)
{
    const request = await req.json();
    let apiResponse;
    if(request.apiType == 'GET')
    {
        apiResponse = await fetch(request.apiUrl);
        apiResponse = await apiResponse.json();
    }else if(request.apiType == 'POST'){
        apiResponse = await fetch(request.apiUrl,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request.apiData),
        });
        apiResponse = await apiResponse.json();
    }
    return NextResponse.json(
        {
            Data: apiResponse
        }, 
        {status: 200}
    );
}