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

import { Dispatch } from 'redux';
import * as geojson from 'geojson';
import JSZip from 'jszip';

import * as api from '../api'
import i18n from '../i18n';
import { ApiServerConfig, ApiServerInfo } from '../model/apiServer';
import { ColorBars } from '../model/colorBar';
import { Dataset } from '../model/dataset';
import {
    findPlaceInPlaceGroups,
    getUserPlacesFromCsv,
    getUserPlacesFromGeoJson,
    getUserPlacesFromWkt,
    Place,
    PlaceGroup
} from '../model/place';
import { TimeSeries, TimeSeriesGroup, timeSeriesGroupsToTable } from '../model/timeSeries';
import {
    mapProjectionSelector,
    selectedDatasetIdSelector,
    selectedDatasetTimeDimensionSelector,
    selectedDatasetVariableSelector,
    selectedPlaceGroupPlacesSelector,
    selectedPlaceGroupsSelector,
    selectedPlaceIdSelector,
    selectedPlaceSelector,
    selectedServerSelector,
    selectedTimeChunkSizeSelector,
    userPlacesFormatNameSelector,
    userPlacesFormatOptionsCsvSelector,
    userPlacesFormatOptionsGeoJsonSelector,
    userPlacesFormatOptionsWktSelector
} from '../selectors/controlSelectors';
import { datasetsSelector, placeGroupsSelector, userPlaceGroupSelector } from '../selectors/dataSelectors';
import { AppState } from '../states/appState';
import {
    AddActivity,
    addActivity,
    openDialog,
    OpenDialog,
    RemoveActivity,
    removeActivity,
    SelectDataset,
    selectDataset,
    selectPlace,
    SelectPlace,
    selectPlaceGroups,
    SelectPlaceGroups,
    UpdateSettings,
} from './controlActions';
import { MessageLogAction, PostMessage, postMessage } from './messageLogActions';

const saveAs = require('file-saver');


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_SERVER_INFO = 'UPDATE_SERVER_INFO';

export interface UpdateServerInfo {
    type: typeof UPDATE_SERVER_INFO;
    serverInfo: ApiServerInfo;
}

export function updateServerInfo() {
    return (dispatch: Dispatch<UpdateServerInfo | AddActivity | RemoveActivity | MessageLogAction>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());

        dispatch(addActivity(UPDATE_SERVER_INFO, i18n.get('Connecting to server')));

        api.getServerInfo(apiServer.url)
            .then((serverInfo: ApiServerInfo) => {
                dispatch(_updateServerInfo(serverInfo));
            })
            .catch(error => {
                dispatch(postMessage('error', error));
            })
            // 'then' because Microsoft Edge does not understand method finally
            .then(() => {
                dispatch(removeActivity(UPDATE_SERVER_INFO));
            });
    };
}

export function _updateServerInfo(serverInfo: ApiServerInfo): UpdateServerInfo {
    return {type: UPDATE_SERVER_INFO, serverInfo};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_RESOURCES = 'UPDATE_RESOURCES';

export function updateResources() {
    return (dispatch: Dispatch<AddActivity | RemoveActivity>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());
        dispatch(addActivity(UPDATE_RESOURCES, i18n.get('Updating resources')));
        api.updateResources(apiServer.url, getState().userAuthState.accessToken)
            .then(updateTime => {
                if (updateTime !== null) {
                    window.location.reload();
                }
            })
            .finally(() =>
                dispatch(removeActivity(UPDATE_RESOURCES))
            );
    }
}

let _lastServerUpdateTime: string | null = null;

export function checkServerUpdate() {
    return (dispatch: Dispatch, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());
        api.getLastResourcesUpdate(apiServer.url, getState().userAuthState.accessToken)
            .then(updateTime => {
                if (updateTime !== null) {
                    if (_lastServerUpdateTime !== null && _lastServerUpdateTime != updateTime) {
                        console.log(`>>> server configuration updated at ${updateTime}`);
                    }
                    _lastServerUpdateTime = updateTime;
                }
            });
    }
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_DATASETS = 'UPDATE_DATASETS';

