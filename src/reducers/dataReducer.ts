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

import { DataState, newDataState } from '../states/dataState';
import { storeUserServers } from '../states/userSettings';
import {
    ADD_PLACE_GROUP_TIME_SERIES,
    ADD_DRAWN_USER_PLACE,
    ADD_IMPORTED_USER_PLACE_GROUPS,
    CONFIGURE_SERVERS,
    DataAction,
    REMOVE_ALL_TIME_SERIES,
    REMOVE_USER_PLACE_GROUP,
    REMOVE_TIME_SERIES,
    REMOVE_TIME_SERIES_GROUP,
    REMOVE_USER_PLACE,
    RENAME_USER_PLACE,
    RENAME_USER_PLACE_GROUP,
    UPDATE_COLOR_BARS,
    UPDATE_DATASET_PLACE_GROUP,
    UPDATE_DATASETS,
    UPDATE_SERVER_INFO,
    UPDATE_TIME_SERIES,
    UPDATE_VARIABLE_COLOR_BAR,
    UPDATE_VARIABLE_VOLUME
} from '../actions/dataActions';
import { newId } from '../util/id';
import { Variable } from "../model/variable";
import { Place, USER_DRAWN_PLACE_GROUP_ID } from '../model/place';
import { TimeSeries, TimeSeriesGroup } from '../model/timeSeries';
import i18n from "../i18n";


