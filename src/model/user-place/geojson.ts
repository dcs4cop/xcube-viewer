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

import { default as OlGeoJSONFormat } from "ol/format/GeoJSON";
import { default as OlFeature } from "ol/Feature";

import { Format, parseAlternativeNames } from './common';
import i18n from "../../i18n";
import { getUserPlaceColorName } from "../../config";
import { newUserPlace, newUserPlaceGroup, PlaceGroup } from "../place";


const checkError = (text: string): string | null => {
    if (text.trim() !== '') {
        try {
            JSON.parse(text);
        } catch (e) {
            console.error(e);
            return `${e}`;
        }
    }
    return null;
};

export const geoJsonFormat: Format = {
    name: 'GeoJSON',
    fileExt: '.json,.geojson',
    checkError
};

export interface GeoJsonOptions {
    groupNames: string;
    groupPrefix: string;
    labelNames: string;
    labelPrefix: string;
    timeNames: string;
}

export const defaultGeoJsonOptions: GeoJsonOptions = {
    groupNames: "group, cruise, station, type",
    groupPrefix: "Group-",
    labelNames: "label, name, title, id",
    labelPrefix: "Place-",
    timeNames: "time, date, datetime, date-time",
};


let LAST_PLACE_GROUP_ID_GEO_JSON = 0;
let LAST_PLACE_LABEL_ID_GEO_JSON = 0;


export function getUserPlacesFromGeoJson(text: string, options: GeoJsonOptions): PlaceGroup[] {
    const groupNames = parseAlternativeNames(options.groupNames || '');
    let groupPrefix = options.groupPrefix.trim();
    if (groupPrefix === '') {
        groupPrefix = defaultGeoJsonOptions.groupPrefix;
    }

    const labelNames = parseAlternativeNames(options.labelNames || '');
    let labelPrefix = options.labelPrefix.trim();
    if (labelPrefix === '') {
        labelPrefix = defaultGeoJsonOptions.labelPrefix;
    }

    const timeNames = parseAlternativeNames(options.timeNames || '');

    const geoJsonFormat = new OlGeoJSONFormat();

    let features: OlFeature[];
    try {
        features = geoJsonFormat.readFeatures(text);
    } catch (e) {
        try {
            const geometry = geoJsonFormat.readGeometry(text);
            features = [new OlFeature(geometry)];
        } catch (e) {
            throw new Error(i18n.get(`Invalid GeoJSON`));
        }
    }

    const placeGroups: { [group: string]: PlaceGroup } = {};
    let numPlaceGroups = 0;
    features.forEach(feature => {
        const properties = feature.getProperties();
        const geometry = feature.getGeometry();
        if (geometry) {
            let time = '';
            let group = '';
            let label = '';
            let color = getUserPlaceColorName(0);

            if (Boolean(properties)) {
                const lcProperties: { [name: string]: any } = {};
                Object.getOwnPropertyNames(properties).forEach(propertyName => {
                    lcProperties[propertyName.toLowerCase()] = properties[propertyName];
                });
                time = getValueFromProperties(lcProperties, timeNames, time);
                label = getValueFromProperties(lcProperties, labelNames, label);
                group = getValueFromProperties(lcProperties, groupNames, group);
            }

            if (group === '') {
                const groupId = ++LAST_PLACE_GROUP_ID_GEO_JSON;
                group = `${groupPrefix}-${groupId}`;
            }
            if (label === '') {
                const labelId = ++LAST_PLACE_LABEL_ID_GEO_JSON;
                label = `${labelPrefix}-${labelId}`;
            }

            let placeGroup = placeGroups[group];
            if (!placeGroup) {
                placeGroup = newUserPlaceGroup(group, []);
                placeGroups[group] = placeGroup;
                color = getUserPlaceColorName(numPlaceGroups);
                numPlaceGroups++;
            }

            const geoJsonProps = {...properties};
            if (time !== '')
                geoJsonProps['time'] = time;
            if (!geoJsonProps['color'])
                geoJsonProps['color'] = color;
            if (!geoJsonProps['label'])
                geoJsonProps['label'] = label;
            if (!geoJsonProps['source'])
                geoJsonProps['source'] = 'GeoJSON';

            placeGroup.features.push(newUserPlace(geometry, geoJsonProps));
        }
    });

    return Object.getOwnPropertyNames(placeGroups).map(group => placeGroups[group]);
}

function getValueFromProperties(properties: { [p: string]: any },
                                names: string[],
                                currentValue: string): string {
    if (currentValue === '') {
        for (let lcName of names) {
            if (properties[lcName] === 'string') {
                return properties[lcName];
            }
        }
    }
    return currentValue;
}
