/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019-2021 by the xcube development team and contributors.
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

import { TileSourceOptions } from './tile';
import i18n from "../i18n";
import { VolumeRenderMode } from "../states/controlState";

export interface Variable {
    id: string;
    name: string;
    dims: string[],
    shape: number[],
    dtype: string;
    units: string;
    title: string;
    timeChunkSize: number | null;
    // tileUrl is new since xcube 0.11
    tileUrl?: string;
    tileLevelMin?: number;
    tileLevelMax?: number;
    // tileSourceOptions are longer used since xcube 0.11
    tileSourceOptions?: TileSourceOptions;
    colorBarName: string;
    colorBarMin: number;
    colorBarMax: number;
    opacity?: number;
    volumeRenderMode?: VolumeRenderMode;
    volumeIsoThreshold?: number;
    htmlRepr?: string;
    attrs: { [name: string]: any };
}