export function dataReducer(state: DataState | undefined, action: DataAction): DataState {
    if (state === undefined) {
        state = newDataState();
    }
    switch (action.type) {
        case UPDATE_SERVER_INFO: {
            return {...state, serverInfo: action.serverInfo};
        }
        case UPDATE_DATASETS: {
            return {...state, datasets: action.datasets};
        }
        case UPDATE_VARIABLE_COLOR_BAR: {
            const {datasetId, variableName, colorBarMinMax, colorBarName, opacity} = action;
            const variableProps = {
                colorBarMin: colorBarMinMax[0],
                colorBarMax: colorBarMinMax[1],
                colorBarName,
                opacity,
            };
            return updateVariableProps(state, datasetId, variableName, variableProps);
        }
        case UPDATE_VARIABLE_VOLUME: {
            const {datasetId, variableName, volumeRenderMode, volumeIsoThreshold} = action;
            const variableProps = {
                volumeRenderMode,
                volumeIsoThreshold,
            };
            return updateVariableProps(state, datasetId, variableName, variableProps);
        }
        case UPDATE_DATASET_PLACE_GROUP: {
            // Issue #208:
            // We no longer set individual dataset place groups.
            // That's why action.datasetId is no longer used here.
            // Instead, we update all datasets that refer to the
            // place group with the given ID.
            const placeGroup = action.placeGroup;
            const datasets = state.datasets.map(dataset => {
                if (dataset.placeGroups) {
                    const placeGroupIndex = dataset.placeGroups.findIndex(pg => pg.id === placeGroup.id);
                    if (placeGroupIndex >= 0) {
                        const placeGroups = [...dataset.placeGroups];
                        placeGroups[placeGroupIndex] = placeGroup;
                        return {...dataset, placeGroups};
                    }
                }
                return dataset;
            });
            return {...state, datasets};
        }
        case ADD_DRAWN_USER_PLACE: {
            const {placeGroupTitle, id, properties, geometry} = action;
            const place: Place = {
                type: 'Feature',
                id,
                properties,
                geometry,
            };
            const userPlaceGroups = state.userPlaceGroups;
            const pgIndex = userPlaceGroups.findIndex(
                pg => pg.id === USER_DRAWN_PLACE_GROUP_ID
            );
            if (pgIndex >= 0) {
                const pg = userPlaceGroups[pgIndex];
                return {
                    ...state,
                    userPlaceGroups: [
                        ...userPlaceGroups.slice(0, pgIndex),
                        {
                            ...pg,
                            features: [
                                ...pg.features,
                                place,
                            ]
                        },
                        ...userPlaceGroups.slice(pgIndex + 1)
                    ],
                };
            } else {
                const title = Boolean(placeGroupTitle) && placeGroupTitle !== ''
                    ? placeGroupTitle
                    : i18n.get('My places');
                return {
                    ...state,
                    userPlaceGroups: [
                        {
                            type: 'FeatureCollection',
                            id: USER_DRAWN_PLACE_GROUP_ID,
                            title,
                            features: [place],
                        },
                        ...userPlaceGroups
                    ],
                };
            }
        }
        case ADD_IMPORTED_USER_PLACE_GROUPS: {
            const {placeGroups} = action;
            return {
                ...state,
                userPlaceGroups: [...state.userPlaceGroups, ...placeGroups]
            };
        }
        case RENAME_USER_PLACE_GROUP: {
            const {placeGroupId, newName} = action;
            const userPlaceGroups = state.userPlaceGroups;
            const pgIndex = userPlaceGroups.findIndex(pg => pg.id === placeGroupId);
            if (pgIndex >= 0) {
                const pg = userPlaceGroups[pgIndex];
                return {
                    ...state,
                    userPlaceGroups: [
                        ...userPlaceGroups.slice(0, pgIndex),
                        {...pg, title: newName},
                        ...userPlaceGroups.slice(pgIndex + 1)
                    ]
                };
            }
            return state;
        }
        case RENAME_USER_PLACE: {
            const {placeGroupId, placeId, newName} = action;
            const userPlaceGroups = state.userPlaceGroups;
            const pgIndex = userPlaceGroups.findIndex(pg => pg.id === placeGroupId);
            if (pgIndex >= 0) {
                const pg = userPlaceGroups[pgIndex];
                const features = pg.features;
                const pIndex = features.findIndex(p => p.id === placeId);
                if (pIndex >= 0) {
                    const p = features[pIndex];
                    return {
                        ...state,
                        userPlaceGroups: [
                            ...userPlaceGroups.slice(0, pgIndex),
                            {
                                ...pg,
                                features: [
                                    ...features.slice(0, pIndex),
                                    {
                                        ...p,
                                        properties: {
                                            ...p.properties,
                                            label: newName
                                        }
                                    },
                                    ...features.slice(pIndex + 1),
                                ]
                            },
                            ...userPlaceGroups.slice(pgIndex + 1)
                        ],
                    };
                }
            }
            return state;
        }
        case REMOVE_USER_PLACE: {
            const {placeGroupId, placeId} = action;
            const userPlaceGroups = state.userPlaceGroups;
            const pgIndex = userPlaceGroups.findIndex(pg => pg.id === placeGroupId);
            if (pgIndex >= 0) {
                const pg = userPlaceGroups[pgIndex];
                const pIndex = pg.features.findIndex(p => p.id === placeId);
                if (pIndex >= 0) {

                    const timeSeriesArray = getTimeSeriesArray(state.timeSeriesGroups, [placeId]);
                    let timeSeriesGroups = state.timeSeriesGroups;
                    timeSeriesArray.forEach(ts => {
                        timeSeriesGroups = updateTimeSeriesGroups(
                            timeSeriesGroups, ts, 'remove', 'append'
                        );
                    });

                    return {
                        ...state,
                        userPlaceGroups: [
                            ...userPlaceGroups.slice(0, pgIndex),
                            {
                                ...pg,
                                features: [
                                    ...pg.features.slice(0, pIndex),
                                    ...pg.features.slice(pIndex + 1),
                                ]
                            },
                            ...userPlaceGroups.slice(pgIndex + 1)
                        ],
                        timeSeriesGroups
                    };
                }
            }
            return state;
        }
        case REMOVE_USER_PLACE_GROUP: {
            const {placeGroupId} = action;
            const userPlaceGroups = state.userPlaceGroups;
            const pgIndex = userPlaceGroups.findIndex(pg => pg.id === placeGroupId);
            if (pgIndex >= 0) {
                const pg = userPlaceGroups[pgIndex];
                const userPlaceIds = pg.features.map(p => p.id);

                const timeSeriesArray = getTimeSeriesArray(state.timeSeriesGroups, userPlaceIds);
                let timeSeriesGroups = state.timeSeriesGroups;
                timeSeriesArray.forEach(ts => {
                    timeSeriesGroups = updateTimeSeriesGroups(
                        timeSeriesGroups, ts, 'remove', 'append'
                    );
                });

                return {
                    ...state,
                    userPlaceGroups: [
                        ...userPlaceGroups.slice(0, pgIndex),
                        ...userPlaceGroups.slice(pgIndex + 1)
                    ],
                    timeSeriesGroups
                };
            }
            return state;
        }
        case UPDATE_COLOR_BARS: {
            return {...state, colorBars: action.colorBars};
        }
        case ADD_PLACE_GROUP_TIME_SERIES: {
            const {timeSeriesGroupId, timeSeries} = action;
            const timeSeriesGroups = state.timeSeriesGroups;
            const tsgIndex = timeSeriesGroups.findIndex(tsg => tsg.id === timeSeriesGroupId);
            const timeSeriesGroup = timeSeriesGroups[tsgIndex];
            const newTimeSeriesGroups = [...timeSeriesGroups];
            newTimeSeriesGroups[tsgIndex] = {
                ...timeSeriesGroup,
                timeSeriesArray: [...timeSeriesGroup.timeSeriesArray, timeSeries]
            };
            return {...state, timeSeriesGroups: newTimeSeriesGroups};
        }
        case UPDATE_TIME_SERIES: {
            const {timeSeries, updateMode, dataMode} = action;
            const timeSeriesGroups = updateTimeSeriesGroups(state.timeSeriesGroups,
                timeSeries, updateMode, dataMode);
            if (timeSeriesGroups !== state.timeSeriesGroups) {
                return {...state, timeSeriesGroups};
            }
            return state;
        }
        case REMOVE_TIME_SERIES: {
            const tsgIndex = state.timeSeriesGroups.findIndex(tsg => tsg.id === action.groupId);
            if (tsgIndex >= 0) {
                const timeSeriesGroups = [...state.timeSeriesGroups];
                const timeSeriesGroup = {...timeSeriesGroups[tsgIndex]};
                const timeSeriesArray = [...timeSeriesGroup.timeSeriesArray];
                timeSeriesArray.splice(action.index, 1);
                timeSeriesGroup.timeSeriesArray = timeSeriesArray;
                timeSeriesGroups[tsgIndex] = timeSeriesGroup
                return {...state, timeSeriesGroups};
            }
            return state;
        }
        case REMOVE_TIME_SERIES_GROUP: {
            const tsgIndex = state.timeSeriesGroups.findIndex(tsg => tsg.id === action.id);
            if (tsgIndex >= 0) {
                const timeSeriesGroups = [...state.timeSeriesGroups];
                timeSeriesGroups.splice(tsgIndex, 1);
                return {...state, timeSeriesGroups};
            }
            return state;
        }
        case REMOVE_ALL_TIME_SERIES: {
            return {...state, timeSeriesGroups: []};
        }
        case CONFIGURE_SERVERS: {
            if (state.userServers !== action.servers) {
                storeUserServers(action.servers);
                return {...state, userServers: action.servers};
            }
            return state;
        }
    }

    return state!;
}


