/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2023 by the xcube development team and contributors.
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

import { default as OlMap } from 'ol/Map';
import { Geometry as OlGeometry } from 'ol/geom';
import { Extent as OlExtent } from 'ol/extent';
import { transformExtent as olProjTransformExtent } from 'ol/proj';
import { default as OlSimpleGeometry } from 'ol/geom/SimpleGeometry';
import { GEOGRAPHIC_CRS } from '../model/proj';
import { MAP_OBJECTS } from '../states/controlState';
import { Dispatch } from "redux";
import { TileSourceEvent as OlTileSourceEvent } from "ol/source/Tile";


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type TileEventType = "tileloadstart" | "tileloadend" | "tileloaderror";
export const UPDATE_TILE_PROGRESS = 'UPDATE_TILE_PROGRESS';

export interface UpdateTileProgress {
    type: typeof UPDATE_TILE_PROGRESS;
    eventType: TileEventType;
    tileKey: string;
    tileCoord: number[];
}

export function updateTileProgress(event: OlTileSourceEvent) {
    return (dispatch: Dispatch<UpdateTileProgress>) => {
        dispatch(_updateTileProgress(
            event.type as TileEventType,
            event.tile.getKey(),
            event.tile.getTileCoord(),
        ));
    };
}

export function _updateTileProgress(eventType: TileEventType,
                                    tileKey: string,
                                    tileCoord: number[]): UpdateTileProgress {
    return {type: UPDATE_TILE_PROGRESS, eventType, tileKey, tileCoord};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Side-effect actions

// noinspection JSUnusedLocalSymbols
export function renameUserPlaceInLayer(placeGroupId: string, placeId: string, newName: string) {
    if (MAP_OBJECTS[placeGroupId]) {
        // const userLayer = MAP_OBJECTS[placeGroupId] as OlVectorLayer;
        // const source = userLayer.getSource();
        // TODO (forman): update feature source in user layer to reflect newName.
        //  Note, this is not yet an issue, because we still don't show user places labels
        //  in the viewer.
    }
}

export function flyToLocation(mapId: string, location: OlGeometry | OlExtent | null) {
    if (MAP_OBJECTS[mapId]) {
        const map = MAP_OBJECTS[mapId] as OlMap;
        const flyToCurr = location;
        if (flyToCurr !== null) {
            const projection = map.getView().getProjection();
            let flyToTarget;
            // noinspection JSDeprecatedSymbols
            if (Array.isArray(flyToCurr)) {
                // Fly to extent (bounding box)
                flyToTarget = olProjTransformExtent(flyToCurr as OlExtent, GEOGRAPHIC_CRS, projection);
                map.getView().fit(flyToTarget, {size: map.getSize()});
            } else {
                // Transform Geometry object
                flyToTarget = flyToCurr.transform(GEOGRAPHIC_CRS, projection) as OlSimpleGeometry;
                if (flyToTarget.getType() === 'Point') {
                    // Points don't zoom. Just reset map center.
                    // Not ideal, but better than zooming in too deep (see #54)
                    map.getView().setCenter(flyToTarget.getFirstCoordinate());
                } else {
                    // Fly to shape
                    map.getView().fit(flyToTarget, {size: map.getSize()});
                }
            }
        }
    }
}
