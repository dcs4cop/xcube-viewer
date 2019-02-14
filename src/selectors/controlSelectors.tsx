import * as React from "react";
import { createSelector } from 'reselect'
import { AppState } from "../states/appState";
import { datasetsSelector } from "./dataSelectors";
import * as ol from "openlayers";

import { Dataset, Variable } from "../types/dataset";
import { Place, PlaceGroup } from "../types/place";
import { LayerElement } from 'src/components/ol/layer/Layers';
import { XYZ } from "../components/ol/layer/XYZ";

export const selectedDatasetIdSelector = (state: AppState) => state.controlState.selectedDatasetId;
export const selectedVariableNameSelector = (state: AppState) => state.controlState.selectedVariableName;

export const selectedDatasetSelector = createSelector(
    datasetsSelector,
    selectedDatasetIdSelector,
    (datasets: Dataset[], selectedDatasetId: string | null): Dataset | null => {
        return datasets.find(dataset => dataset.id === selectedDatasetId) || null;
    }
);

export const selectedDatasetVariablesSelector = createSelector(
    selectedDatasetSelector,
    (dataset: Dataset | null): Variable[] | null => {
        return (dataset && dataset.variables) || [];
    }
);

export const selectedDatasetPlaceGroupsSelector = createSelector(
    selectedDatasetSelector,
    (dataset: Dataset | null): PlaceGroup[] | null => {
        return (dataset && dataset.placeGroups) || [];
    }
);

/**
 * Get first-level features as a single array
 */
export const selectedDatasetPlacesSelector = createSelector(
    selectedDatasetPlaceGroupsSelector,
    (placeGroups: PlaceGroup[]): Place[] => {
        const args = placeGroups.map(placeGroup => placeGroup.features as Place[]);
        return ([] as  Array<Place>).concat(...args);
    }
);


export const selectedVariableSelector = createSelector(
    selectedDatasetSelector,
    selectedVariableNameSelector,
    (dataset: Dataset | null, variableName: string | null): Variable | null => {
        if (!dataset || !variableName) {
            return null;
        }
        return dataset.variables.find(variable => variable.name === variableName) || null;
    }
);


export const selectedVariableLayerSelector = createSelector(
    selectedVariableSelector,
    (variable: Variable | null): LayerElement => {
        if (!variable || !variable.tileSourceOptions) {
            return null;
        }
        const options = variable.tileSourceOptions;
        return <XYZ
            url={options.url}
            projection={ol.proj.get(options.projection)}
            minZoom={options.minZoom}
            maxZoom={options.maxZoom}
            tileGrid={new ol.tilegrid.TileGrid(options.tileGrid)}
        />;
    }
);