export interface UpdateDatasets {
    type: typeof UPDATE_DATASETS;
    datasets: Dataset[];
}

export function updateDatasets() {
    return (dispatch: Dispatch<UpdateDatasets | SelectDataset | AddActivity | RemoveActivity | MessageLogAction>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());

        dispatch(addActivity(UPDATE_DATASETS, i18n.get('Loading data')));

        api.getDatasets(apiServer.url, getState().userAuthState.accessToken)
            .then((datasets: Dataset[]) => {
                dispatch(_updateDatasets(datasets));
                if (datasets.length > 0) {
                    const selectedDatasetId = getState().controlState.selectedDatasetId || datasets[0].id;
                    dispatch(selectDataset(selectedDatasetId, datasets, true) as any);
                }
            })
            .catch(error => {
                dispatch(postMessage('error', error));
                dispatch(_updateDatasets([]));
            })
            // 'then' because Microsoft Edge does not understand method finally
            .then(() => {
                dispatch(removeActivity(UPDATE_DATASETS));
            });
    };
}

export function _updateDatasets(datasets: Dataset[]): UpdateDatasets {
    return {type: UPDATE_DATASETS, datasets};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_DATASET_PLACE_GROUP = 'UPDATE_DATASET_PLACE_GROUP';

export interface UpdateDatasetPlaceGroup {
    type: typeof UPDATE_DATASET_PLACE_GROUP;
    datasetId: string;
    placeGroup: PlaceGroup;
}

export function updateDatasetPlaceGroup(datasetId: string,
                                        placeGroup: PlaceGroup): UpdateDatasetPlaceGroup {
    return {type: UPDATE_DATASET_PLACE_GROUP, datasetId, placeGroup};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ADD_USER_PLACE = 'ADD_USER_PLACE';

export interface AddUserPlace {
    type: typeof ADD_USER_PLACE;
    id: string;
    label: string;
    color: string;
    geometry: geojson.Geometry;
    selectPlace: boolean;
}

export function addUserPlace(id: string,
                             label: string,
                             color: string,
                             geometry: geojson.Geometry,
                             selectPlace: boolean) {
    return (dispatch: Dispatch<AddUserPlace>, getState: () => AppState) => {
        dispatch(_addUserPlace(id, label, color, geometry, selectPlace));
        if (getState().controlState.autoShowTimeSeries) {
            dispatch(addTimeSeries() as any);
        }
    };
}

export function _addUserPlace(id: string,
                              label: string,
                              color: string,
                              geometry: geojson.Geometry,
                              selectPlace: boolean): AddUserPlace {
    return {type: ADD_USER_PLACE, id, label, color, geometry, selectPlace};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const ADD_USER_PLACES = 'ADD_USER_PLACES';

export interface AddUserPlaces {
    type: typeof ADD_USER_PLACES;
    places: Place[];
    mapProjection: string;
    selectPlace: boolean;
}

export function addUserPlaces(places: Place[],
                              mapProjection: string,
                              selectPlace: boolean): AddUserPlaces {
    return {
        type: ADD_USER_PLACES,
        places: places,
        mapProjection,
        selectPlace
    };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

type UserPlacesDispatch = Dispatch<AddUserPlaces
    | SelectPlaceGroups
    | SelectPlace
    | UpdateSettings
    | OpenDialog
    | PostMessage>;


export function addUserPlacesFromText(text: string) {
    return (dispatch: UserPlacesDispatch, getState: () => AppState) => {
        const formatName = userPlacesFormatNameSelector(getState());
        let places: Place[];
        try {
            if (formatName === 'csv') {
                const options = userPlacesFormatOptionsCsvSelector(getState());
                places = getUserPlacesFromCsv(text, options);
            } else if (formatName === 'geojson') {
                const options = userPlacesFormatOptionsGeoJsonSelector(getState());
                places = getUserPlacesFromGeoJson(text, options);
            } else if (formatName === 'wkt') {
                const options = userPlacesFormatOptionsWktSelector(getState());
                places = getUserPlacesFromWkt(text, options);
            } else {
                places = [];
            }
        } catch (e) {
            dispatch(postMessage('error', e));
            dispatch(openDialog('addUserPlacesFromText'));
            places = [];
        }
        if (places.length) {
            dispatch(addUserPlaces(places, mapProjectionSelector(getState()), true));
            dispatch(selectPlaceGroups(['user']) as any);
            if (places.length === 1) {
                dispatch(selectPlace(
                    places[0].id,
                    selectedPlaceGroupPlacesSelector(getState()),
                    true
                ) as any);
                if (getState().controlState.autoShowTimeSeries) {
                    dispatch(addTimeSeries() as any);
                }
            }
            dispatch(postMessage('info', i18n.get(`Imported ${places.length} place(s)`)));
        } else {
            dispatch(postMessage('warning', i18n.get('No places imported')));
        }
    };
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const REMOVE_USER_PLACE = 'REMOVE_USER_PLACE';

export interface RemoveUserPlace {
    type: typeof REMOVE_USER_PLACE;
    id: string;
    places: Place[];
}

export function removeUserPlace(id: string, places: Place[]): RemoveUserPlace {
    return {type: REMOVE_USER_PLACE, id, places};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const REMOVE_ALL_USER_PLACES = 'REMOVE_ALL_USER_PLACES';

export interface RemoveAllUserPlaces {
    type: typeof REMOVE_ALL_USER_PLACES;
}

export function removeAllUserPlaces(): RemoveAllUserPlaces {
    return {type: REMOVE_ALL_USER_PLACES};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function addTimeSeries() {
    return (dispatch: Dispatch<UpdateTimeSeries | MessageLogAction>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());

        const selectedDatasetId = selectedDatasetIdSelector(getState());
        const selectedDatasetTimeDim = selectedDatasetTimeDimensionSelector(getState());
        const selectedVariable = selectedDatasetVariableSelector(getState());
        const selectedPlaceId = selectedPlaceIdSelector(getState());
        const selectedPlace = selectedPlaceSelector(getState())!;
        const timeSeriesUpdateMode = getState().controlState.timeSeriesUpdateMode;
        const useMedian = getState().controlState.showTimeSeriesMedian;
        const inclStDev = getState().controlState.showTimeSeriesErrorBars;
        let timeChunkSize = selectedTimeChunkSizeSelector(getState());

        const placeGroups = placeGroupsSelector(getState());

        if (selectedDatasetId && selectedVariable && selectedPlaceId && selectedDatasetTimeDim) {
            const timeLabels = selectedDatasetTimeDim.labels;
            const numTimeLabels = timeLabels.length;

            timeChunkSize = timeChunkSize > 0 ? timeChunkSize:numTimeLabels;

            let endTimeIndex = numTimeLabels - 1;
            let startTimeIndex = endTimeIndex - timeChunkSize + 1;

            const getTimeSeriesChunk = () => {
                const startDateLabel = startTimeIndex >= 0 ? timeLabels[startTimeIndex]:null;
                const endDateLabel = timeLabels[endTimeIndex];
                return api.getTimeSeriesForGeometry(apiServer.url,
                    selectedDatasetId,
                    selectedVariable,
                    selectedPlace.id,
                    selectedPlace.geometry,
                    startDateLabel,
                    endDateLabel,
                    useMedian,
                    inclStDev,
                    getState().userAuthState.accessToken);
            };

            const successAction = (timeSeries: TimeSeries | null) => {
                if (timeSeries !== null && isValidPlace(placeGroups, selectedPlace.id)) {
                    const hasMore = startTimeIndex > 0;
                    const dataProgress = hasMore ? (numTimeLabels - startTimeIndex) / numTimeLabels:1.0;
                    dispatch(updateTimeSeries({...timeSeries, dataProgress},
                        timeSeriesUpdateMode,
                        endTimeIndex === numTimeLabels - 1 ? 'new':'append'));
                    if (hasMore && isValidPlace(placeGroups, selectedPlace.id)) {
                        startTimeIndex -= timeChunkSize;
                        endTimeIndex -= timeChunkSize;
                        getTimeSeriesChunk().then(successAction);
                    }
                } else {
                    dispatch(postMessage('info', 'No data found here'));
                }
            };

            getTimeSeriesChunk()
                .then(successAction)
                .catch((error: any) => {
                    dispatch(postMessage('error', error));
                });
        }
    };
}

function isValidPlace(placeGroups: PlaceGroup[], placeId: string) {
    return findPlaceInPlaceGroups(placeGroups, placeId) !== null;
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_TIME_SERIES = 'UPDATE_TIME_SERIES';

export interface UpdateTimeSeries {
    type: typeof UPDATE_TIME_SERIES;
    timeSeries: TimeSeries;
    updateMode: 'add' | 'replace' | 'remove';
    dataMode: 'new' | 'append';
}

export function updateTimeSeries(timeSeries: TimeSeries, updateMode: 'add' | 'replace' | 'remove', dataMode: 'new' | 'append'): UpdateTimeSeries {
    return {type: UPDATE_TIME_SERIES, timeSeries, updateMode, dataMode};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const REMOVE_TIME_SERIES_GROUP = 'REMOVE_TIME_SERIES_GROUP';

export interface RemoveTimeSeriesGroup {
    type: typeof REMOVE_TIME_SERIES_GROUP;
    id: string;
}

export function removeTimeSeriesGroup(id: string): RemoveTimeSeriesGroup {
    return {type: REMOVE_TIME_SERIES_GROUP, id};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const REMOVE_ALL_TIME_SERIES = 'REMOVE_ALL_TIME_SERIES';

export interface RemoveAllTimeSeries {
    type: typeof REMOVE_ALL_TIME_SERIES;
}

export function removeAllTimeSeries(): RemoveAllTimeSeries {
    return {type: REMOVE_ALL_TIME_SERIES};
}

////////////////////////////////////////////////////////////////////////////////////////////////


export const CONFIGURE_SERVERS = 'CONFIGURE_SERVERS';

export interface ConfigureServers {
    type: typeof CONFIGURE_SERVERS;
    servers: ApiServerConfig[];
    selectedServerId: string;
}

export function configureServers(servers: ApiServerConfig[], selectedServerId: string) {
    return (dispatch: Dispatch<any>, getState: () => AppState) => {
        if (getState().controlState.selectedServerId !== selectedServerId) {
            dispatch(removeAllTimeSeries());
            dispatch(_configureServers(servers, selectedServerId));
            dispatch(syncWithServer());
        } else if (getState().dataState.userServers !== servers) {
            dispatch(_configureServers(servers, selectedServerId));
        }
    };
}

export function _configureServers(servers: ApiServerConfig[], selectedServerId: string): ConfigureServers {
    return {type: CONFIGURE_SERVERS, servers, selectedServerId};
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function syncWithServer() {
    return (dispatch: Dispatch<any>) => {
        dispatch(updateServerInfo());
        dispatch(updateDatasets());
        dispatch(updateColorBars());
    };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const UPDATE_COLOR_BARS = 'UPDATE_COLOR_BARS';

export interface UpdateColorBars {
    type: typeof UPDATE_COLOR_BARS;
    colorBars: ColorBars;
}

export function updateColorBars() {
    return (dispatch: Dispatch<UpdateColorBars | MessageLogAction>, getState: () => AppState) => {
        const apiServer = selectedServerSelector(getState());

        api.getColorBars(apiServer.url)
            .then((colorBars: ColorBars) => {
                dispatch(_updateColorBars(colorBars));
            })
            .catch(error => {
                dispatch(postMessage('error', error));
            });
    };
}

export function _updateColorBars(colorBars: ColorBars): UpdateColorBars {
    return {type: UPDATE_COLOR_BARS, colorBars};
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


export const UPDATE_VARIABLE_COLOR_BAR = 'UPDATE_VARIABLE_COLOR_BAR';

export interface UpdateVariableColorBar {
    type: typeof UPDATE_VARIABLE_COLOR_BAR;
    datasetId: string;
    variableName: string;
    colorBarMinMax: [number, number];
    colorBarName: string;
    opacity: number;
}

export function updateVariableColorBar(colorBarMinMax: [number, number],
                                       colorBarName: string,
                                       opacity: number) {
    return (dispatch: Dispatch<UpdateVariableColorBar>, getState: () => AppState) => {
        const selectedDatasetId = getState().controlState.selectedDatasetId;
        const selectedVariableName = getState().controlState.selectedVariableName;
        if (selectedDatasetId && selectedVariableName) {
            dispatch(_updateVariableColorBar(
                selectedDatasetId, selectedVariableName,
                colorBarMinMax, colorBarName, opacity
            ));
        }
    };
}

export function _updateVariableColorBar(datasetId: string,
                                        variableName: string,
                                        colorBarMinMax: [number, number],
                                        colorBarName: string,
                                        opacity: number): UpdateVariableColorBar {
    return {
        type: UPDATE_VARIABLE_COLOR_BAR,
        datasetId,
        variableName,
        colorBarMinMax,
        colorBarName,
        opacity
    };
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function exportData() {
    return (dispatch: Dispatch<UpdateVariableColorBar>, getState: () => AppState) => {
        const {
            exportTimeSeries,
            exportTimeSeriesSeparator,
            exportPlaces,
            exportPlacesAsCollection,
            exportZipArchive,
            exportFileName,
        } = getState().controlState;

        let placeGroups: PlaceGroup[] = [];

        if (exportTimeSeries) {
            // Time series may reference any place, so collect all known place groups.
            placeGroups = [];
            const datasets = datasetsSelector(getState());
            datasets.forEach(dataset => {
                if (dataset.placeGroups) {
                    placeGroups = placeGroups.concat(dataset.placeGroups);
                }
            });
            placeGroups.push(userPlaceGroupSelector(getState()));
        } else if (exportPlaces) {
            // Just export all visible places.
            placeGroups = selectedPlaceGroupsSelector(getState());
        }

        _exportData(getState().dataState.timeSeriesGroups,
            placeGroups,
            {
                includeTimeSeries: exportTimeSeries,
                includePlaces: exportPlaces,
                separator: exportTimeSeriesSeparator,
                placesAsCollection: exportPlacesAsCollection,
                zip: exportZipArchive,
                fileName: exportFileName,
            }
        );
    };
}


abstract class Exporter {
    abstract write(path: string, content: string): any;

    abstract close(): any;
}

class ZipExporter extends Exporter {
    fileName: string;
    zipArchive: JSZip;

    constructor(fileName: string) {
        super();
        this.fileName = fileName;
        this.zipArchive = new JSZip();
    }

    write(path: string, content: string) {
        this.zipArchive.file(path, content);
    }

    close() {
        this.zipArchive.generateAsync({type: 'blob'})
            .then((content) => saveAs(content, this.fileName));
    }
}

class FileExporter extends Exporter {

    write(path: string, content: string) {
        const blob = new Blob([content],
            {type: 'text/plain;charset=utf-8'});
        saveAs(blob, path);
    }

    close() {
    }
}

interface ExportOptions {
    includeTimeSeries?: boolean;
    separator?: string;
    includePlaces?: boolean;
    fileName?: string;
    placesAsCollection?: boolean;
    zip?: boolean;
}

function _exportData(timeSeriesGroups: TimeSeriesGroup[],
                     placeGroups: PlaceGroup[],
                     options: ExportOptions) {

    let {
        includeTimeSeries,
        separator,
        includePlaces,
        fileName,
        placesAsCollection,
        zip,
    } = options;

    separator = separator || 'TAB';
    if (separator.toUpperCase() === 'TAB') {
        separator = '\t';
    }

    fileName = fileName || 'export';

    if (!includeTimeSeries && !includePlaces) {
        return;
    }

    let exporter: Exporter;
    if (zip) {
        exporter = new ZipExporter(`${fileName}.zip`);
    } else {
        exporter = new FileExporter();
    }

    let placesToExport: { [placeId: string]: Place };

    if (includeTimeSeries) {
        const {colNames, dataRows, referencedPlaces} = timeSeriesGroupsToTable(timeSeriesGroups, placeGroups);
        const validTypes: { [typeName: string]: boolean } = {number: true, string: true};
        const csvHeaderRow = colNames.join(separator);
        const csvDataRows = dataRows.map(row => row.map(value => validTypes[typeof value] ? value + '':'').join(separator));
        const csvText = [csvHeaderRow].concat(csvDataRows).join('\n');
        exporter.write(`${fileName}.txt`, csvText);
        placesToExport = referencedPlaces;
    } else {
        placesToExport = {};
        placeGroups.forEach(placeGroup => {
            if (placeGroup.features) {
                placeGroup.features.forEach(place => {
                    placesToExport[place.id] = place;
                });
            }
        });
    }

    if (includePlaces) {
        if (placesAsCollection) {
            const collection = {
                type: 'FeatureCollection',
                features: Object.keys(placesToExport).map(placeId => placesToExport![placeId])
            };
            exporter.write(`${fileName}.geojson`,
                JSON.stringify(collection, null, 2));
        } else {
            Object.keys(placesToExport).forEach(placeId => {
                exporter.write(`${placeId}.geojson`,
                    JSON.stringify(placesToExport![placeId], null, 2));
            });
        }
    }

    exporter.close();
}

/*
function _downloadTimeSeriesGeoJSON(timeSeriesGroups: TimeSeriesGroup[],
                                    placeGroups: PlaceGroup[],
                                    format: 'GeoJSON' | 'CSV',
                                    fileName: string = 'time-series',
                                    multiFile: boolean = true,
                                    zipArchive: boolean = true) {
    const featureCollection = timeSeriesGroupsToGeoJSON(timeSeriesGroups);

    if (format === 'GeoJSON') {
        if (zipArchive) {
            const zip = new JSZip();
            if (multiFile) {
                zip.file(`${fileName}.geojson`,
                         JSON.stringify(featureCollection, null, 2));
            } else {
                for (let feature of featureCollection.features) {
                    zip.file(`${feature.id}.geojson`,
                             JSON.stringify(feature, null, 2));
                }
            }
            zip.generateAsync({type: "blob"})
               .then((content) => saveAs(content, `${fileName}.zip`));
        } else {
            if (multiFile) {
                throw new Error('Cannot download multi-file exports');
            }
            const blob = new Blob([JSON.stringify(featureCollection, null, 2)],
                                  {type: "text/plain;charset=utf-8"});
            saveAs(blob, `${fileName}.geojson`);
        }
    } else {
        // TODO (forman): implement CSV export
        throw new Error(`Download as ${format} is not yet implemented`);
    }

}
*/

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type DataAction =
    UpdateServerInfo
    | UpdateDatasets
    | UpdateDatasetPlaceGroup
    | AddUserPlace
    | AddUserPlaces
    | RemoveUserPlace
    | RemoveAllUserPlaces
    | UpdateTimeSeries
    | RemoveTimeSeriesGroup
    | RemoveAllTimeSeries
    | ConfigureServers
    | UpdateColorBars
    | UpdateVariableColorBar;