function updateVariableProps(state: DataState,
                             datasetId: string,
                             variableName: string,
                             variableProps: Partial<Variable>) {
    const datasetIndex = state.datasets.findIndex(ds => ds.id === datasetId);
    if (datasetIndex >= 0) {
        let dataset = state.datasets[datasetIndex];
        const variableIndex = dataset.variables.findIndex(v => v.name === variableName);
        if (variableIndex >= 0) {
            let variable = dataset.variables[variableIndex];
            let datasets = state.datasets.slice();
            let variables = dataset.variables.slice();
            variables[variableIndex] = {...variable, ...variableProps};
            datasets[datasetIndex] = {...dataset, variables};
            return {...state, datasets};
        }
    }
    return state;
}

function updateTimeSeriesGroups(timeSeriesGroups: TimeSeriesGroup[],
                                timeSeries: TimeSeries,
                                updateMode: 'add' | 'replace' | 'remove',
                                dataMode: 'append' | 'new'): TimeSeriesGroup[] {
    let currentTimeSeries = timeSeries;

    let newTimeSeriesGroups;
    const tsgIndex = timeSeriesGroups.findIndex(tsg => tsg.variableUnits === currentTimeSeries.source.variableUnits);
    if (tsgIndex >= 0) {
        const timeSeriesGroup = timeSeriesGroups[tsgIndex];
        const timeSeriesArray = timeSeriesGroup.timeSeriesArray;
        const tsIndex = timeSeriesArray.findIndex(ts => ts.source.datasetId === currentTimeSeries.source.datasetId
            && ts.source.variableName === currentTimeSeries.source.variableName
            && ts.source.placeId === currentTimeSeries.source.placeId);
        let newTimeSeriesArray;
        if (tsIndex >= 0) {
            const oldTimeSeries = timeSeriesArray[tsIndex];
            if (dataMode === 'append') {
                currentTimeSeries = {
                    ...currentTimeSeries,
                    data: [...currentTimeSeries.data, ...oldTimeSeries.data]
                };
            }
            if (updateMode === 'replace') {
                newTimeSeriesArray = [currentTimeSeries];
            } else if (updateMode === 'add') {
                newTimeSeriesArray = timeSeriesArray.slice();
                newTimeSeriesArray[tsIndex] = currentTimeSeries;
            } else /*if (action.updateMode === 'remove')*/ {
                newTimeSeriesArray = timeSeriesArray.slice();
                newTimeSeriesArray.splice(tsIndex, 1);
            }
        } else {
            if (updateMode === 'replace') {
                newTimeSeriesArray = [currentTimeSeries];
            } else if (updateMode === 'add') {
                newTimeSeriesArray = [currentTimeSeries, ...timeSeriesArray];
            } else /*if (action.updateMode === 'remove')*/ {
                // Nothing to do here.
                newTimeSeriesArray = timeSeriesArray;
            }
        }
        if (updateMode === 'replace') {
            newTimeSeriesGroups = [{...timeSeriesGroup, timeSeriesArray: newTimeSeriesArray}];
        } else if (updateMode === 'add') {
            newTimeSeriesGroups = timeSeriesGroups.slice();
            newTimeSeriesGroups[tsgIndex] = {...timeSeriesGroup, timeSeriesArray: newTimeSeriesArray};
        } else /*if (action.updateMode === 'remove')*/ {
            if (newTimeSeriesArray.length >= 0) {
                newTimeSeriesGroups = timeSeriesGroups.slice();
                newTimeSeriesGroups[tsgIndex] = {...timeSeriesGroup, timeSeriesArray: newTimeSeriesArray};
            } else {
                newTimeSeriesGroups = timeSeriesGroups.slice();
                newTimeSeriesGroups.splice(tsgIndex, 1)
            }
        }
    } else {
        if (updateMode === 'replace') {
            const newTimeSeriesGroup = {
                id: newId('ts-'),
                variableUnits: currentTimeSeries.source.variableUnits,
                timeSeriesArray: [currentTimeSeries],
            };
            newTimeSeriesGroups = [newTimeSeriesGroup];
        } else if (updateMode === 'add') {
            const newTimeSeriesGroup = {
                id: newId('ts-'),
                variableUnits: currentTimeSeries.source.variableUnits,
                timeSeriesArray: [currentTimeSeries],
            };
            newTimeSeriesGroups = [newTimeSeriesGroup, ...timeSeriesGroups];
        } else /*if (action.updateMode === 'remove')*/ {
            // Nothing to do here.
            newTimeSeriesGroups = timeSeriesGroups;
        }
    }

    return newTimeSeriesGroups;
}


function getTimeSeriesArray(timeSeriesGroups: TimeSeriesGroup[], placeIds: string[]): TimeSeries[] {
    const timeSeriesArray: TimeSeries[] = [];
    timeSeriesGroups.forEach(tsg => {
        tsg.timeSeriesArray.forEach(ts => {
            placeIds.forEach(placeId => {
                if (ts.source.placeId === placeId) {
                    timeSeriesArray.push(ts);
                }
            });
        })
    });
    return timeSeriesArray;
}
