/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2022 by the xcube development team and contributors.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is furnished to do
 * so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { callJsonApi, makeRequestInit, makeRequestUrl } from './callApi';


export function updateResources(apiServerUrl: string, accessToken: string | null): Promise<string | null> {
    return callUpdate(apiServerUrl, "PUT", accessToken);
}

export function getLastResourcesUpdate(apiServerUrl: string, accessToken: string | null): Promise<string | null> {
    return callUpdate(apiServerUrl, "GET", accessToken);
}

function callUpdate(apiServerUrl: string, method: string, accessToken: string | null): Promise<string | null> {
    const url = makeRequestUrl(`${apiServerUrl}/maintenance/update`, []);
    const init = {...makeRequestInit(accessToken), method};
    try {
        return callJsonApi<boolean>(url, init)
            .then((result: any) => {
                return result["modification_time"] || null;
            })
            .catch(error => {
                console.error(error);
                return null;
            });
    } catch (error) {
        console.error(error);
        return Promise.resolve(null);
    }
}
